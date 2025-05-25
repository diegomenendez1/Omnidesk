import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter as a clean sans-serif font
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { MainContentArea } from '@/components/layout/main-content-area';
import { Toaster } from "@/components/ui/toaster";
import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'OmniDeck - Your Team Workspace',
  description: 'Efficiently manage your team projects and data with OmniDeck.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SidebarProvider defaultOpen={true}>
          <div className="flex h-screen overflow-hidden">
            <AppSidebar />
            <MainContentArea>
              {children}
            </MainContentArea>
          </div>
          <Toaster />
        </SidebarProvider>
      </body>
    </html>
  );
}
