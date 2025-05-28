
"use client"; 

import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { MainContentArea } from '@/components/layout/main-content-area';
import { Toaster } from "@/components/ui/toaster";
import { Geist, Geist_Mono } from 'next/font/google';
import { LanguageProvider } from '@/context/language-context';
import { ThemeProvider } from '@/context/theme-context';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { usePathname, useRouter } from 'next/navigation'; 
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

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth(); 
  const pathname = usePathname();   
  const router = useRouter();       
  
  useEffect(() => {
    // This log helps trace the state for redirection logic
    console.log('AppContent useEffect - State check:', { user: user?.email, isLoading, pathname });
    if (!isLoading) { // Only attempt to redirect if the initial auth check is complete
      if (!user && pathname !== "/login") {
        console.log('AppContent: No user, not on /login. Redirecting to /login.');
        router.replace("/login");
      } else if (user && pathname === "/login") {
        console.log('AppContent: User exists, on /login. Redirecting to /dashboard.');
        router.replace("/dashboard"); 
      }
    }
  }, [user, isLoading, pathname, router]);

  useEffect(() => {
    // Update document title based on authentication status
    if (user) {
      document.title = 'OmniDeck - Your Team Workspace';
    } else {
      document.title = 'OmniDeck - Login';
    }
  }, [user]);


  if (isLoading) {
    console.log('AppContent: isLoading is true, rendering global loader.');
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If not loading, decide what to render or if redirection is pending

  if (!user && pathname === "/login") {
    console.log('AppContent: No user, on /login. Rendering children (LoginPage).');
    return <>{children}</>; // Render the login page
  }
  
  if (!user && pathname !== "/login") {
    // Redirection to /login is being handled by useEffect.
    // Return null to avoid rendering protected content momentarily.
    console.log('AppContent: No user, not on /login. Awaiting redirect, rendering null.');
    return null; 
  }
  
  if (user && pathname === "/login") {
    // Redirection to /dashboard is being handled by useEffect.
    // Return null to avoid rendering login page momentarily.
    console.log('AppContent: User exists, on /login. Awaiting redirect, rendering null.');
    return null;
  }
  
  if (user) { // User is authenticated AND pathname IS NOT /login
    console.log('AppContent: User exists, not on /login. Rendering main app layout.');
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
  
  // Fallback, should ideally not be reached if logic above is exhaustive
  console.log('AppContent: Fallback - rendering null. This should not happen in normal flow.');
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
