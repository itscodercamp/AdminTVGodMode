
"use client";

import { PDIInspection } from "@/lib/pdi-inspections";
import { Badge } from "./ui/badge";
import { format } from "date-fns";

type PDIInspectionDetailsProps = {
    inspection: PDIInspection;
};

const DetailItem = ({ label, value }: { label: string, value: React.ReactNode }) => {
    if (!value) return null;
    return (
        <div className="grid grid-cols-3 gap-2 py-2 border-b">
            <dt className="font-semibold text-muted-foreground">{label}</dt>
            <dd className="col-span-2">{value}</dd>
        </div>
    );
}

export function PDIInspectionDetails({ inspection }: PDIInspectionDetailsProps) {

    return (
        <div className="space-y-4 text-sm">
            <dl>
                <DetailItem label="Inspection ID" value={inspection.id} />
                 <DetailItem label="Date" value={format(new Date(inspection.createdAt), "PPP p")} />
                <DetailItem label="Status" value={
                    <Badge variant={inspection.status === 'New' ? 'default' : 'secondary'}>
                        {inspection.status}
                    </Badge>
                } />
                
                <div className="pt-4 font-bold text-base text-foreground">Customer Details</div>
                <DetailItem label="Name" value={inspection.name} />
                <DetailItem label="Phone" value={inspection.phone} />
                <DetailItem label="Email" value={inspection.email} />
                <DetailItem label="City" value={inspection.city} />

                <div className="pt-4 font-bold text-base text-foreground">Vehicle Details</div>
                <DetailItem label="Make" value={inspection.make} />
                <DetailItem label="Model" value={inspection.model} />
            </dl>
        </div>
    );
}
