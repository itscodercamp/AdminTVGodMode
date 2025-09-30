
"use client";

import { Inspection } from "@/lib/inspections";
import { User } from "@/lib/users";
import { Badge } from "./ui/badge";

type InspectionDetailsProps = {
    inspection: Inspection;
    users: User[];
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

export function InspectionDetails({ inspection, users }: InspectionDetailsProps) {

    const getInspectorName = (id: string) => {
        const inspector = users.find(u => u.id === id);
        return inspector ? `${inspector.name} (${inspector.id})` : 'Unassigned';
    }

    const fullAddress = [inspection.street, inspection.city, inspection.state, inspection.pinCode].filter(Boolean).join(', ');

    return (
        <div className="space-y-4 text-sm">
            <dl>
                <DetailItem label="Inspection ID" value={inspection.id} />
                <DetailItem label="Status" value={
                    <Badge variant={
                        inspection.status === 'Completed' ? 'secondary' : 
                        inspection.status === 'Pending' ? 'destructive' : 'default'
                      }>
                        {inspection.status}
                    </Badge>
                } />
                <DetailItem label="Source" value={inspection.source} />
                <DetailItem label="Inspection Type" value={inspection.inspectionType} />
                
                <div className="pt-4 font-bold text-base text-foreground">Customer Details</div>
                <DetailItem label="Name" value={inspection.fullName} />
                <DetailItem label="Phone" value={inspection.phoneNumber} />
                {fullAddress && <DetailItem label="Address" value={fullAddress} />}


                <div className="pt-4 font-bold text-base text-foreground">Vehicle Details</div>
                <DetailItem label="Make" value={inspection.vehicleMake} />
                <DetailItem label="Model" value={inspection.vehicleModel} />
                <DetailItem label="Year" value={inspection.carYear} />
                <DetailItem label="Registration No." value={inspection.registrationNumber} />

                <div className="pt-4 font-bold text-base text-foreground">Assignment</div>
                <DetailItem label="Assigned To" value={getInspectorName(inspection.assignedToId)} />
            </dl>
        </div>
    );
}
