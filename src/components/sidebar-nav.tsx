"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { FileText, ClipboardCheck, LayoutDashboard, Users } from "lucide-react";

const menuItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/users", icon: Users, label: "Users" },
  { href: "/dashboard/contact", icon: FileText, label: "Contact Forms" },
  { href: "/dashboard/inspections", icon: ClipboardCheck, label: "Inspections" },
];

export function SidebarNav() {
    const pathname = usePathname();

    return (
        <>
            {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild tooltip={item.label} data-active={pathname === item.href}>
                        <Link href={item.href}>
                            <item.icon />
                            <span>{item.label}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </>
    );
}
