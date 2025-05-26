
import type { Metadata } from 'next';
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { MainContentArea } from '@/components/layout/main-content-area';
import { Toaster } from "@/components/ui/toaster";
import { Geist, Geist_Mono } from 'next/font/google';
import { LanguageProvider } from '@/context/language-context';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'OmniDeck - Your Team Workspace', // This could also be made dynamic with context
  description: 'Efficiently manage your team projects and data with OmniDeck.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}>
        <LanguageProvider>
          <SidebarProvider defaultOpen={true}>
            <div className="flex h-full overflow-hidden">
              <AppSidebar />
              <MainContentArea>
                {children}
              </MainContentArea>
            </div>
            <Toaster />
          </SidebarProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
