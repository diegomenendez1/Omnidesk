
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Table2, UploadCloud } from "lucide-react";
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
import { useLanguage } from '@/context/language-context';
import { useAuth } from "@/context/auth-context"; // Import useAuth

const navItems = [
  { href: "/dashboard", labelKey: "sidebar.dashboard", icon: LayoutDashboard },
  { href: "/table", labelKey: "sidebar.interactiveTable", icon: Table2 },
  { href: "/upload-data", labelKey: "sidebar.uploadData", icon: UploadCloud },
];

export function AppSidebar() {
  const pathname = usePathname(); // Hook at top
  const { t } = useLanguage(); // Hook at top
  const { user } = useAuth(); // Hook at top
  const { state: sidebarState } = useSidebar(); // Hook at top
  
  const [currentActivePath, setCurrentActivePath] = useState<string | null>(null); // Hook at top
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Hook at top
  const [hydrated, setHydrated] = useState(false); // Hook at top

  useEffect(() => { 
    setHydrated(true); 
  }, []);

  useEffect(() => { 
    if (hydrated) {
      setCurrentActivePath(pathname); 
    }
  }, [pathname, hydrated]);

  useEffect(() => { 
    if (hydrated) {
      setIsSidebarCollapsed(sidebarState === 'collapsed'); 
    }
  }, [sidebarState, hydrated]);
  
  const logoText = hydrated ? (isSidebarCollapsed ? "OD" : t('appName')) : t('appName');

  // AppSidebar should not render if there's no user (handled by AppContent in layout.tsx)
  // but as a failsafe or if AppSidebar is used elsewhere, this check is good.
  if (!user) {
    return null;
  }

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
            const isActive = hydrated && currentActivePath
              ? currentActivePath === item.href ||
                (item.href === "/dashboard" && currentActivePath === "/") ||
                (item.href !== "/dashboard" && currentActivePath.startsWith(item.href))
              : false;
            
            const translatedLabel = t(item.labelKey as any);

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={{ children: translatedLabel, side: "right" }}
                  className="justify-start"
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{translatedLabel}</span>
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
            <AvatarFallback>{user?.name?.charAt(0)?.toUpperCase() || t('appName').charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium text-sidebar-foreground">{user?.name || t('sidebar.adminUser')}</span>
            <span className="text-xs text-muted-foreground">{user?.email || t('sidebar.adminEmail')}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
