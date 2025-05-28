
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
import { usePathname, useRouter } from 'next/navigation'; // Import useRouter
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
  const { user, isLoading } = useAuth(); // Hook called at top level
  const pathname = usePathname();   // Hook called at top level
  const router = useRouter();       // Hook called at top level
  
  useEffect(() => {
    // Update document title based on user authentication status
    document.title = user ? 'OmniDeck - Your Team Workspace' : 'OmniDeck - Login';
  }, [user]);

  useEffect(() => {
    if (!isLoading) {
      if (!user && pathname !== "/login") {
        router.replace("/login");
      } else if (user && pathname === "/login") {
        router.replace("/dashboard"); // Use /dashboard as main screen
      }
    }
  }, [user, isLoading, pathname, router]);

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
      // useEffect is handling the redirect to /login.
      // Return null (or a loader) to prevent rendering protected content during the redirect.
      return null; 
    }
    // User is not authenticated AND pathname IS /login
    return <>{children}</>; // Render the login page
  }

  // User IS authenticated (user is true)
  if (pathname === '/login') {
    // useEffect is handling the redirect to /dashboard.
    // Return null (or a loader) to prevent rendering the login page during the redirect.
    return null;
  }
  
  // User is authenticated AND pathname IS NOT /login
  // Render the main app layout
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
