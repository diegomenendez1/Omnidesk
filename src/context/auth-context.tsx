
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
import type { TranslationKey } from '@/lib/translations'; 

// Helper function to get owner email from environment variable or use a default
const getOwnerEmail = (): string => {
  // For client-side, process.env is not directly available like in Node.js for .env files.
  // NEXT_PUBLIC_ variables are inlined at build time.
  let ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL;
  if (!ownerEmail) {
    console.warn("AuthContext: NEXT_PUBLIC_OWNER_EMAIL is not set. Falling back to default 'owner@example.com' for role simulation.");
    ownerEmail = "owner@example.com"; // Default if not set
  }
  return ownerEmail;
};

const OWNER_EMAIL_FOR_SIMULATION = getOwnerEmail();

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  name?: string; 
  role?: 'owner' | 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: TranslationKey | string }>;
  register: (email: string, password?: string) => Promise<{ success: boolean; error?: TranslationKey | string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  console.log("AuthContext: Initializing Provider. isLoading:", isLoading);

  useEffect(() => {
    if (!auth) {
      console.error("AuthContext: Firebase auth instance is NOT available on mount. Authentication will fail.");
      setIsLoading(false); 
      return;
    }
    console.log("AuthContext: Firebase Auth instance IS available. Setting up onAuthStateChanged listener.");
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      console.log('AuthContext: onAuthStateChanged triggered. Firebase user UID:', firebaseUser ? firebaseUser.uid : 'null'); 
      if (firebaseUser) {
        const role: User['role'] = firebaseUser.email === OWNER_EMAIL_FOR_SIMULATION ? 'owner' : 'user';
        const appUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email,
          role: role 
        };
        setUser(appUser);
        console.log('AuthContext: User set in context:', appUser);
      } else {
        setUser(null);
        console.log('AuthContext: User set to null in context.');
      }
      setIsLoading(false);
      console.log('AuthContext: isLoading set to false by onAuthStateChanged.');
    });

    return () => {
      console.log("AuthContext: Unsubscribing from onAuthStateChanged.");
      unsubscribe();
    };
  }, []); // auth instance should be stable, router is stable

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
      case 'auth/api-key-not-valid': // Specific case for invalid API key
      case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.': // Handle variations
        return 'loginPage.error.apiKeyInvalid' as TranslationKey;
      default:
        console.warn("AuthContext: Unmapped Firebase error code:", code);
        return 'loginPage.error.generic' as TranslationKey;
    }
  };

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: TranslationKey | string }> => {
    if (!auth) {
      console.error("AuthContext login: Firebase auth instance is not available.");
      return { success: false, error: 'loginPage.error.generic' as TranslationKey };
    }
    if (!password) { 
      return { success: false, error: 'loginPage.error.passwordRequired' as TranslationKey };
    }
    
    console.log("AuthContext: Attempting login for", email);
    // setIsLoading(true); // isLoading is primarily controlled by onAuthStateChanged
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("AuthContext: signInWithEmailAndPassword call successful for", email, ". Waiting for onAuthStateChanged.");
      return { success: true };
    } catch (error: any) {
      // setIsLoading(false); // Let onAuthStateChanged handle this if auth state truly didn't change
      console.error("AuthContext: Firebase login error:", error.code, error.message, error); // Log the full error object
      return { success: false, error: mapAuthCodeToMessage(error.code) };
    }
  };

  const register = async (email: string, password?: string): Promise<{ success: boolean; error?: TranslationKey | string }> => {
    if (!auth) {
      console.error("AuthContext register: Firebase auth instance is not available.");
      return { success: false, error: 'loginPage.error.generic' as TranslationKey };
    }
    if (!password) { 
      return { success: false, error: 'loginPage.error.passwordRequired' as TranslationKey };
    }
    
    console.log("AuthContext: Attempting registration for", email);
    // setIsLoading(true); // isLoading is primarily controlled by onAuthStateChanged
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      console.log("AuthContext: createUserWithEmailAndPassword call successful for", email, ". Waiting for onAuthStateChanged.");
      return { success: true };
    } catch (error: any) {
      // setIsLoading(false);
      console.error("AuthContext: Firebase registration error:", error.code, error.message, error); // Log the full error object
      return { success: false, error: mapAuthCodeToMessage(error.code) };
    }
  };

  const logout = async () => {
    if (!auth) {
      console.warn("AuthContext logout: Firebase auth instance not available. Forcing local logout.");
      setUser(null); 
      // if(isLoading) setIsLoading(false); // Let onAuthStateChanged handle this
      // Redirection will be handled by AppContent in layout.tsx
      router.replace("/login"); // Explicitly redirect on logout
      return;
    }
    console.log("AuthContext: Attempting logout.");
    try {
      await signOut(auth);
      console.log("AuthContext: signOut successful. User should be null via onAuthStateChanged.");
      // onAuthStateChanged will set user to null. AppContent will redirect.
    } catch (error: any) {
       console.error("AuthContext: Firebase logout error:", error); 
       setUser(null); // Force local state update in case of unexpected Firebase error
       // if(isLoading) setIsLoading(false); // Ensure loading state is false
       router.replace("/login"); // Explicitly redirect on logout error
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
