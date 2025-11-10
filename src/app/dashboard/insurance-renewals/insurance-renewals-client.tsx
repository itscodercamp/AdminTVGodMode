
"use client";

import { Button } from "@/components/ui/button";
import { Loader2, MoreHorizontal } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getInsuranceRenewals, updateInsuranceRenewalStatus, deleteInsuranceRenewal, InsuranceRenewal } from "@/lib/insurance-renewals";

type InsuranceRenewalsClientProps = {
  initialRenewals: InsuranceRenewal[];
};

export function InsuranceRenewalsClient({ initialRenewals }: InsuranceRenewalsClientProps) {
  const [renewals, setRenewals] = React.useState<InsuranceRenewal[]>(initialRenewals);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const refreshRenewals = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedRenewals = await getInsuranceRenewals();
      setRenewals(fetchedRenewals);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to fetch renewals",
        description: "There was an error fetching insurance renewal requests.",
      });
    } finally {
       setIsLoading(false);
    }
  }, [toast]);

  const handleStatusChange = async (id: string, status: 'Contacted' | 'Closed') => {
    const updated = await updateInsuranceRenewalStatus(id, status);
    if (updated) {
        toast({ title: "Status Updated", description: `Request status changed to ${status}.`});
        refreshRenewals();
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteInsuranceRenewal(id);
    if (success) {
      toast({
        title: "Request Deleted",
        description: "The insurance renewal request has been successfully deleted.",
      });
      refreshRenewals();
    } else {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "Could not delete the request.",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Insurance Renewal Requests</h1>
          <p className="text-muted-foreground">Manage all incoming insurance renewal requests.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>A list of all insurance renewal requests from newest to oldest.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Registration No.</TableHead>
                <TableHead>Insurance Type</TableHead>
                <TableHead>Date</TableHead>
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
              ) : renewals.length > 0 ? (
                renewals.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                        <div className="font-medium">{request.name}</div>
                        <div className="text-sm text-muted-foreground">{request.phone}</div>
                    </TableCell>
                    <TableCell>{request.registrationNumber}</TableCell>
                    <TableCell>{request.insuranceType}</TableCell>
                    <TableCell>{format(new Date(request.createdAt), "PPP")}</TableCell>
                    <TableCell>
                      <Badge variant={request.status === 'New' ? 'default' : request.status === 'Contacted' ? 'secondary' : 'outline'}>
                        {request.status}
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
                          {request.status === 'New' && <DropdownMenuItem onClick={() => handleStatusChange(request.id, 'Contacted')}>Mark as Contacted</DropdownMenuItem>}
                          {request.status === 'Contacted' && <DropdownMenuItem onClick={() => handleStatusChange(request.id, 'Closed')}>Mark as Closed</DropdownMenuItem>}
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <DropdownMenuItem className="text-red-600" onSelect={(e) => e.preventDefault()}>Delete</DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      This will permanently delete the request from "{request.name}". This action cannot be undone.
                                  </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(request.id)} className="bg-destructive hover:bg-destructive/90">Yes, delete</AlertDialogAction>
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
                  <TableCell colSpan={6} className="text-center h-24">
                    No insurance renewal requests found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
