
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import React from "react";
import { getUsers, User } from "@/lib/users";
import { getDealers, Dealer } from "@/lib/dealers";
import { Inspection, addInspection, updateInspection } from "@/lib/inspections";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Combobox } from "./ui/combobox";

const formSchema = z.object({
  assignedToId: z.string().min(1, { message: "Please assign an inspector." }),
  leadType: z.enum(['Customer', 'Dealer'], { required_error: "Please select a lead source." }),
  dealerId: z.string().optional(),
  fullName: z.string().optional(),
  phoneNumber: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pinCode: z.string().optional(),
  vehicleMake: z.string().min(2, { message: "Vehicle make is required." }),
  vehicleModel: z.string().min(1, { message: "Vehicle model is required." }),
  carYear: z.string().optional(),
  registrationNumber: z.string().min(3, { message: "Registration number is required." }),
  inspectionType: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.leadType === 'Dealer') {
        if (!data.dealerId) {
            ctx.addIssue({ code: "custom", message: "Please select a dealer.", path: ["dealerId"] });
        }
    }
    if (data.leadType === 'Customer') {
        if (!data.fullName || data.fullName.length < 2) {
            ctx.addIssue({ code: "custom", message: "Customer name is required.", path: ["fullName"] });
        }
        if (!data.phoneNumber || data.phoneNumber.length < 10) {
            ctx.addIssue({ code: "custom", message: "Enter a valid 10-digit phone number.", path: ["phoneNumber"] });
        }
    }
});

type InspectionFormProps = {
  inspection: Inspection | null;
  onFormSubmit: () => void;
};

export function InspectionForm({ inspection, onFormSubmit }: InspectionFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [inspectors, setInspectors] = React.useState<User[]>([]);
  const [dealers, setDealers] = React.useState<Dealer[]>([]);

  React.useEffect(() => {
    async function fetchData() {
        try {
            const [allUsers, allDealers] = await Promise.all([getUsers(), getDealers()]);
            const inspectorUsers = allUsers.filter(user => user.designation === 'Inspector' && user.status === 'Active');
            setInspectors(inspectorUsers);
            setDealers(allDealers);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not fetch initial data.',
            });
        }
    }
    fetchData();
  }, []);

  const defaultValues = {
      assignedToId: "Unassigned",
      leadType: "Customer" as const,
      dealerId: undefined,
      fullName: "",
      phoneNumber: "",
      street: "",
      city: "",
      state: "",
      pinCode: "",
      vehicleMake: "",
      vehicleModel: "",
      carYear: "",
      registrationNumber: "",
      inspectionType: "General",
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: inspection ? inspection : defaultValues,
  });
  
  React.useEffect(() => {
      form.reset(inspection ? inspection : defaultValues);
  }, [inspection, form]);
  
  const leadType = form.watch("leadType");
  const dealerOptions = dealers.map(d => ({ value: d.id, label: `${d.dealershipName} (${d.ownerName})` }));

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
        if (inspection) {
            await updateInspection(inspection.id, values);
            toast({ title: "Inspection Updated", description: "The inspection details have been updated." });
        } else {
            await addInspection({ ...values, source: 'Manual' });
            toast({ title: "Inspection Created", description: "The new inspection has been saved and assigned." });
        }
        onFormSubmit();
    } catch(e) {
        const err = e as Error;
        toast({ variant: 'destructive', title: "Error", description: err.message || "Could not save the inspection." });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="assignedToId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assign to Inspector</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select an inspector..." /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Unassigned">Unassigned</SelectItem>
                  {inspectors.length > 0 ? inspectors.map(inspector => (
                    <SelectItem key={inspector.id} value={inspector.id}>
                      {inspector.name} ({inspector.id.substring(0,8)})
                    </SelectItem>
                  )) : (
                    <SelectItem value="none" disabled>No active inspectors found</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="inspectionType"
          render={({ field }) => (
            <FormItem><FormLabel>Inspection Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select inspection type..." /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="Pre-Purchase">Pre-Purchase</SelectItem>
                        <SelectItem value="Bank Valuation">Bank Valuation</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="leadType"
          render={({ field }) => (
            <FormItem className="space-y-3"><FormLabel>Lead Source</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                  <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Customer" /></FormControl><FormLabel className="font-normal">Customer Lead</FormLabel></FormItem>
                  <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Dealer" /></FormControl><FormLabel className="font-normal">Dealer Lead</FormLabel></FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {leadType === 'Dealer' && (
          <FormField
            control={form.control}
            name="dealerId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Select Dealer</FormLabel>
                <Combobox options={dealerOptions} value={field.value} onChange={field.onChange} placeholder="Search for a dealer..." />
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        {leadType === 'Customer' && (
            <>
                <FormField control={form.control} name="fullName" render={({ field }) => (
                    <FormItem><FormLabel>Customer Name</FormLabel><FormControl><Input placeholder="e.g., Ankit Sharma" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                    <FormItem><FormLabel>Customer Phone Number</FormLabel><FormControl><Input placeholder="e.g., 9876543210" type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <div className="space-y-2">
                    <FormLabel>Address</FormLabel>
                    <FormField control={form.control} name="street" render={({ field }) => (<FormItem><FormControl><Input placeholder="Street Address" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormControl><Input placeholder="City" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="state" render={({ field }) => (<FormItem><FormControl><Input placeholder="State" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    </div>
                    <FormField control={form.control} name="pinCode" render={({ field }) => (<FormItem><FormControl><Input placeholder="PIN Code" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                </div>
            </>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="vehicleMake" render={({ field }) => (
            <FormItem><FormLabel>Vehicle Make</FormLabel><FormControl><Input placeholder="e.g., Maruti" {...field} /></FormControl><FormMessage /></FormItem>
          )}/>
          <FormField control={form.control} name="vehicleModel" render={({ field }) => (
            <FormItem><FormLabel>Vehicle Model</FormLabel><FormControl><Input placeholder="e.g., Swift" {...field} /></FormControl><FormMessage /></FormItem>
          )}/>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="carYear" render={({ field }) => (
                <FormItem><FormLabel>Manufacturing Year</FormLabel><FormControl><Input placeholder="e.g., 2021" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="registrationNumber" render={({ field }) => (
                <FormItem><FormLabel>Registration Number</FormLabel><FormControl><Input placeholder="e.g., MH12AB1234" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Saving..." : (inspection ? "Save Changes" : "Save Inspection")}
        </Button>
      </form>
    </Form>
  );
}
