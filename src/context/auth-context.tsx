
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const router = useRouter();
  const pathname = usePathname(); // Called unconditionally

  useEffect(() => {
    // Simulate checking auth state on mount (e.g., from localStorage or a token)
    // In a real app, you'd verify a token or session here.
    // For this prototype, just simulate a delay.
    const timer = setTimeout(() => {
      // const storedUser = localStorage.getItem('authUser');
      // if (storedUser) {
      //   setUser(JSON.parse(storedUser));
      // }
      setIsLoading(false);
    }, 500); // Simulate initial auth check delay
    return () => clearTimeout(timer);
  }, []);

  const login = async (email: string, password?: string): Promise<boolean> => {
    setIsLoading(true);
    // Simulate API call for login
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Basic validation for prototype purposes
    if (email && password) { // In a real app, validate against backend
      const simulatedUser: User = { id: Date.now().toString(), email: email, name: email.split('@')[0] || "User" };
      setUser(simulatedUser);
      // localStorage.setItem('authUser', JSON.stringify(simulatedUser)); // Optional: persist session
      setIsLoading(false);
      return true;
    }
    // setError(t('loginPage.invalidCredentials')); // Error handling should be in the login form
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    // localStorage.removeItem('authUser'); // Optional: clear persisted session
    setIsLoading(false); // Set loading to false after logout
    // No need to check pathname here, AppContent will handle redirect
    router.push('/login');
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
