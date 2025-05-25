
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from 'react';

// Nav items
const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/table", label: "Interactive Table", icon: Table2 },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [currentActivePath, setCurrentActivePath] = useState<string | null>(null);
  const { state: sidebarState } = useSidebar();
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true); 
  }, []);

  useEffect(() => {
    setCurrentActivePath(pathname);
  }, [pathname, hydrated]); // Ensure pathname logic runs after hydration too

  useEffect(() => {
    setIsSidebarCollapsed(sidebarState === 'collapsed');
  }, [sidebarState, hydrated]); // Ensure sidebar state logic runs after hydration

  const logoText = hydrated ? (isSidebarCollapsed ? "OD" : "OmniDeck") : "OmniDeck";

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="border-r">
      <SidebarHeader className="p-4 flex justify-center group-data-[collapsible=icon]:py-4 group-data-[collapsible=icon]:px-2">
        <Link href="/dashboard" className="flex items-center gap-2 text-2xl font-bold text-sidebar-foreground">
          {logoText}
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => {
            // currentActivePath is null on server & initial client, so isActive is false
            // It updates after hydration via useEffect
            const isActive = hydrated && currentActivePath
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
