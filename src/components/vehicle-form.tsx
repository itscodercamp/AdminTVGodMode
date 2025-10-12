
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addMarketplaceVehicle, updateMarketplaceVehicle, MarketplaceVehicle } from "@/lib/marketplace";
import { Switch } from "./ui/switch";
import { Loader2, UploadCloud } from "lucide-react";
import Image from "next/image";

const getFullImageUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  return `/api/images${path.startsWith('/') ? '' : '/'}${path}`;
};


const currentYear = new Date().getFullYear();

const vehicleSchema = z.object({
  category: z.enum(['4w', '2w'], { required_error: "Please select a vehicle category." }),
  imageUrl: z.string().optional().or(z.literal('')),
  year: z.coerce.number().int().min(1950).max(currentYear).optional().nullable(),
  make: z.string().min(2, "Make is required"),
  model: z.string().min(1, "Model is required"),
  variant: z.string().optional(),
  price: z.coerce.number().min(1, "Price must be positive"),
  status: z.enum(["For Sale", "Sold", "Paused"]),
  verified: z.boolean().default(false),
  regYear: z.coerce.number().int().min(1950).max(currentYear).optional().nullable(),
  mfgYear: z.coerce.number().int().min(1950).max(currentYear).optional().nullable(),
  regNumber: z.string().optional().or(z.literal('')),
  odometer: z.coerce.number().min(0),
  fuelType: z.enum(["Petrol", "Diesel", "CNG", "Electric", "LPG", "Hybrid"]),
  transmission: z.enum(["Manual", "Automatic"]),
  rtoState: z.string().optional(),
  ownership: z.string().optional(),
  insurance: z.enum(["Comprehensive", "Third Party", "None"]).optional(),
  serviceHistory: z.enum(["Available", "Not Available"]),
  color: z.string().optional(),
  
  img_front: z.string().optional().or(z.literal('')),
  img_front_right: z.string().optional().or(z.literal('')),
  img_right: z.string().optional().or(z.literal('')),
  img_back_right: z.string().optional().or(z.literal('')),
  img_back: z.string().optional().or(z.literal('')),
  img_open_dickey: z.string().optional().or(z.literal('')),
  img_back_left: z.string().optional().or(z.literal('')),
  img_left: z.string().optional().or(z.literal('')),
  img_front_left: z.string().optional().or(z.literal('')),
  img_open_bonnet: z.string().optional().or(z.literal('')),
  img_dashboard: z.string().optional().or(z.literal('')),
  img_right_front_door: z.string().optional().or(z.literal('')),
  img_right_back_door: z.string().optional().or(z.literal('')),
  img_tyre_1: z.string().optional().or(z.literal('')),
  img_tyre_2: z.string().optional().or(z.literal('')),
  img_tyre_3: z.string().optional().or(z.literal('')),
  img_tyre_4: z.string().optional().or(z.literal('')),
  img_tyre_optional: z.string().optional().or(z.literal('')),
  img_engine: z.string().optional().or(z.literal('')),
  img_roof: z.string().optional().or(z.literal('')),
});


const ImageUploadField = ({
  field,
  label,
  setImageFile,
}: {
  field: any;
  label: string;
  setImageFile: (file: File | null) => void;
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const fullUrl = getFullImageUrl(field.value);
    setPreview(fullUrl);
  }, [field.value]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);
      setImageFile(file);
    } else {
      const fullUrl = getFullImageUrl(field.value);
      setPreview(fullUrl);
      setImageFile(null);
    }
  };

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <div className="flex items-center gap-4">
        {preview ? (
          <Image src={preview} alt={`${label} preview`} width={80} height={60} className="rounded-md object-cover" />
        ) : (
          <div className="w-20 h-[60px] bg-secondary rounded-md flex items-center justify-center text-muted-foreground">
             <UploadCloud className="w-6 h-6" />
          </div>
        )}
        <Input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <Button 
            type="button" 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud className="mr-2 h-4 w-4" />
          {preview ? 'Change' : 'Select'}
        </Button>
      </div>
       <FormMessage />
    </FormItem>
  );
};


type VehicleFormProps = {
  vehicle: MarketplaceVehicle | null | undefined;
  onFormSubmit: () => void;
};

const FormSection = ({ title, description, children }: { title: string, description?: string, children: React.ReactNode }) => (
  <div className="space-y-4 rounded-lg border p-4">
    <div className="mb-2">
      <h3 className="text-lg font-medium leading-6 text-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
  </div>
);


export function VehicleForm({ vehicle, onFormSubmit }: VehicleFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  
  const [imageFiles, setImageFiles] = useState<Record<string, File | null>>({});

  const defaultValues = vehicle ? {
      ...vehicle,
      year: vehicle.year || undefined,
      price: vehicle.price || 0,
      regYear: vehicle.regYear || undefined,
      mfgYear: vehicle.mfgYear || undefined,
      odometer: vehicle.odometer || 0,
      variant: vehicle.variant || '',
      rtoState: vehicle.rtoState || '',
      ownership: vehicle.ownership || '',
      insurance: vehicle.insurance || 'None',
      color: vehicle.color || '',
      regNumber: vehicle.regNumber || '',
      category: vehicle.category || undefined,
      imageUrl: vehicle.imageUrl || '',
      status: vehicle.status || "For Sale",
      img_front: vehicle.img_front || '',
      img_front_right: vehicle.img_front_right || '',
      img_right: vehicle.img_right || '',
      img_back_right: vehicle.img_back_right || '',
      img_back: vehicle.img_back || '',
      img_open_dickey: vehicle.img_open_dickey || '',
      img_back_left: vehicle.img_back_left || '',
      img_left: vehicle.img_left || '',
      img_front_left: vehicle.img_front_left || '',
      img_open_bonnet: vehicle.img_open_bonnet || '',
      img_dashboard: vehicle.img_dashboard || '',
      img_right_front_door: vehicle.img_right_front_door || '',
      img_right_back_door: vehicle.img_right_back_door || '',
      img_tyre_1: vehicle.img_tyre_1 || '',
      img_tyre_2: vehicle.img_tyre_2 || '',
      img_tyre_3: vehicle.img_tyre_3 || '',
      img_tyre_4: vehicle.img_tyre_4 || '',
      img_tyre_optional: vehicle.img_tyre_optional || '',
      img_engine: vehicle.img_engine || '',
      img_roof: vehicle.img_roof || '',
    } : {
      year: undefined, regYear: undefined, mfgYear: undefined,
      make: "", model: "", price: 0,
      category: undefined,
      status: "For Sale" as const, verified: false, serviceHistory: "Not Available" as const,
      fuelType: "Petrol" as const, transmission: "Manual" as const,
      variant: "", regNumber: "", rtoState: "", ownership: "",
      insurance: "None" as const, color: "", odometer: 0,
      imageUrl: "", img_front: "", img_front_right: "", img_right: "", 
      img_back_right: "", img_back: "", img_open_dickey: "", img_back_left: "",
      img_left: "", img_front_left: "", img_open_bonnet: "", img_dashboard: "",
      img_right_front_door: "", img_right_back_door: "", img_tyre_1: "",
      img_tyre_2: "", img_tyre_3: "", img_tyre_4: "", img_tyre_optional: "",
      img_engine: "", img_roof: "",
    };

  const form = useForm<z.infer<typeof vehicleSchema>>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: defaultValues as any,
  });

  const setImageFile = (fieldName: string, file: File | null) => {
    setImageFiles(prev => ({ ...prev, [fieldName]: file }));
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });
        const result = await response.json();
        if (response.ok && result.success) {
            return result.path;
        }
        throw new Error(result.message || 'File upload failed.');
    } catch (error) {
        const err = error as Error;
        toast({ variant: 'destructive', title: `Upload Error for ${file.name}`, description: err.message });
        return null;
    }
  };
  
  async function onSubmit(values: z.infer<typeof vehicleSchema>) {
    setIsLoading(true);
    
    const finalValues = { ...values };

    for (const fieldName in imageFiles) {
        const file = imageFiles[fieldName];
        if (file) {
            const path = await uploadFile(file);
            if (path) {
                (finalValues as any)[fieldName] = path;
            } else {
                setIsLoading(false);
                return;
            }
        }
    }
    
    if(finalValues.img_front && !finalValues.imageUrl) {
      finalValues.imageUrl = finalValues.img_front;
    }

    try {
        if (vehicle) {
            await updateMarketplaceVehicle(vehicle.id, finalValues);
            toast({ title: "Vehicle Updated", description: "The vehicle details have been updated." });
        } else {
            await addMarketplaceVehicle(finalValues as any);
            toast({ title: "Vehicle Listed", description: "The new vehicle has been added to the marketplace." });
        }
        onFormSubmit();
    } catch (e) {
        const error = e as Error;
        toast({ variant: 'destructive', title: "Error", description: error.message || "Could not save the vehicle." });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
        
        <FormSection title="Main Details">
            <FormField control={form.control} name="img_front" render={({ field }) => (<ImageUploadField field={field} label="Main Image (Front View)" setImageFile={(file) => setImageFile('img_front', file)} />)}/>
            <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Price (INR)</FormLabel><FormControl><Input type="number" placeholder="e.g., 500000" {...field} /></FormControl><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Vehicle Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select vehicle category..."/></SelectTrigger></FormControl><SelectContent><SelectItem value="4w">4 Wheeler</SelectItem><SelectItem value="2w">2 Wheeler</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="make" render={({ field }) => (<FormItem><FormLabel>Make</FormLabel><FormControl><Input placeholder="e.g., Maruti Suzuki" {...field} /></FormControl><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="model" render={({ field }) => (<FormItem><FormLabel>Model</FormLabel><FormControl><Input placeholder="e.g., Swift" {...field} /></FormControl><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="variant" render={({ field }) => (<FormItem><FormLabel>Variant</FormLabel><FormControl><Input placeholder="e.g., VXI" {...field} /></FormControl><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="year" render={({ field }) => (<FormItem><FormLabel>Year (Legacy)</FormLabel><FormControl><Input type="number" placeholder={String(currentYear)} {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
             <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="For Sale">For Sale</SelectItem><SelectItem value="Paused">Paused</SelectItem><SelectItem value="Sold">Sold</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="verified" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm md:col-span-2"><div className="space-y-0.5"><FormLabel>Verification Status</FormLabel><FormDescription>Is this vehicle verified by us?</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
        </FormSection>

        <FormSection title="Basic Details">
            <FormField control={form.control} name="mfgYear" render={({ field }) => (<FormItem><FormLabel>Manufacturing Year</FormLabel><FormControl><Input type="number" placeholder={String(currentYear)} {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="regYear" render={({ field }) => (<FormItem><FormLabel>Registration Year</FormLabel><FormControl><Input type="number" placeholder={String(currentYear)} {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="regNumber" render={({ field }) => (<FormItem><FormLabel>Registration Number</FormLabel><FormControl><Input placeholder="e.g., MH12AB1234" {...field} /></FormControl><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="odometer" render={({ field }) => (<FormItem><FormLabel>Odometer (kms driven)</FormLabel><FormControl><Input type="number" placeholder="45000" {...field} /></FormControl><FormMessage /></FormItem>)}/>
        </FormSection>
        
        <FormSection title="Technical &amp; Other Details">
            <FormField control={form.control} name="fuelType" render={({ field }) => (<FormItem><FormLabel>Fuel Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Petrol">Petrol</SelectItem><SelectItem value="Diesel">Diesel</SelectItem><SelectItem value="CNG">CNG</SelectItem><SelectItem value="Electric">Electric</SelectItem><SelectItem value="LPG">LPG</SelectItem><SelectItem value="Hybrid">Hybrid</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="transmission" render={({ field }) => (<FormItem><FormLabel>Transmission</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Manual">Manual</SelectItem><SelectItem value="Automatic">Automatic</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="rtoState" render={({ field }) => (<FormItem><FormLabel>RTO State</FormLabel><FormControl><Input placeholder="e.g., Maharashtra" {...field} /></FormControl><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="ownership" render={({ field }) => (<FormItem><FormLabel>Ownership</FormLabel><FormControl><Input placeholder="e.g., 1st Owner" {...field} /></FormControl><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="insurance" render={({ field }) => (<FormItem><FormLabel>Insurance</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Insurance" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Comprehensive">Comprehensive</SelectItem><SelectItem value="Third Party">Third Party</SelectItem><SelectItem value="None">None</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="serviceHistory" render={({ field }) => (<FormItem><FormLabel>Service History</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Available">Available</SelectItem><SelectItem value="Not Available">Not Available</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="color" render={({ field }) => (<FormItem><FormLabel>Color</FormLabel><FormControl><Input placeholder="e.g., White" {...field} /></FormControl><FormMessage /></FormItem>)}/>
        </FormSection>

        <FormSection title="Exterior Images" description="Upload images for each exterior view of the vehicle.">
             <FormField control={form.control} name="img_front_right" render={({ field }) => (<ImageUploadField field={field} label="Front-Right Angle View" setImageFile={(file) => setImageFile('img_front_right', file)}/>)}/>
             <FormField control={form.control} name="img_right" render={({ field }) => (<ImageUploadField field={field} label="Right Side Profile" setImageFile={(file) => setImageFile('img_right', file)}/>)}/>
             <FormField control={form.control} name="img_back_right" render={({ field }) => (<ImageUploadField field={field} label="Back-Right Angle View" setImageFile={(file) => setImageFile('img_back_right', file)}/>)}/>
             <FormField control={form.control} name="img_back" render={({ field }) => (<ImageUploadField field={field} label="Back Main View" setImageFile={(file) => setImageFile('img_back', file)}/>)}/>
             <FormField control={form.control} name="img_open_dickey" render={({ field }) => (<ImageUploadField field={field} label="Open Dickey/Boot" setImageFile={(file) => setImageFile('img_open_dickey', file)}/>)}/>
             <FormField control={form.control} name="img_back_left" render={({ field }) => (<ImageUploadField field={field} label="Back-Left Angle View" setImageFile={(file) => setImageFile('img_back_left', file)}/>)}/>
             <FormField control={form.control} name="img_left" render={({ field }) => (<ImageUploadField field={field} label="Left Side Profile" setImageFile={(file) => setImageFile('img_left', file)}/>)}/>
             <FormField control={form.control} name="img_front_left" render={({ field }) => (<ImageUploadField field={field} label="Front-Left Angle View" setImageFile={(file) => setImageFile('img_front_left', file)}/>)}/>
             <FormField control={form.control} name="img_open_bonnet" render={({ field }) => (<ImageUploadField field={field} label="Open Bonnet" setImageFile={(file) => setImageFile('img_open_bonnet', file)}/>)}/>
        </FormSection>

        <FormSection title="Interior Images">
            <FormField control={form.control} name="img_dashboard" render={({ field }) => (<ImageUploadField field={field} label="Dashboard &amp; Odometer" setImageFile={(file) => setImageFile('img_dashboard', file)}/>)}/>
            <FormField control={form.control} name="img_right_front_door" render={({ field }) => (<ImageUploadField field={field} label="Right Front Door Open" setImageFile={(file) => setImageFile('img_right_front_door', file)}/>)}/>
            <FormField control={form.control} name="img_right_back_door" render={({ field }) => (<ImageUploadField field={field} label="Right Back Door Open" setImageFile={(file) => setImageFile('img_right_back_door', file)}/>)}/>
        </FormSection>
        
        <FormSection title="Tyre Images">
            <FormField control={form.control} name="img_tyre_1" render={({ field }) => (<ImageUploadField field={field} label="Tyre 1" setImageFile={(file) => setImageFile('img_tyre_1', file)}/>)}/>
            <FormField control={form.control} name="img_tyre_2" render={({ field }) => (<ImageUploadField field={field} label="Tyre 2" setImageFile={(file) => setImageFile('img_tyre_2', file)}/>)}/>
            <FormField control={form.control} name="img_tyre_3" render={({ field }) => (<ImageUploadField field={field} label="Tyre 3" setImageFile={(file) => setImageFile('img_tyre_3', file)}/>)}/>
            <FormField control={form.control} name="img_tyre_4" render={({ field }) => (<ImageUploadField field={field} label="Tyre 4" setImageFile={(file) => setImageFile('img_tyre_4', file)}/>)}/>
            <FormField control={form.control} name="img_tyre_optional" render={({ field }) => (<ImageUploadField field={field} label="Separate Tyre (Optional)" setImageFile={(file) => setImageFile('img_tyre_optional', file)}/>)}/>
        </FormSection>

        <FormSection title="Other Images">
            <FormField control={form.control} name="img_engine" render={({ field }) => (<ImageUploadField field={field} label="Engine Image" setImageFile={(file) => setImageFile('img_engine', file)}/>)}/>
            <FormField control={form.control} name="img_roof" render={({ field }) => (<ImageUploadField field={field} label="Roof Image" setImageFile={(file) => setImageFile('img_roof', file)}/>)}/>
        </FormSection>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Processing...</> : (vehicle ? "Save Changes" : "List Vehicle")}
        </Button>
      </form>
    </Form>
  );
}
