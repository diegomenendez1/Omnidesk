
"use client"; // Root layout must be client component if using hooks like usePathname or context hooks

import type { Metadata } from 'next'; // No longer used directly due to client component
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { MainContentArea } from '@/components/layout/main-content-area';
import { Toaster } from "@/components/ui/toaster";
import { Geist, Geist_Mono } from 'next/font/google';
import { LanguageProvider } from '@/context/language-context';
import { ThemeProvider } from '@/context/theme-context';
import { AuthProvider, useAuth } from '@/context/auth-context'; // Import AuthProvider and useAuth
import { usePathname, redirect } from 'next/navigation';
import { useEffect } from 'react'; // For metadata
import { Loader2 } from 'lucide-react'; // For loading spinner

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Metadata can't be exported from client component directly.
// export const metadata: Metadata = {
// title: 'OmniDeck - Your Team Workspace',
// description: 'Efficiently manage your team projects and data with OmniDeck.',
// };

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    document.title = user ? 'OmniDeck - Your Team Workspace' : 'OmniDeck - Login';
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && pathname !== '/login') {
    redirect('/login');
    return null; // Or a loading/redirecting indicator
  }

  if (user && pathname === '/login') {
    redirect('/dashboard');
    return null; // Or a loading/redirecting indicator
  }

  // Render children directly if on login page and not authenticated
  if (!user && pathname === '/login') {
    return <>{children}</>;
  }
  
  // Render main app layout if authenticated
  if (user) {
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

  // Fallback for any other unhandled case (should not happen if logic is correct)
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
