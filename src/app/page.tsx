
import { redirect } from 'next/navigation';

export default function HomePage() {
  // The AuthGuard in RootLayout will handle redirecting to /login if not authenticated
  // or to /dashboard if authenticated.
  // If user is authenticated, this redirect will be caught by RootLayout's logic if it tries to go to /login.
  // If not authenticated, RootLayout redirects to /login before this page is fully processed.
  // Defaulting to dashboard, RootLayout handles the auth check.
  redirect('/dashboard');
  // return null; 
}
