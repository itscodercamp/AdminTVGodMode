
"use client";

import { Dealer } from "@/lib/dealers";
import { Badge } from "./ui/badge";
import { format } from "date-fns";

type DealerDetailsProps = {
    dealer: Dealer;
};

const DetailItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="grid grid-cols-3 gap-2 py-3 border-b">
        <dt className="font-semibold text-muted-foreground">{label}</dt>
        <dd className="col-span-2">{value}</dd>
    </div>
);

export function DealerDetails({ dealer }: DealerDetailsProps) {

    return (
        <div className="space-y-4 text-sm">
            <dl>
                <DetailItem label="Dealer ID" value={dealer.id} />
                <DetailItem label="Status" value={
                    <Badge variant={dealer.status === 'Active' ? 'secondary' : dealer.status === 'Deleted' ? 'destructive' : 'outline'}>
                        {dealer.status}
                    </Badge>
                } />
                <div className="pt-4 font-bold text-base text-foreground">Dealership Info</div>
                <DetailItem label="Dealership Name" value={dealer.dealershipName} />
                <DetailItem label="Owner Name" value={dealer.ownerName} />
                <DetailItem label="Address" value={dealer.address} />
                 <DetailItem label="Joining Date" value={format(new Date(dealer.joiningDate), "PPP")} />

                <div className="pt-4 font-bold text-base text-foreground">Contact Info</div>
                <DetailItem label="Email" value={dealer.email} />
                <DetailItem label="Phone" value={dealer.phone} />
                
                {dealer.status === 'Deleted' && (
                    <>
                        <div className="pt-4 font-bold text-base text-destructive">Removal Details</div>
                        <DetailItem label="Removal Date" value={dealer.deletedAt ? format(new Date(dealer.deletedAt), "PPP") : 'N/A'} />
                        <DetailItem label="Reason" value={dealer.deletionReason || 'Not provided'} />
                    </>
                )}
            </dl>
        </div>
    );
}
