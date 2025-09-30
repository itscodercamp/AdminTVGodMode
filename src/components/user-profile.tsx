
"use client";

import { User } from "@/lib/users";
import { Badge } from "./ui/badge";
import { format } from "date-fns";

type UserProfileProps = {
    user: Omit<User, 'password'>;
};

const DetailItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="grid grid-cols-3 gap-2 py-3 border-b">
        <dt className="font-semibold text-muted-foreground">{label}</dt>
        <dd className="col-span-2">{value}</dd>
    </div>
);

export function UserProfile({ user }: UserProfileProps) {

    return (
        <div className="space-y-4 text-sm">
            <dl>
                <DetailItem label="Employee ID" value={user.id} />
                <DetailItem label="Status" value={
                    <Badge variant={user.status === 'Active' ? 'secondary' : user.status === 'Deleted' ? 'destructive' : 'outline'}>
                        {user.status}
                    </Badge>
                } />
                <div className="pt-4 font-bold text-base text-foreground">Personal Details</div>
                <DetailItem label="Name" value={user.name} />
                <DetailItem label="Email" value={user.email} />
                <DetailItem label="Phone" value={user.phone || 'N/A'} />
                 <DetailItem label="Date of Birth" value={format(new Date(user.dob), "PPP")} />

                <div className="pt-4 font-bold text-base text-foreground">Job Details</div>
                <DetailItem label="Designation" value={user.designation} />
                <DetailItem label="Joining Date" value={format(new Date(user.joiningDate), "PPP")} />

                {user.status === 'Deleted' && (
                    <>
                        <div className="pt-4 font-bold text-base text-destructive">Termination Details</div>
                        <DetailItem label="Termination Date" value={user.deletedAt ? format(new Date(user.deletedAt), "PPP") : 'N/A'} />
                        <DetailItem label="Reason" value={user.deletionReason || 'Not provided'} />
                    </>
                )}
            </dl>
        </div>
    );
}
