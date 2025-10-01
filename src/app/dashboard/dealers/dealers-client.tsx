
"use client";

import React from "react";
import { PlusCircle, MoreHorizontal, Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DealerForm } from "@/components/dealer-form";
import { getDealers, updateDealer, deleteDealer, DealerWithLeads } from "@/lib/dealers";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DealerDetails } from "@/components/dealer-details";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type DealersClientProps = {
  initialDealers: DealerWithLeads[];
};

export function DealersClient({ initialDealers }: DealersClientProps) {
  const [dealers, setDealers] = React.useState<DealerWithLeads[]>(initialDealers);
  const [isLoading, setIsLoading] = React.useState(false);
  const [editingDealer, setEditingDealer] = React.useState<DealerWithLeads | null>(null);
  const [viewingDealer, setViewingDealer] = React.useState<DealerWithLeads | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [dealerToDelete, setDealerToDelete] = React.useState<DealerWithLeads | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = React.useState("");
  const [deleteReason, setDeleteReason] = React.useState("");
  const { toast } = useToast();

  const refreshDealers = async () => {
    setIsLoading(true);
    try {
      const fetchedDealers = await getDealers();
      setDealers(fetchedDealers);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to fetch dealers",
        description: "There was an error fetching dealer data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = () => {
    refreshDealers();
    setIsSheetOpen(false);
    setEditingDealer(null);
  };

  const handleEdit = (dealer: DealerWithLeads) => {
    setEditingDealer(dealer);
    setIsSheetOpen(true);
  };

  const openDeleteDialog = (dealer: DealerWithLeads) => {
    setDealerToDelete(dealer);
    setDeleteReason("");
    setDeleteConfirmationInput("");
    setIsDeleteAlertOpen(true);
  };

  const handleDelete = async () => {
    if (!dealerToDelete || !deleteReason) {
      toast({ variant: "destructive", title: "Reason Required", description: "Please provide a reason for removing the dealer." });
      return;
    }
    const success = await deleteDealer(dealerToDelete.id, deleteReason);
    if (success) {
      toast({
        title: "Dealer Removed",
        description: "The dealer has been moved to the 'Out Users' section.",
      });
      refreshDealers();
    } else {
      toast({
        variant: "destructive",
        title: "Removal Failed",
        description: "Could not remove the dealer.",
      });
    }
    setIsDeleteAlertOpen(false);
    setDealerToDelete(null);
  };
  
  const toggleDealerStatus = async (dealer: DealerWithLeads) => {
    const newStatus = dealer.status === 'Active' ? 'Inactive' : 'Active';
    const updatedDealer = await updateDealer(dealer.id, { status: newStatus });
    if (updatedDealer) {
      toast({
        title: "Status Updated",
        description: `Dealer ${dealer.dealershipName} has been set to ${newStatus}.`,
      });
      refreshDealers();
    } else {
       toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update dealer status.",
      });
    }
  };

  const handleViewDetails = (dealer: DealerWithLeads) => {
    setViewingDealer(dealer);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Dealer Management</h1>
          <p className="text-muted-foreground">Manage all linked dealers.</p>
        </div>
        <Sheet open={isSheetOpen} onOpenChange={(isOpen) => {
            setIsSheetOpen(isOpen);
            if (!isOpen) setEditingDealer(null);
        }}>
          <SheetTrigger asChild>
            <Button onClick={() => { setEditingDealer(null); setIsSheetOpen(true); }}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Dealer
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>{editingDealer ? "Edit Dealer" : "Add New Dealer"}</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-8rem)]">
              <div className="py-4 px-1">
                <DealerForm
                  dealer={editingDealer}
                  onFormSubmit={handleFormSubmit}
                />
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Dealers</CardTitle>
          <CardDescription>A list of all active and inactive dealers in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dealer ID</TableHead>
                <TableHead>Dealership Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Leads Count</TableHead>
                <TableHead>Status</TableHead>
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
              ) : dealers.length > 0 ? (
                dealers.map((dealer) => (
                  <TableRow key={dealer.id}>
                    <TableCell className="font-medium">{dealer.id.substring(0,8)}...</TableCell>
                    <TableCell>{dealer.dealershipName}</TableCell>
                    <TableCell>{dealer.ownerName}</TableCell>
                    <TableCell>
                        <div>{dealer.email}</div>
                        <div className="text-sm text-muted-foreground">{dealer.phone}</div>
                    </TableCell>
                    <TableCell className="font-medium text-center">{dealer.leadsCount}</TableCell>
                    <TableCell>
                      <Badge variant={dealer.status === 'Active' ? 'secondary' : 'outline'}>
                        {dealer.status}
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
                           <DropdownMenuItem onClick={() => handleViewDetails(dealer)}>View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(dealer)}>Edit Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleDealerStatus(dealer)}>
                            {dealer.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                              className="text-red-600" 
                              onSelect={(e) => e.preventDefault()}
                              onClick={() => openDeleteDialog(dealer)}
                            >
                              <Building2 className="mr-2 h-4 w-4"/> Remove
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No dealers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {dealerToDelete && (
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={(isOpen) => {
            if (!isOpen) {
              setIsDeleteAlertOpen(false);
              setDealerToDelete(null);
            }
        }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This will remove the dealer <span className="font-bold">{dealerToDelete.dealershipName}</span> and move them to the "Out Users" archive. This is reversible.
                      <br/><br/>
                      Please provide a reason for this action.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                 <div className="space-y-2 py-2">
                    <Label htmlFor="delete-reason">Reason for Removal</Label>
                    <Textarea
                        id="delete-reason"
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        placeholder="e.g., Contract ended, Poor service, etc."
                    />
                     <Label htmlFor="confirm-delete-input" className="font-bold text-foreground">
                        To confirm, type <strong className="text-destructive">DELETE</strong> below.
                    </Label>
                    <Input 
                        id="confirm-delete-input"
                        value={deleteConfirmationInput}
                        onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                        placeholder="DELETE"
                    />
                 </div>

                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)}>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    disabled={deleteConfirmationInput !== 'DELETE' || !deleteReason}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Yes, remove dealer
                  </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}


      <Sheet open={!!viewingDealer} onOpenChange={(isOpen) => !isOpen && setViewingDealer(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Dealer Details</SheetTitle>
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

    