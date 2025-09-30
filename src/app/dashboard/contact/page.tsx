
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
import { getContactSubmissions, deleteContactSubmission, ContactSubmission, updateContactStatus } from "@/lib/contacts";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ContactDetails } from "@/components/contact-details";
import { ScrollArea } from "@/components/ui/scroll-area";


export default function ContactPage() {
  const [submissions, setSubmissions] = React.useState<ContactSubmission[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [viewingSubmission, setViewingSubmission] = React.useState<ContactSubmission | null>(null);
  const { toast } = useToast();

  const refreshSubmissions = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedSubmissions = await getContactSubmissions();
      setSubmissions(fetchedSubmissions);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to fetch submissions",
        description: "There was an error fetching the contact submissions.",
      });
    } finally {
       setIsLoading(false);
    }
  }, [toast]);


  React.useEffect(() => {
    refreshSubmissions();
  }, [refreshSubmissions]);
  
  const handleViewDetails = async (submission: ContactSubmission) => {
    setViewingSubmission(submission);
    if (submission.status === 'New') {
        const updated = await updateContactStatus(submission.id, 'Read');
        if (updated) {
            // Call the global function to mark notification as read
            if (window && (window as any).markNotificationAsRead) {
                (window as any).markNotificationAsRead(submission.id, 'contact');
            }
            // Refresh the list to show the 'Read' status
            refreshSubmissions();
        }
    }
  };

  const handleDelete = async (submissionId: string) => {
    const success = await deleteContactSubmission(submissionId);
    if (success) {
      toast({
        title: "Submission Deleted",
        description: "The contact submission has been successfully deleted.",
      });
      refreshSubmissions();
    } else {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "Could not delete the contact submission.",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Contact Form Submissions</h1>
          <p className="text-muted-foreground">Manage and view all your contact inquiries.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Submissions</CardTitle>
          <CardDescription>A list of all contact form submissions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
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
              ) : submissions.length > 0 ? (
                submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">{submission.id.substring(0,8)}...</TableCell>
                    <TableCell>{submission.name}</TableCell>
                    <TableCell>{submission.email}</TableCell>
                    <TableCell>{format(new Date(submission.date), "PPP")}</TableCell>
                    <TableCell>
                      <Badge variant={submission.status === 'New' ? 'default' : 'secondary'}>
                        {submission.status}
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
                          <DropdownMenuItem onClick={() => handleViewDetails(submission)}>View Details</DropdownMenuItem>
                          <DropdownMenuSeparator />
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <DropdownMenuItem className="text-red-600" onSelect={(e) => e.preventDefault()}>Delete</DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      This will permanently delete the submission from "{submission.name}". This action cannot be undone.
                                  </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(submission.id)} className="bg-destructive hover:bg-destructive/90">Yes, delete</AlertDialogAction>
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
                    No submissions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!viewingSubmission} onOpenChange={(isOpen) => !isOpen && setViewingSubmission(null)}>
        <SheetContent className="sm:max-w-lg">
            <SheetHeader>
                <SheetTitle>Submission Details</SheetTitle>
                <SheetDescription>Viewing details for submission ID: {viewingSubmission?.id.substring(0,8)}...</SheetDescription>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-8rem)]">
                <div className="py-4 px-1">
                    {viewingSubmission && <ContactDetails submission={viewingSubmission} />}
                </div>
            </ScrollArea>
        </SheetContent>
      </Sheet>

    </div>
  );
}
