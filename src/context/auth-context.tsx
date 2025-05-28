
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import app, { auth } from '@/lib/firebase'; // Corrected import
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  type User as FirebaseUser 
} from 'firebase/auth';
import type { Locale } from '@/lib/translations'; 

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  name?: string; 
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string | Locale | any }>;
  register: (email: string, password?: string) => Promise<{ success: boolean; error?: string | Locale | any }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter(); 

  useEffect(() => {
    if (!auth) {
      // console.warn("AuthContext: Firebase auth instance is not available on mount. Authentication will not work.");
      setIsLoading(false); 
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      // console.log('AuthContext: onAuthStateChanged triggered. Firebase user:', firebaseUser ? firebaseUser.uid : 'null'); 
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email, 
          name: firebaseUser.displayName || firebaseUser.email, 
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      // console.log("AuthContext: Unsubscribing from onAuthStateChanged");
      unsubscribe();
    }
  }, []);

  const mapAuthCodeToMessage = (code: string): string => {
    switch (code) {
      case 'auth/invalid-email':
        return 'loginPage.error.invalidEmail';
      case 'auth/user-disabled':
        return 'loginPage.error.userDisabled';
      case 'auth/user-not-found': // Firebase v9+ often returns invalid-credential for this
      case 'auth/invalid-credential':
        return 'loginPage.error.invalidCredentials';
      case 'auth/email-already-in-use':
        return 'loginPage.error.emailInUse';
      case 'auth/weak-password':
        return 'loginPage.error.weakPassword';
      case 'auth/requires-recent-login':
        return 'loginPage.error.requiresRecentLogin';
      default:
        return 'loginPage.error.generic';
    }
  };

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    if (!auth) {
      return { success: false, error: 'loginPage.error.generic' };
    }
    if (!password) { 
      return { success: false, error: 'loginPage.error.passwordRequired' };
    }
    
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting user and isLoading to false if successful
      return { success: true };
    } catch (error: any) {
      setIsLoading(false); 
      return { success: false, error: mapAuthCodeToMessage(error.code) };
    }
  };

  const register = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    if (!auth) {
      return { success: false, error: 'loginPage.error.generic' };
    }
    if (!password) { 
      return { success: false, error: 'loginPage.error.passwordRequired' };
    }
    
    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting user and isLoading to false if successful
      return { success: true };
    } catch (error: any) {
      setIsLoading(false); 
      return { success: false, error: mapAuthCodeToMessage(error.code) };
    }
  };

  const logout = async () => {
    if (!auth) {
      setUser(null); 
      setIsLoading(false);
      router.replace("/login"); // Ensure redirection even if auth instance was problematic
      return;
    }
    setIsLoading(true); 
    try {
      await signOut(auth);
      // onAuthStateChanged will set user to null and isLoading to false
      // router.replace("/login") will be handled by AppContent due to user becoming null
    } catch (error: any) {
       setUser(null);
       setIsLoading(false); 
       console.error("AuthContext: Firebase logout error:", error);
       router.replace("/login"); // Fallback redirection
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
