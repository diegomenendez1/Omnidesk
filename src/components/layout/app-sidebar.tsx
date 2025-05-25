
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Table2 } from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// Separator is not used directly in this version of AppSidebar, but kept if needed elsewhere.
// import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from 'react';

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/table", label: "Interactive Table", icon: Table2 },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [currentActivePath, setCurrentActivePath] = useState<string | null>(null);

  useEffect(() => {
    // This ensures currentActivePath is set only on the client after hydration,
    // using the pathname from the client-side router.
    setCurrentActivePath(pathname);
  }, [pathname]);

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="border-r">
      <SidebarHeader className="p-4 flex justify-center group-data-[collapsible=icon]:py-4 group-data-[collapsible=icon]:px-2">
        <Link href="/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <span className="text-2xl font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">OmniDeck</span><span className="text-2xl font-bold text-sidebar-foreground group-data-[collapsible=icon]:block hidden">OD</span>
        </Link>
      </SidebarHeader>
      {/* Separator removed for cleaner look based on previous request */}
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => {
            // Determine if the item is active based on currentActivePath.
            // Defaults to false if currentActivePath is null (server-render or initial client-render before useEffect).
            const isActive = currentActivePath
              ? currentActivePath === item.href ||
                (item.href === "/dashboard" && currentActivePath === "/") || // Special case for dashboard on root
                (item.href === "/table" && currentActivePath.startsWith(item.href)) || // Special case for table and its sub-routes
                (item.href !== "/dashboard" && item.href !== "/table" && currentActivePath.startsWith(item.href)) // General case for other routes
              : false;

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive} // isActive is now consistently false on SSR and initial client render
                  tooltip={{ children: item.label, side: "right" }}
                  className="justify-start"
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      {/* Separator removed from here in a previous step, kept for context if needed for footer styling */}
      {/* <Separator className="group-data-[collapsible=icon]:hidden bg-sidebar-border" /> */}
      <SidebarFooter className="p-4 mt-auto group-data-[collapsible=icon]:p-2">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="user avatar" />
            <AvatarFallback>OD</AvatarFallback>
          </Avatar>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium text-sidebar-foreground">Admin User</span>
            <span className="text-xs text-muted-foreground">admin@omnideck.com</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
