
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React, { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { addBanner, updateBanner, MarketplaceBanner } from "@/lib/banners";
import { Loader2, UploadCloud } from "lucide-react";
import Image from "next/image";

const bannerSchema = z.object({
  title: z.string().min(2, "Title is required"),
  imageUrl: z.string().min(1, "Image is required"),
  status: z.enum(["Active", "Inactive"]),
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
  // Preview for locally selected file ONLY
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Determine what to show: local file preview, existing image from DB, or nothing.
  const previewSrc = localPreview || field.value;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setLocalPreview(localUrl); // Show preview immediately for local file
      setImageFile(file); // Store the file for upload on submit
      // This tells the form that we have a value, so validation passes.
      field.onChange('new_image_selected');
    } else {
      setLocalPreview(null);
      setImageFile(null);
      field.onChange(''); // Clear the field value if no file is selected
    }
  };

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <div className="flex items-center gap-4">
        {!!previewSrc ? (
          <Image src={previewSrc} alt={`${label} preview`} width={240} height={80} className="rounded-md object-cover border" />
        ) : (
          <div className="w-[240px] h-[80px] bg-secondary rounded-md flex items-center justify-center text-muted-foreground">
             <UploadCloud className="w-8 h-8" />
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
          {previewSrc ? 'Change Image' : 'Select Image (1200x400)'}
        </Button>
      </div>
       <FormMessage />
    </FormItem>
  );
};

type BannerFormProps = {
  banner: MarketplaceBanner | null | undefined;
  onFormSubmit: () => void;
};

export function BannerForm({ banner, onFormSubmit }: BannerFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  
  const [imageFile, setImageFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof bannerSchema>>({
    resolver: zodResolver(bannerSchema),
    defaultValues: banner || {
      title: "",
      imageUrl: "",
      status: "Active" as const,
    },
  });
  
  React.useEffect(() => {
    form.reset(banner || {
      title: "",
      imageUrl: "",
      status: "Active" as const,
    });
    setImageFile(null); // Reset the selected file on prop change
  }, [banner, form]);


  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('destination', 'banners'); // Specify destination folder

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
  
  async function onSubmit(values: z.infer<typeof bannerSchema>) {
    setIsLoading(true);

    let finalValues = { ...values };

    // If a new image was selected, upload it first.
    if (imageFile) {
        const path = await uploadFile(imageFile);
        if (path) {
            finalValues.imageUrl = path;
        } else {
            // Stop submission if upload fails
            setIsLoading(false);
            return;
        }
    }
    
    // Final check to ensure imageUrl is not empty or the temp value
    if (!finalValues.imageUrl || finalValues.imageUrl === "new_image_selected") {
       // This can happen if the user is editing without changing the image.
       // In that case, we should use the original banner's imageUrl.
       if (banner?.imageUrl) {
           finalValues.imageUrl = banner.imageUrl;
       } else {
            form.setError("imageUrl", { type: "manual", message: "Image is required." });
            setIsLoading(false);
            return;
       }
    }
    
    try {
        if (banner) {
            await updateBanner(banner.id, finalValues);
            toast({ title: "Banner Updated", description: "The banner details have been updated." });
        } else {
            await addBanner(finalValues);
            toast({ title: "Banner Added", description: "The new banner has been added." });
        }
        onFormSubmit();
    } catch (e) {
        const error = e as Error;
        toast({ variant: 'destructive', title: "Error", description: error.message || "Could not save the banner." });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
        
        <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Banner Title</FormLabel><FormControl><Input placeholder="e.g., Diwali Sale" {...field} /></FormControl><FormMessage /></FormItem>)}/>
        
        <FormField control={form.control} name="imageUrl" render={({ field }) => (<ImageUploadField field={field} label="Banner Image" setImageFile={setImageFile} />)}/>
        
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Processing...</> : (banner ? "Save Changes" : "Add Banner")}
        </Button>
      </form>
    </Form>
  );
}
