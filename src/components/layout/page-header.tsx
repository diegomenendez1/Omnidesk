
"use client";

import { usePathname } from "next/navigation";
import { Bell, Search, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/language-context';
import type { Locale } from '@/lib/translations';

function getPageTitleKey(pathname: string | null): string {
  if (!pathname) return "pageHeader.appName"; // Fallback to appName or a generic title
  if (pathname === "/" || pathname.startsWith("/dashboard")) return "pageHeader.dashboard";
  if (pathname.startsWith("/table")) return "pageHeader.interactiveTable";
  if (pathname.startsWith("/upload-data")) return "pageHeader.uploadData";
  return "pageHeader.appName"; // Fallback for unknown paths
}

export function PageHeader() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const [titleKey, setTitleKey] = useState<string>("pageHeader.appName");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      setTitleKey(getPageTitleKey(pathname));
    }
  }, [pathname, hydrated]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm min-w-0">
      <div className="flex items-center gap-2 flex-shrink min-w-0">
        <SidebarTrigger />
        <h1 className="text-xl font-semibold text-foreground truncate">
          {t(titleKey as any)} {/* Use 'any' for key type if complex keys are problematic for TS */}
        </h1>
      </div>
      
      <div className="ml-auto flex items-center gap-2 md:gap-4 flex-shrink-0">
        <form className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('pageHeader.searchPlaceholder')}
            className="pl-8 sm:w-[200px] md:w-[200px] lg:w-[300px] rounded-full bg-muted border-none focus-visible:ring-primary"
          />
        </form>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Globe className="h-5 w-5" />
              <span className="sr-only">{t('pageHeader.language')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('pageHeader.language')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={language} onValueChange={(value) => setLanguage(value as Locale)}>
              <DropdownMenuRadioItem value="en">{t('pageHeader.english')}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="es">{t('pageHeader.spanish')}</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">{t('pageHeader.notifications')}</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="user avatar" />
                <AvatarFallback>OD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('pageHeader.myAccount')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>{t('pageHeader.profile')}</DropdownMenuItem>
            <DropdownMenuItem>{t('pageHeader.settings')}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>{t('pageHeader.logout')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
