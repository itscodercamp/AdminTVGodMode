
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Dealer, addDealer, updateDealer } from "@/lib/dealers";

const formSchema = z.object({
  dealershipName: z.string().min(2, { message: "Dealership name is required." }),
  ownerName: z.string().min(2, { message: "Owner name is required." }),
  email: z.string().email(),
  phone: z.string().min(10, { message: "Enter a valid 10-digit phone number." }),
  address: z.string().min(10, { message: "Address is required." }),
  joiningDate: z.date({ required_error: "Joining date is required." }),
});

type DealerFormProps = {
  dealer: Dealer | null;
  onFormSubmit: () => void;
};

export function DealerForm({ dealer, onFormSubmit }: DealerFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  
  const defaultValues = dealer ? {
        ...dealer,
        joiningDate: new Date(dealer.joiningDate),
    } : {
        dealershipName: "",
        ownerName: "",
        email: "",
        phone: "",
        address: "",
        joiningDate: new Date(),
    };


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues
  });
  
  React.useEffect(() => {
      form.reset(dealer ? { ...dealer, joiningDate: new Date(dealer.joiningDate) } : defaultValues);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealer, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    const dealerData = {
        ...values,
        joiningDate: values.joiningDate.toISOString(),
    };

    try {
        if (dealer) {
            await updateDealer(dealer.id, dealerData);
            toast({
                title: "Dealer Updated",
                description: "Dealer details have been successfully updated.",
            });
        } else {
            await addDealer(dealerData as any);
            toast({
                title: "Dealer Created",
                description: "New dealer has been successfully added.",
            });
        }
        onFormSubmit();
    } catch (error) {
         toast({
            variant: "destructive",
            title: "An Error Occurred",
            description: "Could not save dealer details. Please try again.",
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="dealershipName" render={({ field }) => (
            <FormItem>
              <FormLabel>Dealership Name</FormLabel>
              <FormControl><Input placeholder="e.g. Sharma Motors" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
        )}/>
        <FormField control={form.control} name="ownerName" render={({ field }) => (
            <FormItem>
              <FormLabel>Owner's Name</FormLabel>
              <FormControl><Input placeholder="e.g. Ramesh Sharma" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
        )}/>
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input placeholder="name@example.com" {...field} type="email" /></FormControl>
                  <FormMessage />
                </FormItem>
            )}/>
             <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl><Input placeholder="9876543210" {...field} type="tel" /></FormControl>
                  <FormMessage />
                </FormItem>
            )}/>
        </div>
        <FormField control={form.control} name="address" render={({ field }) => (
            <FormItem>
              <FormLabel>Dealership Address</FormLabel>
              <FormControl><Textarea placeholder="Enter the full address" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
        )}/>
        <FormField control={form.control} name="joiningDate" render={({ field }) => (
            <FormItem className="flex flex-col">
                <FormLabel>Joining Date</FormLabel>
                 <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                </Popover>
                <FormMessage />
            </FormItem>
        )}/>
       
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Saving..." : (dealer ? "Save Changes" : "Create Dealer")}
        </Button>
      </form>
    </Form>
  );
}
