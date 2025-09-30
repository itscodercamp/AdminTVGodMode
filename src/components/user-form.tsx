
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React from "react";
import { CalendarIcon, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { User, addUser, updateUser } from "@/lib/users";
import { ScrollArea } from "./ui/scroll-area";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name is required." }),
  email: z.string().email(),
  phone: z.string().min(10, { message: "Enter a valid 10-digit phone number." }),
  dob: z.date({ required_error: "Date of birth is required." }),
  designation: z.enum(['Sales', 'Inspector', 'Manager', 'Admin'], { required_error: "Designation is required." }),
  joiningDate: z.date({ required_error: "Joining date is required." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }).optional().or(z.literal('')),
});

type UserFormProps = {
  user: Omit<User, 'password'> | null;
  onFormSubmit: () => void;
};

export function UserForm({ user, onFormSubmit }: UserFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const { toast } = useToast();
  
  const defaultValues = user ? {
        ...user,
        dob: new Date(user.dob),
        joiningDate: new Date(user.joiningDate),
        password: "", // Always empty for edit
        phone: user.phone || "",
    } : {
        name: "",
        email: "",
        phone: "",
        designation: undefined,
        password: "",
        dob: undefined,
        joiningDate: undefined,
    };


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues
  });
  
  React.useEffect(() => {
    if (user) {
        form.reset({
            ...user,
            dob: new Date(user.dob),
            joiningDate: new Date(user.joiningDate),
            password: "",
            phone: user.phone || ""
        });
    } else {
        form.reset(defaultValues);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    const userData = {
        ...values,
        dob: values.dob.toISOString(),
        joiningDate: values.joiningDate.toISOString(),
        phone: values.phone,
    };

    try {
        if (user) {
            // Update existing user
            const updatedUserData: Partial<User> = { ...userData };
            if (!userData.password) {
                // If password field is empty during update, don't change it.
                delete updatedUserData.password;
            }
            await updateUser(user.id, updatedUserData);
            toast({
                title: "Employee Updated",
                description: "Employee details have been successfully updated.",
            });
        } else {
            // Add new user
             if (!userData.password) {
                toast({ variant: "destructive", title: "Error", description: "Password is required for new employee." });
                setIsLoading(false);
                return;
            }
            await addUser(userData as any); // Type assertion as password will be present
            toast({
                title: "Employee Created",
                description: "New employee has been successfully added.",
            });
        }
        form.reset();
        onFormSubmit();
    } catch (error) {
        const err = error as Error;
         toast({
            variant: "destructive",
            title: "An Error Occurred",
            description: err.message || "Could not save employee details. Please try again.",
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="p-4">
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )}/>
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
            <FormField control={form.control} name="designation" render={({ field }) => (
                <FormItem>
                <FormLabel>Designation</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select a designation..." /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Inspector">Inspector</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}/>
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="dob" render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Date of Birth</FormLabel>
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
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                            </PopoverContent>
                        </Popover>
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
            </div>
            <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                <FormLabel>{user ? "New Password (optional)" : "Password"}</FormLabel>
                <div className="relative">
                    <FormControl>
                    <Input placeholder="••••••••" {...field} type={showPassword ? "text" : "password"}/>
                    </FormControl>
                    <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                    </Button>
                </div>
                <FormMessage />
                </FormItem>
            )}/>
            <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Saving..." : (user ? "Save Changes" : "Create Employee")}
            </Button>
        </form>
        </Form>
        </div>
    </ScrollArea>
  );
}
