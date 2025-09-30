
"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { InspectionForm } from "@/components/inspection-form";
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
import { Badge } from "@/components/ui/badge";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Inspection, getInspections, deleteInspection, updateInspectionStatus } from "@/lib/inspections";
import { getUsers, User } from "@/lib/users";
import { InspectionDetails } from "@/components/inspection-details";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";


export default function InspectionsPage() {
  const { toast } = useToast();
  const [inspections, setInspections] = React.useState<Inspection[]>([]);
  const [users, setUsers] = React.useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [editingInspection, setEditingInspection] = React.useState<Inspection | null>(null);
  const [viewingInspection, setViewingInspection] = React.useState<Inspection | null>(null);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedInspections, fetchedUsers] = await Promise.all([
        getInspections(),
        getUsers()
      ]);
      setInspections(fetchedInspections);
      setUsers(fetchedUsers);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to fetch data",
        description: "Could not load inspections or users.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFormSubmit = () => {
    fetchData();
    setIsSheetOpen(false);
    setEditingInspection(null);
  };
  
  const getInspectorName = (id: string) => {
    if (id === 'Unassigned') return 'Unassigned';
    const inspector = users.find(u => u.id === id);
    return inspector ? inspector.name : 'Unassigned';
  }

  const handleViewDetails = async (inspection: Inspection) => {
    setViewingInspection(inspection);
    if (inspection.status === 'Pending' || inspection.status === 'Requested') {
        const updated = await updateInspectionStatus(inspection.id, 'Viewed');
        if(updated) {
            if (window && (window as any).markNotificationAsRead) {
                (window as any).markNotificationAsRead(inspection.id, 'inspection');
            }
            fetchData();
        }
    }
  }

  const handleEdit = (inspection: Inspection) => {
    setEditingInspection(inspection);
    setIsSheetOpen(true);
  }

  const handleDelete = async (inspectionId: string) => {
    const success = await deleteInspection(inspectionId);
    if (success) {
      toast({
        title: "Inspection Deleted",
        description: "The inspection has been successfully deleted.",
      });
      fetchData();
    } else {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "Could not delete the inspection.",
      });
    }
  };

  const handleAssign = (inspection: Inspection) => {
    setEditingInspection(inspection);
    setIsSheetOpen(true);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Inspections</h1>
          <p className="text-muted-foreground">Manage and track all vehicle inspections.</p>
        </div>
        <Sheet open={isSheetOpen} onOpenChange={(isOpen) => {
            setIsSheetOpen(isOpen);
            if (!isOpen) setEditingInspection(null);
        }}>
          <SheetTrigger asChild>
            <Button onClick={() => { setEditingInspection(null); setIsSheetOpen(true); }}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Inspection
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-lg">
             <SheetHeader>
              <SheetTitle>{editingInspection ? "Edit Inspection" : "Create New Inspection"}</SheetTitle>
              <SheetDescription>
                {editingInspection ? "Update the details for this inspection." : "Fill out the details below to create and assign a new inspection."}
              </SheetDescription>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-8rem)]">
                <div className="py-4 px-1">
                    <InspectionForm onFormSubmit={handleFormSubmit} inspection={editingInspection} />
                </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Inspections</CardTitle>
          <CardDescription>A list of all scheduled and requested inspections.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Inspector</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : inspections.length > 0 ? (
                inspections.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">{submission.id}</TableCell>
                    <TableCell>
                        <div className="font-medium">{submission.fullName}</div>
                        <div className="text-sm text-muted-foreground">{submission.phoneNumber}</div>
                    </TableCell>
                    <TableCell>
                        <div>{submission.vehicleMake} {submission.vehicleModel}</div>
                        <div className="text-sm text-muted-foreground">{submission.registrationNumber}</div>
                    </TableCell>
                    <TableCell>{getInspectorName(submission.assignedToId)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        submission.status === 'Completed' ? 'secondary' : 
                        submission.status === 'Pending' ? 'default' : 
                        submission.status === 'Viewed' ? 'outline' : 
                        submission.status === 'Requested' ? 'destructive' : 'default'
                      }>
                        {submission.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                        <Badge variant={submission.source === 'API' ? 'outline' : 'default'}>
                            {submission.source}
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
                          {submission.status === 'Requested' && (
                             <DropdownMenuItem onClick={() => handleAssign(submission)}>Assign Inspector</DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleViewDetails(submission)}>View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(submission)}>Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <DropdownMenuItem className="text-red-600" onSelect={(e) => e.preventDefault()}>Delete</DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      This will permanently delete the inspection record. This action cannot be undone.
                                  </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(submission.id)} className="bg-destructive hover:bg-destructive/90">Yes, delete</AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No inspections found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Sheet open={!!viewingInspection} onOpenChange={(isOpen) => !isOpen && setViewingInspection(null)}>
        <SheetContent className="sm:max-w-lg">
            <SheetHeader>
                <SheetTitle>Inspection Details</SheetTitle>
                <SheetDescription>Viewing details for inspection ID: {viewingInspection?.id}</SheetDescription>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-8rem)]">
                <div className="py-4 px-1">
                    {viewingInspection && <InspectionDetails inspection={viewingInspection} users={users} />}
                </div>
            </ScrollArea>
        </SheetContent>
      </Sheet>

    </div>
  );
}
