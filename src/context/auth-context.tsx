
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Import useRouter

interface User {
  id: string;
  email: string;
  name?: string;
  // Add other user properties as needed
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>; // Made login async and accept password
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const router = useRouter();
  const pathname = usePathname();

  // Simulate checking auth state on mount (e.g., from localStorage or a token)
  useEffect(() => {
    setIsLoading(true);
    // In a real app, you'd verify a token or session here.
    // For now, we'll assume no persistent session for simplicity in this prototype.
    // If you had a way to check, you might do:
    // const checkSession = async () => {
    //   const storedUser = localStorage.getItem('authUser'); // Example
    //   if (storedUser) {
    //     setUser(JSON.parse(storedUser));
    //   }
    //   setIsLoading(false);
    // };
    // checkSession();
    // For this prototype, just simulate a delay and set user to null
     const timeoutId = setTimeout(() => {
      setUser(null); // Default to not logged in
      setIsLoading(false);
    }, 500); // Simulate a small delay for auth check

    return () => clearTimeout(timeoutId);
  }, []);

  const login = async (email: string, password?: string): Promise<boolean> => {
    // Simulate login - in a real app, this would call your backend/Firebase
    // For now, any non-empty email/password logs in.
    // Password check is very basic for simulation.
    if (email) { // Basic check for demo
      const simulatedUser: User = { id: '1', email: email, name: email.split('@')[0] };
      setUser(simulatedUser);
      // localStorage.setItem('authUser', JSON.stringify(simulatedUser)); // Example persistence
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    // localStorage.removeItem('authUser'); // Example persistence
    if (pathname !== '/login') { // Avoid redirect loop if already on login
        router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
