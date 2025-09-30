
"use client";

import React from "react";
import { Loader2, MoreHorizontal, History, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { getDeletedUsers, User, restoreUser, permanentlyDeleteUser } from "@/lib/users";
import { getDeletedDealers, Dealer, restoreDealer, permanentlyDeleteDealer } from "@/lib/dealers";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { UserProfile } from "@/components/user-profile";
import { DealerDetails } from "@/components/dealer-details";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type ItemToProcess = {
  id: string;
  name: string;
  type: 'user' | 'dealer';
}

export default function OutUsersPage() {
  const [deletedUsers, setDeletedUsers] = React.useState<Omit<User, 'password'>[]>([]);
  const [deletedDealers, setDeletedDealers] = React.useState<Dealer[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [viewingUser, setViewingUser] = React.useState<Omit<User, 'password'> | null>(null);
  const [viewingDealer, setViewingDealer] = React.useState<Dealer | null>(null);
  const [itemToRestore, setItemToRestore] = React.useState<ItemToProcess | null>(null);
  const [itemToDelete, setItemToDelete] = React.useState<ItemToProcess | null>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = React.useState("");
  const { toast } = useToast();

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [users, dealers] = await Promise.all([
        getDeletedUsers(),
        getDeletedDealers(),
      ]);
      setDeletedUsers(users);
      setDeletedDealers(dealers);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to fetch data",
        description: "Could not load archived users and dealers.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRestore = async () => {
    if (!itemToRestore) return;

    let success = false;
    if (itemToRestore.type === 'user') {
      success = await restoreUser(itemToRestore.id);
    } else {
      success = await restoreDealer(itemToRestore.id);
    }

    if (success) {
      toast({
        title: "Restored Successfully",
        description: `${itemToRestore.name} has been restored to active status.`,
      });
      fetchData(); // Refresh the list
    } else {
      toast({
        variant: "destructive",
        title: "Restore Failed",
        description: `Could not restore ${itemToRestore.name}.`,
      });
    }
    setItemToRestore(null);
  };
  
  const handlePermanentDelete = async () => {
    if (!itemToDelete) return;

    let success = false;
    if (itemToDelete.type === 'user') {
        success = await permanentlyDeleteUser(itemToDelete.id);
    } else {
        success = await permanentlyDeleteDealer(itemToDelete.id);
    }

    if (success) {
        toast({
            variant: "destructive",
            title: "Deleted Permanently",
            description: `${itemToDelete.name} has been permanently deleted from the database.`,
        });
        fetchData();
    } else {
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: `Could not permanently delete ${itemToDelete.name}.`,
        });
    }
    setItemToDelete(null);
    setDeleteConfirmationInput("");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Out Users</h1>
        <p className="text-muted-foreground">
          View, restore, or permanently delete terminated employees and removed dealers.
        </p>
      </div>

      <Tabs defaultValue="employees">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="employees">Terminated Employees</TabsTrigger>
          <TabsTrigger value="dealers">Removed Dealers</TabsTrigger>
        </TabsList>
        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>Terminated Employees</CardTitle>
              <CardDescription>
                A list of all employees who have been terminated.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Termination Date</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>
                  ) : deletedUsers.length > 0 ? (
                    deletedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.id}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.deletedAt ? format(new Date(user.deletedAt), "PPP") : 'N/A'}</TableCell>
                        <TableCell>{user.deletionReason}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setViewingUser(user)}>View Details</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setItemToRestore({ id: user.id, name: user.name, type: 'user' })}><History className="mr-2 h-4 w-4" />Restore</DropdownMenuItem>
                               <DropdownMenuSeparator />
                               <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()} onClick={() => setItemToDelete({id: user.id, name: user.name, type: 'user'})}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Permanently
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={5} className="h-24 text-center">No terminated employees found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="dealers">
           <Card>
            <CardHeader>
              <CardTitle>Removed Dealers</CardTitle>
              <CardDescription>
                A list of all dealers who have been removed from the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dealership Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Removal Date</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>
                  ) : deletedDealers.length > 0 ? (
                    deletedDealers.map((dealer) => (
                      <TableRow key={dealer.id}>
                        <TableCell>{dealer.dealershipName}</TableCell>
                        <TableCell>{dealer.ownerName}</TableCell>
                        <TableCell>{dealer.deletedAt ? format(new Date(dealer.deletedAt), "PPP") : 'N/A'}</TableCell>
                        <TableCell>{dealer.deletionReason}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setViewingDealer(dealer)}>View Details</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setItemToRestore({ id: dealer.id, name: dealer.dealershipName, type: 'dealer' })}><History className="mr-2 h-4 w-4" />Restore</DropdownMenuItem>
                               <DropdownMenuSeparator />
                               <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()} onClick={() => setItemToDelete({id: dealer.id, name: dealer.dealershipName, type: 'dealer'})}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Permanently
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={5} className="h-24 text-center">No removed dealers found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Restore Confirmation Dialog */}
      {itemToRestore && (
        <AlertDialog open={!!itemToRestore} onOpenChange={(isOpen) => !isOpen && setItemToRestore(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to restore?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will restore <span className="font-bold">{itemToRestore.name}</span> to an 'Active' status. They will reappear in the main employee/dealer lists.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRestore} className="bg-success hover:bg-success/90">Yes, Restore</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

       {/* Permanent Delete Confirmation Dialog */}
      {itemToDelete && (
         <AlertDialog open={!!itemToDelete} onOpenChange={(isOpen) => !isOpen && setItemToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                       This action is irreversible. This will permanently delete <span className="font-bold">{itemToDelete.name}</span> and all associated data from the database.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                 <div className="space-y-2 py-2">
                    <Label htmlFor="confirm-delete-input" className="font-bold text-foreground">
                        To confirm, type <strong className="text-destructive">DELETE PERMANENTLY</strong> below.
                    </Label>
                    <Input 
                        id="confirm-delete-input"
                        value={deleteConfirmationInput}
                        onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                        placeholder="DELETE PERMANENTLY"
                    />
                 </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handlePermanentDelete} 
                      disabled={deleteConfirmationInput !== 'DELETE PERMANENTLY'}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Yes, delete permanently
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

      {/* User Details Sheet */}
       <Sheet open={!!viewingUser} onOpenChange={(isOpen) => !isOpen && setViewingUser(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Terminated Employee Profile</SheetTitle>
            <SheetDescription>Viewing details for {viewingUser?.name}.</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="py-4 px-1">
              {viewingUser && <UserProfile user={viewingUser} />}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Dealer Details Sheet */}
       <Sheet open={!!viewingDealer} onOpenChange={(isOpen) => !isOpen && setViewingDealer(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Removed Dealer Details</SheetTitle>
            <SheetDescription>Viewing details for {viewingDealer?.dealershipName}.</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="py-4 px-1">
              {viewingDealer && <DealerDetails dealer={viewingDealer} />}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

    </div>
  );
}
