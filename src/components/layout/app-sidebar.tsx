
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
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/table", label: "Interactive Table", icon: Table2 },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="border-r">
      <SidebarHeader className="p-4 flex justify-center group-data-[collapsible=icon]:py-4 group-data-[collapsible=icon]:px-2">
        <Link href="/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <span className="text-2xl font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">OmniDeck</span>
           <span className="text-2xl font-bold text-sidebar-foreground group-data-[collapsible=icon]:block hidden">OD</span> {/* Short version for collapsed */}
        </Link>
      </SidebarHeader>
      {/* Separator removed for cleaner look */}
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href || (item.href !== "/dashboard" && item.href !== "/table" && pathname.startsWith(item.href)) || (item.href === "/dashboard" && pathname === "/") || (item.href === "/table" && pathname.startsWith("/table"))}
                tooltip={{ children: item.label, side: "right" }}
                className="justify-start"
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <Separator className="group-data-[collapsible=icon]:hidden bg-sidebar-border" /> {/* Added bg-sidebar-border for visibility */}
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
