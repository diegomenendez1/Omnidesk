
"use client";

import { usePathname } from "next/navigation";
import { Bell, Search, Globe, Sun, Moon, Laptop } from "lucide-react"; // Added theme icons
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
import { useTheme } from '@/context/theme-context'; // Import useTheme
import type { Theme } from '@/context/theme-context'; // Import Theme type

function getPageTitleKey(pathname: string | null): string {
  if (!pathname) return "pageHeader.appName";
  if (pathname === "/" || pathname.startsWith("/dashboard")) return "pageHeader.dashboard";
  if (pathname.startsWith("/table")) return "pageHeader.interactiveTable";
  if (pathname.startsWith("/upload-data")) return "pageHeader.uploadData";
  return "pageHeader.appName";
}

export function PageHeader() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme(); // Use theme context
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

  const pageTitle = hydrated ? t(titleKey as any) : t('pageHeader.appName' as any);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm min-w-0">
      <div className="flex items-center gap-2 flex-shrink min-w-0">
        <SidebarTrigger />
        <h1 className="text-xl font-semibold text-foreground truncate">
          {pageTitle}
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

        {/* Theme Switcher Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">{t('pageHeader.theme.toggle')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('pageHeader.theme.title')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="mr-2 h-4 w-4" />
              <span>{t('pageHeader.theme.light')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="mr-2 h-4 w-4" />
              <span>{t('pageHeader.theme.dark')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <Laptop className="mr-2 h-4 w-4" />
              <span>{t('pageHeader.theme.system')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Language Switcher Dropdown */}
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
