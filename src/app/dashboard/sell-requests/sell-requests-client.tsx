
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
import { getSellCarRequests, deleteSellCarRequest, SellCarRequest, updateSellCarRequestStatus } from "@/lib/sell-requests";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const DetailItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="grid grid-cols-3 gap-2 py-3 border-b">
        <dt className="font-semibold text-muted-foreground">{label}</dt>
        <dd className="col-span-2">{value}</dd>
    </div>
);

function RequestDetails({ request }: { request: SellCarRequest }) {
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
                
                <div className="pt-4 font-bold text-base text-foreground">Seller Info</div>
                <DetailItem label="Name" value={request.sellerName} />
                <DetailItem label="Email" value={request.email} />
                <DetailItem label="Phone" value={request.phone} />
                <DetailItem label="City" value={request.city} />

                <div className="pt-4 font-bold text-base text-foreground">Vehicle Info</div>
                <DetailItem label="Make" value={request.make} />
                <DetailItem label="Model" value={request.model} />
                <DetailItem label="Year" value={request.year} />
                <DetailItem label="Variant" value={request.variant} />
                <DetailItem label="Fuel" value={request.fuelType} />
                <DetailItem label="Transmission" value={request.transmission} />
                <DetailItem label="KM Driven" value={request.kmDriven} />
                <DetailItem label="Ownership" value={request.owners} />
                <DetailItem label="Reg. State" value={request.registrationState} />
                
                <div className="py-3">
                    <dt className="font-semibold text-muted-foreground mb-2">Description</dt>
                    <dd className="p-3 bg-secondary rounded-md whitespace-pre-wrap">{request.description || 'N/A'}</dd>
                </div>
            </dl>
        </div>
    );
}

type SellRequestsClientProps = {
  initialRequests: SellCarRequest[];
};

export function SellRequestsClient({ initialRequests }: SellRequestsClientProps) {
  const [requests, setRequests] = React.useState<SellCarRequest[]>(initialRequests);
  const [isLoading, setIsLoading] = React.useState(false);
  const [viewingRequest, setViewingRequest] = React.useState<SellCarRequest | null>(null);
  const { toast } = useToast();

  const refreshRequests = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedRequests = await getSellCarRequests();
      setRequests(fetchedRequests);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to fetch requests",
        description: "There was an error fetching sell car requests.",
      });
    } finally {
       setIsLoading(false);
    }
  }, [toast]);
  
  const handleViewDetails = async (request: SellCarRequest) => {
    setViewingRequest(request);
    if (request.status === 'New') {
        const updated = await updateSellCarRequestStatus(request.id, 'Contacted');
        if (updated) {
            refreshRequests();
        }
    }
  };

  const handleDelete = async (requestId: string) => {
    const success = await deleteSellCarRequest(requestId);
    if (success) {
      toast({
        title: "Request Deleted",
        description: "The sell car request has been successfully deleted.",
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
          <h1 className="text-3xl font-bold font-headline">Sell Car Requests</h1>
          <p className="text-muted-foreground">Manage all incoming sell enquiries from the website.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>A list of all sell car requests from newest to oldest.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seller</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                 <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    </TableCell>
                </TableRow>
              ) : requests.length > 0 ? (
                requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                        <div className="font-medium">{request.sellerName}</div>
                        <div className="text-sm text-muted-foreground">{request.phone}</div>
                    </TableCell>
                    <TableCell>
                        <div className="font-medium">{request.make} {request.model}</div>
                        <div className="text-sm text-muted-foreground">{request.year} ({request.fuelType})</div>
                    </TableCell>
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
                                      This will permanently delete the request from "{request.sellerName}". This action cannot be undone.
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
                  <TableCell colSpan={5} className="text-center h-24">
                    No sell requests found.
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
                <SheetTitle>Sell Request Details</SheetTitle>
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

    