
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  onAuthStateChanged,
  signInWithEmail,
  registerWithEmail,
  signOut,
  getCurrentUser
} from '@/lib/auth';
import type { TranslationKey } from '@/lib/translations';
import type { User as AppUserType } from '@/types';


const OWNER_EMAIL_FOR_SIMULATION = process.env.NEXT_PUBLIC_OWNER_EMAIL;

interface AuthContextType {
  user: AppUserType | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: TranslationKey | string }>;
  register: (email: string, password?: string) => Promise<{ success: boolean; error?: TranslationKey | string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    const existing = getCurrentUser();
    setUser(existing);
    setIsLoading(false);
  }, []);

  const mapAuthCodeToMessage = (code: string): TranslationKey => {
    console.log("AuthContext mapAuthCodeToMessage received code:", code);
    switch (code) {
      case 'auth/invalid-email':
        return 'loginPage.error.invalidEmail' as TranslationKey;
      case 'auth/user-disabled':
        return 'loginPage.error.userDisabled' as TranslationKey;
      case 'auth/user-not-found': 
      case 'auth/invalid-credential': 
        return 'loginPage.error.invalidCredentials' as TranslationKey;
      case 'auth/wrong-password': 
        return 'loginPage.error.wrongPassword' as TranslationKey;
      case 'auth/email-already-in-use':
        return 'loginPage.error.emailInUse' as TranslationKey;
      case 'auth/weak-password':
        return 'loginPage.error.weakPassword' as TranslationKey;
      case 'auth/requires-recent-login':
        return 'loginPage.error.requiresRecentLogin' as TranslationKey;
      case 'auth/network-request-failed':
        return 'loginPage.error.networkError' as TranslationKey;
      case 'auth/api-key-not-valid':
      case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
        return 'loginPage.error.apiKeyInvalid' as TranslationKey;
      default:
        console.warn("AuthContext: Unmapped Firebase error code:", code);
        return 'loginPage.error.generic' as TranslationKey;
    }
  };

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: TranslationKey | string }> => {
    if (!password) {
      return { success: false, error: 'loginPage.error.passwordRequired' as TranslationKey };
    }

    console.log("AuthContext: Attempting login for", email);
    try {
      const result = await signInWithEmail(email, password);
      if (result.success && result.user) {
        setUser(result.user);
        return { success: true };
      }
      return { success: false, error: mapAuthCodeToMessage(result.error || 'auth/invalid-credential') };
    } catch (error: any) {
      console.error("AuthContext: login error:", error);
      return { success: false, error: 'loginPage.error.generic' as TranslationKey };
    }
  };

  const register = async (email: string, password?: string): Promise<{ success: boolean; error?: TranslationKey | string }> => {
    if (!password) {
      return { success: false, error: 'loginPage.error.passwordRequired' as TranslationKey };
    }

    console.log("AuthContext: Attempting registration for", email);
    try {
      const result = await registerWithEmail(email, password);
      if (result.success && result.user) {
        setUser(result.user);
        return { success: true };
      }
      return { success: false, error: mapAuthCodeToMessage(result.error || 'auth/invalid-email') };
    } catch (error: any) {
      console.error("AuthContext: registration error:", error);
      return { success: false, error: 'loginPage.error.generic' as TranslationKey };
    }
  };

  const logout = async () => {
    console.log("AuthContext: Attempting logout.");
    try {
      signOut();
      setUser(null); // Explicitly set user to null
      console.log("AuthContext: signOut successful. User set to null. Redirecting to /login.");
      router.replace('/login'); // Manually redirect after state is set
    } catch (error: any) {
       console.error("AuthContext: logout error:", error);
       setUser(null);
       router.replace('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
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

// Simulating User type from @/types for standalone context logic
// This should be consistent with your actual @/types/index.ts
// interface AppUserType {
//   uid: string;
//   email: string | null;
//   displayName?: string | null; // Keep displayName for Firebase compat
//   name?: string; 
//   role?: 'owner' | 'admin' | 'user';
//   createdAt?: any; // Firestore Timestamp
//   createdBy?: string;
// }

