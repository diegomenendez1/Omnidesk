import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/dashboard');
  // return null; // Or an empty fragment, redirect handles the rendering
}
