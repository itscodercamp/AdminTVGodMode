
"use client";

import Image from "next/image";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { differenceInDays, parseISO, format } from "date-fns";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { MarketplaceItemDetails } from "@/components/marketplace-item-details";
import { getMarketplaceVehicles, MarketplaceVehicle, deleteMarketplaceVehicle, updateMarketplaceVehicle } from "@/lib/marketplace";
import { VehicleForm } from "@/components/vehicle-form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getBanners, deleteBanner, MarketplaceBanner } from "@/lib/banners";
import { getMarketplaceUsers, SafeMarketplaceUser } from "@/lib/marketplace-users";
import { BannerForm } from "@/components/banner-form";
import { getMarketplaceInquiries, FullInquiry, updateMarketplaceInquiryStatus, deleteMarketplaceInquiry } from "@/lib/marketplace-inquiries";
import { getMarketplaceContactMessages, MarketplaceContact, updateMarketplaceContactStatus, deleteMarketplaceContact } from "@/lib/marketplace-contact";

const getFullImageUrl = (path: string | null | undefined) => {
  if (!path) return 'https://placehold.co/100x60/eee/ccc?text=No+Image';
  if (path.startsWith('http')) return path;
  // Use the new API route for images
  return `/api/images${path.startsWith('/') ? '' : '/'}${path}`;
};


const pendingVehicles: any[] = [];

export type ItemDetails = {
    type: 'Inquiry' | 'Live Vehicle' | 'Pending Vehicle' | 'Sold Vehicle' | 'Message' | 'Customer' | 'Dealer' | 'Banner';
    data: any;
};

type MarketplaceClientProps = {
    initialData: {
        liveVehicles: MarketplaceVehicle[];
        soldVehicles: MarketplaceVehicle[];
        banners: MarketplaceBanner[];
        customerUsers: SafeMarketplaceUser[];
        dealerUsers: SafeMarketplaceUser[];
        inquiries: FullInquiry[];
        contactMessages: MarketplaceContact[];
    }
};

export function MarketplaceClient({ initialData }: MarketplaceClientProps) {
    const { toast } = useToast();
    const [liveVehicles, setLiveVehicles] = React.useState<MarketplaceVehicle[]>(initialData.liveVehicles);
    const [soldVehicles, setSoldVehicles] = React.useState<MarketplaceVehicle[]>(initialData.soldVehicles);
    const [banners, setBanners] = React.useState<MarketplaceBanner[]>(initialData.banners);
    const [customerUsers, setCustomerUsers] = React.useState<SafeMarketplaceUser[]>(initialData.customerUsers);
    const [dealerUsers, setDealerUsers] = React.useState<SafeMarketplaceUser[]>(initialData.dealerUsers);
    const [inquiries, setInquiries] = React.useState<FullInquiry[]>(initialData.inquiries);
    const [contactMessages, setContactMessages] = React.useState<MarketplaceContact[]>(initialData.contactMessages);
    const [isLoading, setIsLoading] = React.useState(false);
    const [liveCategoryFilter, setLiveCategoryFilter] = React.useState<'all' | '4w' | '2w'>('all');
    const [soldCategoryFilter, setSoldCategoryFilter] = React.useState<'all' | '4w' | '2w'>('all');
    const [viewingItem, setViewingItem] = React.useState<ItemDetails | null>(null);
    const [editingItem, setEditingItem] = React.useState<ItemDetails | null>(null);
    const [actionItem, setActionItem] = React.useState<{ type: 'delist' | 'reject' | 'delete' | 'approve' | 'delete-banner' | 'delete-inquiry' | 'delete-message', data: any } | null>(null);
    const [isSheetOpen, setIsSheetOpen] = React.useState(false);
    const [isBannerSheetOpen, setIsBannerSheetOpen] = React.useState(false);


    const refreshData = React.useCallback(async () => {
      setIsLoading(true);
      try {
        const [
            fetchedVehicles,
            fetchedBanners,
            fetchedMarketplaceUsers,
            fetchedInquiries,
            fetchedContacts
        ] = await Promise.all([
          getMarketplaceVehicles(),
          getBanners(),
          getMarketplaceUsers(),
          getMarketplaceInquiries(),
          getMarketplaceContactMessages(),
        ]);
        setLiveVehicles(fetchedVehicles.filter(v => v.status === 'For Sale' || v.status === 'Paused'));
        setSoldVehicles(fetchedVehicles.filter(v => v.status === 'Sold'));
        setBanners(fetchedBanners);
        setCustomerUsers(fetchedMarketplaceUsers.customers);
        setDealerUsers(fetchedMarketplaceUsers.dealers);
        setInquiries(fetchedInquiries);
        setContactMessages(fetchedContacts);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to fetch marketplace data",
          description: "There was an error fetching data for the marketplace.",
        });
      } finally {
        setIsLoading(false);
      }
    }, [toast]);

    const handleToggleVehicleStatus = async (vehicle: MarketplaceVehicle) => {
        const newStatus = vehicle.status === 'For Sale' ? 'Paused' : 'For Sale';
        try {
            const updatedVehicle = await updateMarketplaceVehicle(vehicle.id, { status: newStatus });
            if (updatedVehicle) {
                toast({
                    title: 'Status Updated',
                    description: `Vehicle ${vehicle.make} ${vehicle.model} is now ${newStatus}.`,
                });
                refreshData();
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Could not update the vehicle status.',
            });
        }
    };
    
    const handleViewInquiry = async (inquiry: FullInquiry) => {
        setViewingItem({ type: 'Inquiry', data: inquiry });
        if (inquiry.status === 'New') {
            await updateMarketplaceInquiryStatus(inquiry.id, 'Contacted');
            refreshData();
        }
    };

    const handleViewMessage = async (message: MarketplaceContact) => {
        setViewingItem({ type: 'Message', data: message });
        if (message.status === 'New') {
            await updateMarketplaceContactStatus(message.id, 'Read');
            refreshData();
        }
    };

    const live4wCount = liveVehicles.filter(v => v.category === '4w').length;
    const live2wCount = liveVehicles.filter(v => v.category === '2w').length;
    const sold4wCount = soldVehicles.filter(v => v.category === '4w').length;
    const sold2wCount = soldVehicles.filter(v => v.category === '2w').length;
    
    const filteredLiveVehicles = liveVehicles.filter(v => 
        liveCategoryFilter === 'all' || v.category === liveCategoryFilter
    );
    const filteredSoldVehicles = soldVehicles.filter(v =>
        soldCategoryFilter === 'all' || v.category === soldCategoryFilter
    );

    const handleFormSubmit = () => {
      refreshData();
      setIsSheetOpen(false);
      setEditingItem(null);
    };

    const handleBannerFormSubmit = () => {
      refreshData();
      setIsBannerSheetOpen(false);
      setEditingItem(null);
    };

    const handleEdit = (vehicle: MarketplaceVehicle) => {
      setEditingItem({ type: 'Live Vehicle', data: vehicle });
      setIsSheetOpen(true);
    }

    const handleEditBanner = (banner: MarketplaceBanner) => {
      setEditingItem({ type: 'Banner', data: banner });
      setIsBannerSheetOpen(true);
    }
    
    const handleActionConfirm = async () => {
        if (!actionItem) return;

        let success = false;
        let successMessage = "";
        let failureMessage = "";

        try {
            switch(actionItem.type) {
                case 'delist':
                    success = await deleteMarketplaceVehicle(actionItem.data.id);
                    successMessage = `Successfully delisted vehicle ${actionItem.data.id}.`;
                    failureMessage = `Could not delist vehicle ${actionItem.data.id}.`;
                    break;
                case 'delete-banner':
                    success = await deleteBanner(actionItem.data.id);
                    successMessage = `Successfully deleted banner ${actionItem.data.title}.`;
                    failureMessage = `Could not delete banner ${actionItem.data.title}.`;
                    break;
                case 'delete-inquiry':
                    success = await deleteMarketplaceInquiry(actionItem.data.id);
                    successMessage = `Successfully deleted inquiry ${actionItem.data.id}.`;
                    failureMessage = `Could not delete inquiry ${actionItem.data.id}.`;
                    break;
                case 'delete-message':
                    success = await deleteMarketplaceContact(actionItem.data.id);
                    successMessage = `Successfully deleted message ${actionItem.data.id}.`;
                    failureMessage = `Could not delete message ${actionItem.data.id}.`;
                    break;
                default:
                    // For mock actions like approve/reject
                    toast({
                        title: `Action: ${actionItem.type.charAt(0).toUpperCase() + actionItem.type.slice(1)}`,
                        description: `Successfully performed action on item ${actionItem.data.id || actionItem.data.name}.`,
                    });
                    success = true;
                    break;
            }

            if (success) {
                toast({ title: 'Success', description: successMessage || 'Action completed successfully.' });
                refreshData();
            } else {
                toast({ variant: "destructive", title: 'Failed', description: failureMessage || 'Action could not be completed.' });
            }
        } catch (error) {
            const err = error as Error;
            toast({ variant: "destructive", title: 'Error', description: err.message || 'An unexpected error occurred.' });
        }
       
        setActionItem(null);
    };

    const getDaysListed = (dateString: string | null | undefined) => {
        if(!dateString) return 'N/A';
        return differenceInDays(new Date(), parseISO(dateString));
    };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Marketplace Management</h1>
        <p className="text-muted-foreground">
          Oversee all marketplace activities, from inquiries to sold vehicles.
        </p>
      </div>

      <Tabs defaultValue="live" className="w-full">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="inquiries">New Inquiries</TabsTrigger>
          <TabsTrigger value="live">Live Vehicles</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="sold">Sold Vehicles</TabsTrigger>
          <TabsTrigger value="messages">Contact Messages</TabsTrigger>
          <TabsTrigger value="customers">Customer Users</TabsTrigger>
          <TabsTrigger value="dealers">Dealer Users</TabsTrigger>
          <TabsTrigger value="banners">Banners</TabsTrigger>
        </TabsList>
        
        {/* New Inquiries Tab */}
        <TabsContent value="inquiries">
          <Card>
            <CardHeader>
              <CardTitle>New Buying Inquiries</CardTitle>
              <CardDescription>List of all new inquiries from potential buyers.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inquiry ID</TableHead>
                    <TableHead>User Details</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                     <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>
                  ) : inquiries.length > 0 ? inquiries.map((inquiry) => (
                    <TableRow key={inquiry.id}>
                      <TableCell>{inquiry.id.substring(0,8)}...</TableCell>
                      <TableCell>
                        <div className="font-medium">{inquiry.user.fullName}</div>
                        <div className="text-sm text-muted-foreground">{inquiry.user.phone}</div>
                      </TableCell>
                      <TableCell>{inquiry.vehicle.make} {inquiry.vehicle.model}</TableCell>
                      <TableCell>{format(new Date(inquiry.createdAt), "PPP")}</TableCell>
                      <TableCell>
                        <Badge variant={inquiry.status === 'New' ? 'default' : 'secondary'}>{inquiry.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleViewInquiry(inquiry)}>View Details</DropdownMenuItem>
                                <DropdownMenuSeparator/>
                                <DropdownMenuItem className="text-red-600" onSelect={(e) => e.preventDefault()} onClick={() => setActionItem({ type: 'delete-inquiry', data: inquiry })}>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                         </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No new inquiries found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Live Vehicles Tab */}
        <TabsContent value="live">
           <Sheet open={isSheetOpen} onOpenChange={(isOpen) => {
              setIsSheetOpen(isOpen);
              if (!isOpen) setEditingItem(null);
            }}>
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <CardTitle>Marketplace Live Vehicles</CardTitle>
                    <CardDescription>All vehicles currently listed for sale on the marketplace.</CardDescription>
                </div>
                 <div className="flex items-center gap-2 mt-4 md:mt-0">
                    <Button variant={liveCategoryFilter === 'all' ? 'secondary' : 'outline'} size="sm" onClick={() => setLiveCategoryFilter('all')}>All <Badge className="ml-2">{liveVehicles.length}</Badge></Button>
                    <Button variant={liveCategoryFilter === '4w' ? 'secondary' : 'outline'} size="sm" onClick={() => setLiveCategoryFilter('4w')}>4 Wheeler <Badge className="ml-2">{live4wCount}</Badge></Button>
                    <Button variant={liveCategoryFilter === '2w' ? 'secondary' : 'outline'} size="sm" onClick={() => setLiveCategoryFilter('2w')}>2 Wheeler <Badge className="ml-2">{live2wCount}</Badge></Button>
                     <SheetTrigger asChild>
                      <Button onClick={() => { setEditingItem(null); setIsSheetOpen(true); }}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add New Vehicle
                      </Button>
                    </SheetTrigger>
                </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Listed</TableHead>
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
                  ) : filteredLiveVehicles.length > 0 ? filteredLiveVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>
                        <div className="flex items-center gap-4">
                            <Image src={getFullImageUrl(vehicle.imageUrl)} alt={`${vehicle.make} ${vehicle.model}`} width={100} height={60} className="rounded-md object-cover" data-ai-hint="car side" />
                            <div>
                                <div className="font-medium">{vehicle.make} {vehicle.model} ({vehicle.year})</div>
                                <div className="text-sm text-muted-foreground">{vehicle.id.substring(0,8)}...</div>
                            </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">₹ {vehicle.price?.toLocaleString('en-IN')}</TableCell>
                      <TableCell>{getDaysListed(vehicle.createdAt)} days ago</TableCell>
                      <TableCell><Badge variant={vehicle.status === 'For Sale' ? 'secondary' : vehicle.status === 'Paused' ? 'default' : 'outline'}>{vehicle.status}</Badge></TableCell>
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
                                  <DropdownMenuItem onClick={() => setViewingItem({ type: 'Live Vehicle', data: vehicle })}>View Details</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEdit(vehicle)}>Edit</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleToggleVehicleStatus(vehicle)}>
                                    {vehicle.status === 'For Sale' ? 'Pause Listing' : 'Go Live'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600" onSelect={e => e.preventDefault()} onClick={() => setActionItem({ type: 'delist', data: vehicle })}>De-list</DropdownMenuItem>
                              </DropdownMenuContent>
                          </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )) : (
                     <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No live vehicles found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
           <SheetContent className="sm:max-w-2xl">
              <SheetHeader>
                <SheetTitle>{editingItem ? "Edit Vehicle" : "Add New Vehicle to Marketplace"}</SheetTitle>
                <SheetDescription>
                  {editingItem ? "Update the details for this vehicle." : "Fill out the form below to list a new vehicle."}
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-8rem)] pr-6">
                <VehicleForm 
                  vehicle={editingItem?.data}
                  onFormSubmit={handleFormSubmit}
                />
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </TabsContent>

        {/* Pending Vehicles Tab */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Vehicles for Approval</CardTitle>
              <CardDescription>Vehicles waiting for admin approval before going live.</CardDescription>
            </CardHeader>
            <CardContent>
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Listing ID</TableHead>
                    <TableHead>Vehicle Name</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingVehicles.length > 0 ? pendingVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>{vehicle.id}</TableCell>
                      <TableCell>{vehicle.vehicleName}</TableCell>
                      <TableCell>{vehicle.seller}</TableCell>
                      <TableCell>{vehicle.price}</TableCell>
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
                                  <DropdownMenuItem onClick={() => setEditingItem({ type: 'Pending Vehicle', data: vehicle })}>Edit & Review</DropdownMenuItem>
                                  <DropdownMenuItem className="text-green-600" onClick={() => setActionItem({ type: 'approve', data: vehicle })}>Approve</DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600" onClick={() => setActionItem({ type: 'reject', data: vehicle })}>Reject</DropdownMenuItem>
                              </DropdownMenuContent>
                          </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )) : (
                     <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No pending vehicles found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sold Vehicles Tab */}
        <TabsContent value="sold">
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <CardTitle>Sold Vehicles</CardTitle>
                    <CardDescription>A list of all vehicles that have been sold from the marketplace.</CardDescription>
                </div>
                <div className="flex items-center gap-2 mt-4 md:mt-0">
                    <Button variant={soldCategoryFilter === 'all' ? 'secondary' : 'outline'} size="sm" onClick={() => setSoldCategoryFilter('all')}>All <Badge className="ml-2">{soldVehicles.length}</Badge></Button>
                    <Button variant={soldCategoryFilter === '4w' ? 'secondary' : 'outline'} size="sm" onClick={() => setSoldCategoryFilter('4w')}>4 Wheeler <Badge className="ml-2">{sold4wCount}</Badge></Button>
                    <Button variant={soldCategoryFilter === '2w' ? 'secondary' : 'outline'} size="sm" onClick={() => setSoldCategoryFilter('2w')}>2 Wheeler <Badge className="ml-2">{sold2wCount}</Badge></Button>
                </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Sold On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSoldVehicles.length > 0 ? filteredSoldVehicles.map((vehicle: any) => (
                    <TableRow key={vehicle.id}>
                       <TableCell>
                        <div className="flex items-center gap-4">
                            <Image src={getFullImageUrl(vehicle.imageUrl)} alt={vehicle.make} width={100} height={60} className="rounded-md object-cover" data-ai-hint="car side" />
                            <div>
                                <div className="font-medium">{vehicle.make} {vehicle.model}</div>
                                <div className="text-sm text-muted-foreground">{vehicle.id}</div>
                            </div>
                        </div>
                      </TableCell>
                       <TableCell>
                        <div>{vehicle.seller}</div>
                        <Badge variant={vehicle.sellerType === 'Dealer' ? 'default' : 'outline'}>{vehicle.sellerType}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{vehicle.price}</TableCell>
                      <TableCell>{vehicle.soldDate}</TableCell>
                       <TableCell className="text-right">
                          <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => setViewingItem({ type: 'Sold Vehicle', data: vehicle })}>View Details</DropdownMenuItem>
                                </DropdownMenuContent>
                          </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )) : (
                     <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No sold vehicles found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Messages Tab */}
         <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>Marketplace Contact Messages</CardTitle>
              <CardDescription>Contact messages and queries related to marketplace listings.</CardDescription>
            </CardHeader>
            <CardContent>
               <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Message ID</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                       <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>
                    ) : contactMessages.length > 0 ? contactMessages.map((msg) => (
                        <TableRow key={msg.id}>
                            <TableCell>{msg.id.substring(0,8)}...</TableCell>
                            <TableCell>
                              <div className="font-medium">{msg.name}</div>
                              <div className="text-sm text-muted-foreground">{msg.email}</div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{msg.message}</TableCell>
                            <TableCell>{format(new Date(msg.createdAt), "PPP")}</TableCell>
                            <TableCell>
                              <Badge variant={msg.status === 'New' ? 'default' : 'secondary'}>{msg.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => handleViewMessage(msg)}>View Message</DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600" onSelect={(e) => e.preventDefault()} onClick={() => setActionItem({ type: 'delete-message', data: msg })}>Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )) : (
                       <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                           No contact messages found.
                        </TableCell>
                      </TableRow>
                    )}
                </TableBody>
               </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Customer Users Tab */}
         <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Registered Customer Users</CardTitle>
              <CardDescription>List of all customers registered on the marketplace.</CardDescription>
            </CardHeader>
            <CardContent>
               <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Customer ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact Info</TableHead>
                        <TableHead>Registration Date</TableHead>
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
                    ) : customerUsers.length > 0 ? customerUsers.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell className="font-mono text-xs">{user.id.substring(0,12)}...</TableCell>
                            <TableCell>{user.fullName}</TableCell>
                            <TableCell>
                                <div>{user.phone}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                            </TableCell>
                            <TableCell>{format(new Date(user.createdAt), "PPP")}</TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => setViewingItem({ type: 'Customer', data: user })}>View Details</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setEditingItem({ type: 'Customer', data: user })}>Edit</DropdownMenuItem>
                                        <DropdownMenuSeparator/>
                                        <DropdownMenuItem className="text-red-600" onClick={() => setActionItem({ type: 'delete', data: user })}>Delete User</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )) : (
                       <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                           No customer users found.
                        </TableCell>
                      </TableRow>
                    )}
                </TableBody>
               </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Dealer Users Tab */}
         <TabsContent value="dealers">
          <Card>
            <CardHeader>
              <CardTitle>Registered Dealer Users</CardTitle>
              <CardDescription>List of all dealers registered specifically for the marketplace.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Dealer ID</TableHead>
                        <TableHead>Dealership Name</TableHead>
                        <TableHead>Owner / Contact</TableHead>
                        <TableHead>Registration Date</TableHead>
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
                    ) : dealerUsers.length > 0 ? dealerUsers.map((dealer) => (
                        <TableRow key={dealer.id}>
                            <TableCell className="font-mono text-xs">{dealer.id.substring(0,12)}...</TableCell>
                            <TableCell>{dealer.dealershipName}</TableCell>
                             <TableCell>
                                <div className="font-medium">{dealer.fullName}</div>
                                <div className="text-sm text-muted-foreground">{dealer.phone}</div>
                            </TableCell>
                            <TableCell>{format(new Date(dealer.createdAt), "PPP")}</TableCell>
                            <TableCell className="text-right">
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => setViewingItem({ type: 'Dealer', data: dealer })}>View Details</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setEditingItem({ type: 'Dealer', data: dealer })}>Edit</DropdownMenuItem>
                                        <DropdownMenuSeparator/>
                                        <DropdownMenuItem className="text-red-600" onClick={() => setActionItem({ type: 'delete', data: dealer })}>Delete User</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )) : (
                       <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                           No dealer users found.
                        </TableCell>
                      </TableRow>
                    )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Banners Tab */}
        <TabsContent value="banners">
           <Sheet open={isBannerSheetOpen} onOpenChange={(isOpen) => {
              setIsBannerSheetOpen(isOpen);
              if (!isOpen) setEditingItem(null);
            }}>
            <Card>
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                      <CardTitle>Marketplace Banners</CardTitle>
                      <CardDescription>Manage promotional banners for the marketplace.</CardDescription>
                  </div>
                  <SheetTrigger asChild>
                    <Button onClick={() => { setEditingItem(null); setIsBannerSheetOpen(true); }}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Banner
                    </Button>
                  </SheetTrigger>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Banner</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
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
                    ) : banners.length > 0 ? banners.map((banner) => (
                      <TableRow key={banner.id}>
                        <TableCell>
                          <Image src={getFullImageUrl(banner.imageUrl)} alt={banner.title} width={120} height={40} className="rounded-md object-cover" />
                        </TableCell>
                        <TableCell className="font-medium">{banner.title}</TableCell>
                        <TableCell><Badge variant={banner.status === 'Active' ? 'secondary' : 'outline'}>{banner.status}</Badge></TableCell>
                        <TableCell>{getDaysListed(banner.createdAt)} days ago</TableCell>
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
                                    <DropdownMenuItem onClick={() => handleEditBanner(banner)}>Edit</DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600" onSelect={e => e.preventDefault()} onClick={() => setActionItem({ type: 'delete-banner', data: banner })}>Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )) : (
                       <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No banners found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{editingItem && editingItem.type === 'Banner' ? "Edit Banner" : "Add New Banner"}</SheetTitle>
              </SheetHeader>
               <BannerForm 
                  banner={editingItem?.data}
                  onFormSubmit={handleBannerFormSubmit}
                />
            </SheetContent>
          </Sheet>
        </TabsContent>

      </Tabs>

        {/* Sheet for Viewing Details */}
        <Sheet open={!!viewingItem} onOpenChange={(isOpen) => !isOpen && setViewingItem(null)}>
            <SheetContent className="sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>View {viewingItem?.type}</SheetTitle>
                    <SheetDescription>Viewing details for item ID: {viewingItem?.data.id}</SheetDescription>
                </SheetHeader>
                 <ScrollArea className="h-[calc(100vh-8rem)] pr-6">
                    {viewingItem && <MarketplaceItemDetails item={viewingItem} />}
                 </ScrollArea>
            </SheetContent>
        </Sheet>
        
        {/* Alert Dialog for Actions */}
        {actionItem && (
            <AlertDialog open={!!actionItem} onOpenChange={(isOpen) => !isOpen && setActionItem(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will {actionItem.type.replace('-', ' ')} the item "{actionItem.data.id || actionItem.data.name || actionItem.data.title}". This might be irreversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleActionConfirm} className={actionItem.type.includes('del') ? "bg-destructive hover:bg-destructive/90" : ""}>
                            Yes, {actionItem.type.charAt(0).toUpperCase() + actionItem.type.slice(1).replace('-', ' ')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}

    </div>
  );
}

    