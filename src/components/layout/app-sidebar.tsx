
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
import { useState, useEffect } from 'react';

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/table", label: "Interactive Table", icon: Table2 },
];

// Logo component to ensure clean rendering as a child of Link
const AppLogo = () => (
  <>
    <span className="text-2xl font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">OmniDeck</span>
    <span className="text-2xl font-bold text-sidebar-foreground hidden group-data-[collapsible=icon]:block">OD</span>
  </>
);

export function AppSidebar() {
  const pathname = usePathname();
  // Initialize currentActivePath to null. Server will render with this,
  // and client will initially render with this before useEffect updates it.
  const [currentActivePath, setCurrentActivePath] = useState<string | null>(null);

  useEffect(() => {
    // This effect runs only on the client, after initial hydration
    setCurrentActivePath(pathname);
  }, [pathname]); // Re-run if pathname changes (client-side navigation)

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="border-r">
      <SidebarHeader className="p-4 flex justify-center group-data-[collapsible=icon]:py-4 group-data-[collapsible=icon]:px-2">
        <Link href="/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <AppLogo />
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => {
            // isActive will be false on server and initial client render because currentActivePath is null.
            // It will be updated correctly on the client after useEffect sets currentActivePath.
            const isActive = currentActivePath
              ? currentActivePath === item.href ||
                (item.href === "/dashboard" && currentActivePath === "/") || 
                (item.href !== "/dashboard" && currentActivePath.startsWith(item.href))
              : false; 

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
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

