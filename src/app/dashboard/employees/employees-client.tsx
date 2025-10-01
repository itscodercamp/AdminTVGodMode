
"use client";

import React from "react";
import { PlusCircle, MoreHorizontal, Loader2, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { UserForm } from "@/components/user-form";
import { getUsers, User, deleteUser, updateUser } from "@/lib/users";
import { useToast } from "@/hooks/use-toast";
import { UserProfile } from "@/components/user-profile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type EmployeesClientProps = {
  initialUsers: Omit<User, 'password'>[];
};

export function EmployeesClient({ initialUsers }: EmployeesClientProps) {
  const [users, setUsers] = React.useState<Omit<User, 'password'>[]>(initialUsers);
  const [isLoading, setIsLoading] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<Omit<User, 'password'> | null>(null);
  const [viewingUser, setViewingUser] = React.useState<Omit<User, 'password'> | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<Omit<User, 'password'> | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = React.useState("");
  const [deleteReason, setDeleteReason] = React.useState("");
  const [customDeleteReason, setCustomDeleteReason] = React.useState("");
  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers.filter(u => u.email !== 'trustedvehiclesofficial@gmail.com'));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to fetch employees",
        description: "There was an error fetching the employee data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = () => {
    fetchUsers(); 
    setIsSheetOpen(false);
    setEditingUser(null);
  };

  const handleEdit = (user: Omit<User, 'password'>) => {
    setEditingUser(user);
    setIsSheetOpen(true);
  };
  
  const openDeleteDialog = (user: Omit<User, 'password'>) => {
    setUserToDelete(user);
    setDeleteReason("");
    setCustomDeleteReason("");
    setDeleteConfirmationInput("");
    setIsDeleteAlertOpen(true);
  }

  const handleDelete = async () => {
    if (!userToDelete) return;
    
    const finalDeleteReason = deleteReason === 'Other' ? customDeleteReason : deleteReason;

    if (!finalDeleteReason) {
      toast({ variant: "destructive", title: "Reason Required", description: "Please provide a reason for deletion." });
      return;
    }

    const success = await deleteUser(userToDelete.id, finalDeleteReason);
    if (success) {
      toast({
        title: "Employee Terminated",
        description: "The employee has been moved to the 'Out Users' section.",
      });
      fetchUsers();
    } else {
      toast({
        variant: "destructive",
        title: "Termination Failed",
        description: "Could not terminate the employee.",
      });
    }
    setIsDeleteAlertOpen(false);
    setUserToDelete(null);
  };
  
  const toggleUserStatus = async (user: User) => {
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    const updatedUser = await updateUser(user.id, { status: newStatus });
    if(updatedUser) {
      toast({
        title: "Status Updated",
        description: `Employee ${user.name} has been set to ${newStatus}.`,
      });
      fetchUsers();
    } else {
       toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update employee status.",
      });
    }
  };

  const handleViewProfile = (user: Omit<User, 'password'>) => {
    setViewingUser(user);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Employee Management</h1>
          <p className="text-muted-foreground">Manage all registered employees.</p>
        </div>
        <Sheet open={isSheetOpen} onOpenChange={(isOpen) => {
            setIsSheetOpen(isOpen);
            if (!isOpen) setEditingUser(null);
        }}>
          <SheetTrigger asChild>
            <Button onClick={() => { setEditingUser(null); setIsSheetOpen(true); }}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Employee
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>{editingUser ? "Edit Employee" : "Add New Employee"}</SheetTitle>
            </SheetHeader>
                <UserForm
                    user={editingUser}
                    onFormSubmit={handleFormSubmit}
                />
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Employees</CardTitle>
          <CardDescription>A list of all active and inactive employees in the system (excluding admin).</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.id}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.designation}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'Active' ? 'secondary' : 'outline'}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewProfile(user)}>View Profile</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(user)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleUserStatus(user)}>
                            {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600" 
                            onSelect={(e) => e.preventDefault()}
                            onClick={() => openDeleteDialog(user)}
                          >
                            <UserX className="mr-2 h-4 w-4"/> Terminate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No employees found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {userToDelete && (
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={(isOpen) => {
            if (!isOpen) {
              setIsDeleteAlertOpen(false);
              setUserToDelete(null);
            }
        }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will terminate the employee <span className="font-bold">{userToDelete.name}</span> and move them to the "Out Users" archive. This is reversible.
                    <br/><br/>
                    Please provide a reason for termination.
                </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4 py-2">
                    <RadioGroup value={deleteReason} onValueChange={setDeleteReason}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Resigned" id="r1" />
                            <Label htmlFor="r1">Resigned</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Terminated" id="r2" />
                            <Label htmlFor="r2">Terminated (Contract/Policy Violation)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Bad Performance" id="r3" />
                            <Label htmlFor="r3">Bad Performance</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Other" id="r4" />
                            <Label htmlFor="r4">Other</Label>
                        </div>
                    </RadioGroup>
                    {deleteReason === 'Other' && (
                        <Input 
                            value={customDeleteReason}
                            onChange={(e) => setCustomDeleteReason(e.target.value)}
                            placeholder="Please specify the reason"
                        />
                    )}
                    <Label htmlFor="confirm-delete-input" className="font-bold text-foreground">
                        To confirm, type <strong className="text-destructive">TERMINATE</strong> below.
                    </Label>
                    <Input 
                        id="confirm-delete-input"
                        value={deleteConfirmationInput}
                        onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                        placeholder="TERMINATE"
                    />
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)}>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                      onClick={handleDelete} 
                      disabled={deleteConfirmationInput !== 'TERMINATE' || !deleteReason}
                      className="bg-destructive hover:bg-destructive/90"
                  >
                      Yes, terminate employee
                  </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

      <Sheet open={!!viewingUser} onOpenChange={(isOpen) => !isOpen && setViewingUser(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Employee Profile</SheetTitle>
            <SheetDescription>Viewing details for {viewingUser?.name}.</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="py-4 px-1">
              {viewingUser && <UserProfile user={viewingUser} />}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

    </div>
  );
}

    