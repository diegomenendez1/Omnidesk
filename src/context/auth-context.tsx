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
import type { Locale, TranslationKey } from '@/lib/translations'; 

// Helper function to get owner email from environment variable or use a default
const getOwnerEmail = (): string => {
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

  console.log("AuthContext: Initializing. isLoading:", isLoading, "User:", user);

  useEffect(() => {
    if (!auth) {
      console.warn("AuthContext: Firebase auth instance is not available on mount. Authentication will not work.");
      setIsLoading(false); 
      return;
    }
    console.log("AuthContext: Setting up onAuthStateChanged listener.");
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      console.log('AuthContext: onAuthStateChanged triggered. Firebase user UID:', firebaseUser ? firebaseUser.uid : 'null'); 
      if (firebaseUser) {
        // Simulate role fetching - REPLACE THIS WITH ACTUAL FIRESTORE CALL
        // For now, assign 'owner' role if email matches OWNER_EMAIL_FOR_SIMULATION, else 'user'
        // In a real app, you'd fetch the role from Firestore here:
        // const userDoc = await getDoc(doc(firestore, "users", firebaseUser.uid));
        // if (userDoc.exists()) { role = userDoc.data().role; }
        const role: User['role'] = firebaseUser.email === OWNER_EMAIL_FOR_SIMULATION ? 'owner' : 'user';

        const appUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email, // Use email as fallback for displayName
          name: firebaseUser.displayName || firebaseUser.email, // Similarly for name
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // `auth` instance is stable, so it doesn't need to be in dependency array

  const mapAuthCodeToMessage = (code: string): TranslationKey => {
    switch (code) {
      case 'auth/invalid-email':
        return 'loginPage.error.invalidEmail' as TranslationKey;
      case 'auth/user-disabled':
        return 'loginPage.error.userDisabled' as TranslationKey;
      case 'auth/user-not-found':
      case 'auth/invalid-credential': // Firebase v9+ uses this for both user-not-found and wrong-password
        return 'loginPage.error.invalidCredentials' as TranslationKey;
      case 'auth/wrong-password': // Kept for clarity, though invalid-credential is more common now
        return 'loginPage.error.wrongPassword' as TranslationKey;
      case 'auth/email-already-in-use':
        return 'loginPage.error.emailInUse' as TranslationKey;
      case 'auth/weak-password':
        return 'loginPage.error.weakPassword' as TranslationKey;
      case 'auth/requires-recent-login':
        return 'loginPage.error.requiresRecentLogin' as TranslationKey;
      case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.': // Specific for this error
      case 'auth/network-request-failed':
        return 'loginPage.error.networkError' as TranslationKey;
      default:
        console.warn("AuthContext: Unmapped Firebase error code:", code);
        return 'loginPage.error.generic' as TranslationKey;
    }
  };

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: TranslationKey | string }> => {
    if (!auth) {
      // This console.error is important for developers to see if auth isn't initialized.
      console.error("AuthContext login: Firebase auth instance is not available.");
      return { success: false, error: 'loginPage.error.generic' as TranslationKey };
    }
    if (!password) { 
      return { success: false, error: 'loginPage.error.passwordRequired' as TranslationKey };
    }
    
    console.log("AuthContext: Attempting login for", email);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting user and isLoading to false if successful
      console.log("AuthContext: signInWithEmailAndPassword call successful for", email, ". Waiting for onAuthStateChanged.");
      return { success: true };
    } catch (error: any) {
      // Removed console.error for Firebase login error, user message is handled by UI
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
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      console.log("AuthContext: createUserWithEmailAndPassword call successful for", email, ". Waiting for onAuthStateChanged.");
      return { success: true };
    } catch (error: any) {
      // Removed console.error for Firebase registration error, user message is handled by UI
      return { success: false, error: mapAuthCodeToMessage(error.code) };
    }
  };

  const logout = async () => {
    if (!auth) {
      console.warn("AuthContext logout: Firebase auth instance not available. Forcing local logout.");
      setUser(null); 
      if(isLoading) setIsLoading(false); 
      router.replace("/login"); 
      return;
    }
    console.log("AuthContext: Attempting logout.");
    try {
      await signOut(auth);
      console.log("AuthContext: signOut successful. User should be null via onAuthStateChanged.");
      // onAuthStateChanged will set user to null. AppContent will redirect.
    } catch (error: any) {
       console.error("AuthContext: Firebase logout error:", error); // Keep this log as it's unexpected
       setUser(null); 
       if(isLoading) setIsLoading(false); 
       router.replace("/login"); 
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
