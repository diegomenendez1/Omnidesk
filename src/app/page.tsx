
import { redirect } from 'next/navigation';

export default function HomePage() {
  // The AppContent component in RootLayout will handle redirecting
  // to /login if not authenticated or allowing access to /dashboard if authenticated.
  // This page primarily serves as an entry point that gets rerouted.
  redirect('/dashboard');
  // Return null or an empty fragment as redirect will prevent rendering of this component.
  return null; 
}
