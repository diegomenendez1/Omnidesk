
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
import type { Locale } from '@/lib/translations'; // Assuming Locale is defined here

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  name?: string; // Added name for consistency with sidebar
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
  // useRouter hook removed from here to avoid calling it if AuthProvider is used in a non-route component
  // Redirection logic is better handled in components that consume the context (like AppContent)

  useEffect(() => {
    if (!auth) {
      console.error("Firebase auth instance is not available in AuthContext. Authentication will not work.");
      setIsLoading(false); 
      return;
    }
    // console.log("AuthContext: Subscribing to onAuthStateChanged");

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      // console.log('AuthContext: onAuthStateChanged triggered. Firebase user:', firebaseUser); 
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email, // Use email as fallback for displayName
          name: firebaseUser.displayName || firebaseUser.email, // Also set name for sidebar consistency
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
      // case 'auth/wrong-password': // Often covered by invalid-credential
      //   return 'loginPage.error.wrongPassword';
      case 'auth/email-already-in-use':
        return 'loginPage.error.emailInUse';
      case 'auth/weak-password':
        return 'loginPage.error.weakPassword';
      case 'auth/requires-recent-login':
        return 'loginPage.error.requiresRecentLogin';
      default:
        // console.warn(`AuthContext: Unmapped Firebase error code: ${code}`);
        return 'loginPage.error.generic';
    }
  };

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    if (!auth) {
      return { success: false, error: 'loginPage.error.generic' };
    }
    if (!password) return { success: false, error: 'loginPage.error.passwordRequired' }; 
    
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // console.log('AuthContext: Firebase signInWithEmailAndPassword successful:', userCredential);
      // Let onAuthStateChanged handle setting user and isLoading to false
      return { success: true };
    } catch (error: any) {
      setIsLoading(false); // Set isLoading to false ONLY on error
      // console.error("Firebase login error (AuthContext):", error.code, error.message); 
      return { success: false, error: mapAuthCodeToMessage(error.code) };
    }
  };

  const register = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    if (!auth) {
      return { success: false, error: 'loginPage.error.generic' };
    }
    if (!password) return { success: false, error: 'loginPage.error.passwordRequired' };
    
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // console.log('AuthContext: Firebase createUserWithEmailAndPassword successful:', userCredential);
      // Let onAuthStateChanged handle setting user and isLoading to false
      return { success: true };
    } catch (error: any) {
      setIsLoading(false); // Set isLoading to false ONLY on error
      // console.error("Firebase registration error (AuthContext):", error.code, error.message); 
      return { success: false, error: mapAuthCodeToMessage(error.code) };
    }
  };

  const logout = async () => {
    if (!auth) {
      setUser(null); // Clear user state immediately if auth is not available
      setIsLoading(false);
      return;
    }
    setIsLoading(true); // Indicate loading state during logout process
    try {
      await signOut(auth);
      // console.log('AuthContext: Firebase signOut successful.');
      // onAuthStateChanged will set user to null and isLoading to false
    } catch (error: any) {
       // In case signOut itself fails, ensure user is cleared and loading stops
       setUser(null);
       setIsLoading(false); 
       console.error("AuthContext: Firebase logout error:", error);
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
