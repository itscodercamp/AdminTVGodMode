
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React, { useState } from "react";
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

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  imageUrl: z.string().optional(),
  status: z.enum(["Active", "Inactive"]),
});

type BannerFormProps = {
  banner?: MarketplaceBanner | null;
  onFormSubmit: () => void;
};

export function BannerForm({ banner, onFormSubmit }: BannerFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(banner?.imageUrl || null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const defaultValues = banner ? 
    { title: banner.title, status: banner.status, imageUrl: banner.imageUrl } : 
    { title: "", status: "Active" as const, imageUrl: "" };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);
      setImageFile(file);
      form.setValue("imageUrl", localUrl); // Temporary value for preview
    } else {
      setPreview(banner?.imageUrl || null);
      setImageFile(null);
      form.setValue("imageUrl", banner?.imageUrl || "");
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('destination', 'banners');

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
        toast({ variant: 'destructive', title: 'Upload Error', description: err.message });
        return null;
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    let finalImageUrl = banner?.imageUrl || '';

    if (imageFile) {
        const uploadedPath = await uploadFile(imageFile);
        if (uploadedPath) {
            finalImageUrl = uploadedPath;
        } else {
            // Upload failed, stop submission
            setIsLoading(false);
            return;
        }
    }

    if (!finalImageUrl) {
        toast({ variant: 'destructive', title: 'Image Required', description: 'Please upload a banner image.' });
        setIsLoading(false);
        return;
    }

    const bannerData = {
        title: values.title,
        status: values.status,
        imageUrl: finalImageUrl,
    };

    try {
      if (banner) {
        await updateBanner(banner.id, bannerData);
        toast({ title: "Banner Updated", description: "The banner details have been updated." });
      } else {
        await addBanner(bannerData);
        toast({ title: "Banner Added", description: "The new banner has been created." });
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Banner Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Diwali Special Offer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormItem>
            <FormLabel>Banner Image</FormLabel>
            <div className="flex items-center gap-4">
                {preview ? (
                     &lt;img src={preview} alt="Banner preview" width={240} height={80} className="rounded-md object-cover" />
                ) : (
                <div className="w-60 h-20 bg-secondary rounded-md flex items-center justify-center text-muted-foreground">
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
                    {preview ? 'Change Image' : 'Select Image'}
                </Button>
            </div>
            <FormMessage />
        </FormItem>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
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
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</> : (banner ? "Save Changes" : "Add Banner")}
        </Button>
      </form>
    </Form>
  );
}
