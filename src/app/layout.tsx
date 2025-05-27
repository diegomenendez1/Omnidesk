
"use client"; // Root layout must be client component if using hooks like usePathname or context hooks

import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { MainContentArea } from '@/components/layout/main-content-area';
import { Toaster } from "@/components/ui/toaster";
import { Geist, Geist_Mono } from 'next/font/google';
import { LanguageProvider } from '@/context/language-context';
import { ThemeProvider } from '@/context/theme-context';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { usePathname, redirect } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// AppContent component to handle auth logic and conditional rendering
function AppContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    // Update document title based on user authentication status
    // This effect runs after all hooks in AppContent are processed.
    document.title = user ? 'OmniDeck - Your Team Workspace' : 'OmniDeck - Login';
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // User is not authenticated
  if (!user) {
    if (pathname !== '/login') {
      redirect('/login');
      return null; // Important: return null after redirect to prevent further rendering
    }
    // If on /login and not authenticated, render the login page
    return <>{children}</>;
  }

  // User is authenticated
  if (user) {
    if (pathname === '/login') {
      redirect('/dashboard');
      return null; // Important: return null after redirect
    }
    // If authenticated and not on /login, render the main app layout
    return (
      <SidebarProvider defaultOpen={true}>
        <div className="flex h-full overflow-hidden">
          <AppSidebar />
          <MainContentArea>
            {children}
          </MainContentArea>
        </div>
        <Toaster />
      </SidebarProvider>
    );
  }

  // Fallback, should ideally not be reached if logic above is correct
  return null;
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}>
        <AuthProvider>
          <ThemeProvider>
            <LanguageProvider>
                <AppContent>{children}</AppContent>
            </LanguageProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
