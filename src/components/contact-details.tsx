
"use client";

import { ContactSubmission } from "@/lib/contacts";
import { Badge } from "./ui/badge";
import { format } from "date-fns";

type ContactDetailsProps = {
    submission: ContactSubmission;
};

const DetailItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="grid grid-cols-3 gap-2 py-3 border-b">
        <dt className="font-semibold text-muted-foreground">{label}</dt>
        <dd className="col-span-2">{value}</dd>
    </div>
);

export function ContactDetails({ submission }: ContactDetailsProps) {

    return (
        <div className="space-y-4 text-sm">
            <dl>
                <DetailItem label="Submission ID" value={submission.id} />
                <DetailItem label="Date" value={format(new Date(submission.date), "PPP p")} />
                <DetailItem label="Status" value={
                    <Badge variant={submission.status === 'New' ? 'default' : 'secondary'}>
                        {submission.status}
                    </Badge>
                } />
                
                <div className="pt-4 font-bold text-base text-foreground">Submitter Info</div>
                <DetailItem label="Name" value={submission.name} />
                <DetailItem label="Email" value={submission.email} />
                <DetailItem label="Phone" value={submission.phone || 'N/A'} />

                <div className="pt-4 font-bold text-base text-foreground">Message</div>
                <DetailItem label="Subject" value={submission.subject} />
                <div className="py-3">
                    <dt className="font-semibold text-muted-foreground mb-2">Message Body</dt>
                    <dd className="p-3 bg-secondary rounded-md whitespace-pre-wrap">{submission.message}</dd>
                </div>
            </dl>
        </div>
    );
}
