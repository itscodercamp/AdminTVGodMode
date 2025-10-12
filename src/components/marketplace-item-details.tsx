
"use client";

import Image from "next/image";
import type { ItemDetails } from "./marketplace-client";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { differenceInDays, parseISO, format } from "date-fns";

const getFullImageUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  return `/api/images${path.startsWith('/') ? '' : '/'}${path}`;
};


const DetailItem = ({ label, value, isVertical = false }: { label: string, value: React.ReactNode, isVertical?: boolean }) => {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div className={cn("py-3 border-b", !isVertical && "grid grid-cols-3 gap-2")}>
            <dt className="font-semibold text-muted-foreground">{label}</dt>
            <dd className={cn(!isVertical && "col-span-2", isVertical && "mt-1")}>{value}</dd>
        </div>
    );
}

const ImagePreviewItem = ({ label, src }: { label: string, src: string | null | undefined }) => {
    const fullSrc = getFullImageUrl(src);
    if (!fullSrc) return null;
    return (
        <div className="flex flex-col items-center gap-2 text-center">
            <Image src={fullSrc} alt={label} width={120} height={90} className="rounded-md object-cover border" />
            <span className="text-xs text-muted-foreground">{label}</span>
        </div>
    );
};


export function MarketplaceItemDetails({ item }: { item: ItemDetails }) {
    const { type, data } = item;

    const renderVehicleDetails = (vehicle: any) => (
         <>
            {vehicle.imageUrl && (
                <div className="flex justify-center py-4">
                    <Image src={getFullImageUrl(vehicle.imageUrl)!} alt={`${vehicle.make} ${vehicle.model}`} width={250} height={150} className="rounded-lg object-cover" data-ai-hint="car side" />
                </div>
            )}
            <DetailItem label="Listing ID" value={data.id} />
            <DetailItem label="Status" value={<Badge variant={data.status === 'For Sale' ? 'secondary' : data.status === 'Sold' ? 'outline' : 'default'}>{data.status}</Badge>} />
            <DetailItem label="Verified" value={<Badge variant={data.verified ? 'default' : 'destructive'}>{data.verified ? 'Yes' : 'No'}</Badge>} />
            
            <div className="pt-4 font-bold text-base text-foreground">Core Info</div>
            <DetailItem label="Make & Model" value={`${data.make} ${data.model}`} />
            <DetailItem label="Variant" value={data.variant} />
            <DetailItem label="Price" value={<span className="font-bold text-lg text-primary">₹ {data.price?.toLocaleString('en-IN')}</span>} />
            <DetailItem label="Color" value={
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: data.color?.toLowerCase() }}></div>
                    <span>{data.color}</span>
                </div>
            } />
            <DetailItem label="KMs Driven" value={`${data.odometer?.toLocaleString('en-IN')} km`} />
            
            <div className="pt-4 font-bold text-base text-foreground">Registration & Ownership</div>
            <DetailItem label="MFG Year" value={data.mfgYear} />
            <DetailItem label="Reg. Year" value={data.regYear} />
            <DetailItem label="Reg. Number" value={data.regNumber} />
            <DetailItem label="RTO State" value={data.rtoState} />
            <DetailItem label="Ownership" value={data.ownership} />

            <div className="pt-4 font-bold text-base text-foreground">Specifications</div>
            <DetailItem label="Fuel Type" value={data.fuelType} />
            <DetailItem label="Transmission" value={data.transmission} />
            <DetailItem label="Insurance" value={data.insurance} />
            <DetailItem label="Service History" value={data.serviceHistory} />
            
            <div className="pt-4 font-bold text-base text-foreground">All Images</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                <ImagePreviewItem label="Main/Front" src={data.img_front} />
                <ImagePreviewItem label="Front-Right" src={data.img_front_right} />
                <ImagePreviewItem label="Right" src={data.img_right} />
                <ImagePreviewItem label="Back-Right" src={data.img_back_right} />
                <ImagePreviewItem label="Back" src={data.img_back} />
                <ImagePreviewItem label="Open Dickey" src={data.img_open_dickey} />
                <ImagePreviewItem label="Back-Left" src={data.img_back_left} />
                <ImagePreviewItem label="Left" src={data.img_left} />
                <ImagePreviewItem label="Front-Left" src={data.img_front_left} />
                <ImagePreviewItem label="Open Bonnet" src={data.img_open_bonnet} />
                <ImagePreviewItem label="Dashboard" src={data.img_dashboard} />
                <ImagePreviewItem label="Right Front Door" src={data.img_right_front_door} />
                <ImagePreviewItem label="Right Back Door" src={data.img_right_back_door} />
                <ImagePreviewItem label="Engine" src={data.img_engine} />
                <ImagePreviewItem label="Roof" src={data.img_roof} />
                <ImagePreviewItem label="Tyre 1" src={data.img_tyre_1} />
                <ImagePreviewItem label="Tyre 2" src={data.img_tyre_2} />
                <ImagePreviewItem label="Tyre 3" src={data.img_tyre_3} />
                <ImagePreviewItem label="Tyre 4" src={data.img_tyre_4} />
                <ImagePreviewItem label="Optional Tyre" src={data.img_tyre_optional} />
            </div>


            <div className="pt-4 font-bold text-base text-foreground">System Info</div>
            <DetailItem label="Listed On" value={data.createdAt ? `${format(new Date(data.createdAt), 'PPP')} (${differenceInDays(new Date(), parseISO(data.createdAt))} days ago)`: 'N/A'} />
            <DetailItem label="Last Updated" value={data.updatedAt ? format(new Date(data.updatedAt), 'PPP p') : 'N/A'} />
        </>
    );

    return (
        <div className="space-y-4 text-sm">
            <dl>
                {(() => {
                    switch (type) {
                        case 'Inquiry':
                            return <>
                                <DetailItem label="Inquiry ID" value={data.id} />
                                <DetailItem label="Date" value={format(new Date(data.createdAt), "PPP p")} />
                                <DetailItem label="Status" value={<Badge variant={data.status === 'New' ? 'default' : 'secondary'}>{data.status}</Badge>} />
                                <div className="pt-4 font-bold text-base text-foreground">Inquirer Details</div>
                                <DetailItem label="Name" value={data.user.fullName} />
                                <DetailItem label="Contact" value={data.user.phone} />
                                <DetailItem label="Email" value={data.user.email} />
                                <div className="pt-4 font-bold text-base text-foreground">Vehicle of Interest</div>
                                <DetailItem label="Vehicle" value={`${data.vehicle.make} ${data.vehicle.model}`} />
                                <DetailItem label="Price" value={`₹ ${data.vehicle.price?.toLocaleString('en-IN')}`} />
                            </>;
                        case 'Live Vehicle':
                        case 'Pending Vehicle':
                        case 'Sold Vehicle':
                           return renderVehicleDetails(data);
                        case 'Message':
                             return <>
                                <DetailItem label="Message ID" value={data.id} />
                                <DetailItem label="Date" value={format(new Date(data.createdAt), "PPP p")} />
                                <DetailItem label="Status" value={<Badge variant={data.status === 'New' ? 'default' : 'secondary'}>{data.status}</Badge>} />
                                <div className="pt-4 font-bold text-base text-foreground">Sender Details</div>
                                <DetailItem label="From" value={data.name} />
                                <DetailItem label="Email" value={data.email} />
                                <div className="pt-4 font-bold text-base text-foreground">Message</div>
                                <DetailItem label="Body" value={<p className="p-3 bg-secondary rounded-md whitespace-pre-wrap">{data.message}</p>} isVertical />
                            </>;
                        case 'Customer':
                             return <>
                                <DetailItem label="Customer ID" value={data.id} />
                                <DetailItem label="Registered On" value={data.createdAt ? format(new Date(data.createdAt), "PPP") : 'N/A'} />
                                <div className="pt-4 font-bold text-base text-foreground">User Details</div>
                                <DetailItem label="Name" value={data.fullName} />
                                <DetailItem label="Phone" value={data.phone} />
                                <DetailItem label="Email" value={data.email || 'Not Provided'} />
                            </>;
                        case 'Dealer':
                             const fullAddress = [data.city, data.state, data.pincode].filter(Boolean).join(", ");
                             return <>
                                <DetailItem label="Dealer ID" value={data.id} />
                                <DetailItem label="Registered On" value={data.createdAt ? format(new Date(data.createdAt), "PPP") : 'N/A'} />
                                
                                <div className="pt-4 font-bold text-base text-foreground">Dealership Details</div>
                                <DetailItem label="Dealership" value={data.dealershipName} />
                                <DetailItem label="Type" value={data.dealershipType} />
                                <DetailItem label="Address" value={fullAddress} />
                                
                                <div className="pt-4 font-bold text-base text-foreground">Owner Details</div>
                                <DetailItem label="Owner Name" value={data.fullName} />
                                <DetailItem label="Phone" value={data.phone} />
                                <DetailItem label="Email" value={data.email} />
                            </>;
                        default:
                            return <p>No details available for this item type.</p>;
                    }
                })()}
            </dl>
        </div>
    )
}
