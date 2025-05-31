
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Table2, UploadCloud, Users } from "lucide-react"; // Added Users icon
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
import { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { useLanguage } from '@/context/language-context';
import { useAuth } from "@/context/auth-context";

const navItemsBase = [
  { href: "/dashboard", labelKey: "sidebar.dashboard", icon: LayoutDashboard },
  { href: "/table", labelKey: "sidebar.interactiveTable", icon: Table2 },
  { href: "/upload-data", labelKey: "sidebar.uploadData", icon: UploadCloud },
];

const adminNavItems = [
  { href: "/admin/users", labelKey: "sidebar.userManagement", icon: Users },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { state: sidebarState } = useSidebar();
  
  const [currentActivePath, setCurrentActivePath] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

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

  if (!user) {
    return null;
  }

  const displayedNavItems = [
    ...navItemsBase,
    ...(user?.role === 'owner' || user?.role === 'admin' ? adminNavItems : [])
  ];

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="border-r">
      <SidebarHeader className="p-4 flex justify-center group-data-[collapsible=icon]:py-4 group-data-[collapsible=icon]:px-2">
        <Link href="/dashboard" className="flex items-center gap-2 text-2xl font-bold text-sidebar-foreground">
          {logoText}
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {displayedNavItems.map((item) => {
            const isActive = hydrated && currentActivePath
              ? currentActivePath === item.href ||
                (item.href === "/dashboard" && currentActivePath === "/") ||
                (item.href !== "/dashboard" && currentActivePath.startsWith(item.href))
              : false;
            
            const translatedLabel = t(item.labelKey as any);

            const tooltipConfig = useMemo(() => ({
              children: translatedLabel,
              side: "right" as const, // Explicitly type 'side' for stability
            }), [translatedLabel]);

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={tooltipConfig} // Use the memoized tooltip object
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
