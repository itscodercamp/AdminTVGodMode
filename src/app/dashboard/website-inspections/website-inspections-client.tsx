
"use client";

import { Button } from "@/components/ui/button";
import { Loader2, MoreHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getWebsiteInspections, deleteWebsiteInspection, WebsiteInspection, updateWebsiteInspectionStatus } from "@/lib/website-inspections";

const DetailItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="grid grid-cols-3 gap-2 py-3 border-b">
        <dt className="font-semibold text-muted-foreground">{label}</dt>
        <dd className="col-span-2">{value || 'N/A'}</dd>
    </div>
);

function RequestDetails({ request }: { request: WebsiteInspection }) {
    const fullAddress = [request.street, request.city, request.state, request.pinCode].filter(Boolean).join(', ');
    return (
        <div className="space-y-4 text-sm">
            <dl>
                <DetailItem label="Request ID" value={request.id} />
                <DetailItem label="Date" value={format(new Date(request.createdAt), "PPP p")} />
                <DetailItem label="Status" value={
                    <Badge variant={request.status === 'New' ? 'default' : 'secondary'}>
                        {request.status}
                    </Badge>
                } />
                
                <div className="pt-4 font-bold text-base text-foreground">Requester Info</div>
                <DetailItem label="Name" value={request.fullName} />
                <DetailItem label="Phone" value={request.phoneNumber} />
                <DetailItem label="Location" value={fullAddress} />


                <div className="pt-4 font-bold text-base text-foreground">Vehicle Info</div>
                <DetailItem label="Make" value={request.carMake} />
                <DetailItem label="Model" value={request.carModel} />
                <DetailItem label="Year" value={request.carYear} />
                <DetailItem label="Reg. Number" value={request.registrationNumber} />

                <div className="pt-4 font-bold text-base text-foreground">Inspection Details</div>
                <DetailItem label="Inspection Type" value={request.inspectionType} />
            </dl>
        </div>
    );
}

type WebsiteInspectionsClientProps = {
  initialRequests: WebsiteInspection[];
};

export function WebsiteInspectionsClient({ initialRequests }: WebsiteInspectionsClientProps) {
  const [requests, setRequests] = React.useState<WebsiteInspection[]>(initialRequests);
  const [isLoading, setIsLoading] = React.useState(false);
  const [viewingRequest, setViewingRequest] = React.useState<WebsiteInspection | null>(null);
  const { toast } = useToast();

  const refreshRequests = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedRequests = await getWebsiteInspections();
      setRequests(fetchedRequests);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to fetch requests",
        description: "There was an error fetching website inspection requests.",
      });
    } finally {
       setIsLoading(false);
    }
  }, [toast]);
  
  const handleViewDetails = async (request: WebsiteInspection) => {
    setViewingRequest(request);
    if (request.status === 'New') {
        const updated = await updateWebsiteInspectionStatus(request.id, 'Viewed');
        if (updated) {
            refreshRequests();
        }
    }
  };

  const handleDelete = async (requestId: string) => {
    const success = await deleteWebsiteInspection(requestId);
    if (success) {
      toast({
        title: "Request Deleted",
        description: "The inspection request has been successfully deleted.",
      });
      refreshRequests();
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
          <h1 className="text-3xl font-bold font-headline">Website Inspection Requests</h1>
          <p className="text-muted-foreground">Manage all inspection requests submitted via the website.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>A list of all incoming website inspection requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requester</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Inspection Type</TableHead>
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
              ) : requests.length > 0 ? (
                requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                        <div className="font-medium">{request.fullName}</div>
                        <div className="text-sm text-muted-foreground">{request.phoneNumber}</div>
                    </TableCell>
                    <TableCell>
                        <div className="font-medium">{request.carMake} {request.carModel}</div>
                        <div className="text-sm text-muted-foreground">{request.registrationNumber}</div>
                    </TableCell>
                    <TableCell>{request.inspectionType}</TableCell>
                    <TableCell>{format(new Date(request.createdAt), "PPP")}</TableCell>
                    <TableCell>
                      <Badge variant={request.status === 'New' ? 'default' : 'secondary'}>
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
                          <DropdownMenuItem onClick={() => handleViewDetails(request)}>View Details</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <DropdownMenuItem className="text-red-600" onSelect={(e) => e.preventDefault()}>Delete</DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      This will permanently delete the request from "{request.fullName}". This action cannot be undone.
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
                    No website inspection requests found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!viewingRequest} onOpenChange={(isOpen) => !isOpen && setViewingRequest(null)}>
        <SheetContent className="sm:max-w-lg">
            <SheetHeader>
                <SheetTitle>Inspection Request Details</SheetTitle>
                <SheetDescription>Viewing details for request ID: {viewingRequest?.id.substring(0,8)}...</SheetDescription>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-8rem)]">
                <div className="py-4 px-1">
                    {viewingRequest && <RequestDetails request={viewingRequest} />}
                </div>
            </ScrollArea>
        </SheetContent>
      </Sheet>

    </div>
  );
}

    