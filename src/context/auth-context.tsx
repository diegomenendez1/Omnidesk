
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
import type { Locale } from '@/lib/translations'; // Assuming translations.ts exports Locale

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  name?: string; // Added to match usage in AppSidebar
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
    console.log('Firebase App instance in AuthContext:', app);
    console.log('Firebase Auth instance in AuthContext:', auth);

    if (!auth) {
      console.error("Firebase auth instance is not available in AuthContext. Check firebase.ts and its configuration. Authentication will not work.");
      setIsLoading(false); 
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      console.log('Auth state changed, Firebase user:', firebaseUser); 
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email, 
          name: firebaseUser.displayName || firebaseUser.email, // Populate name field
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const mapAuthCodeToMessage = (code: string): string => {
    switch (code) {
      case 'auth/invalid-email':
        return 'loginPage.error.invalidEmail';
      case 'auth/user-disabled':
        return 'loginPage.error.userDisabled';
      case 'auth/user-not-found':
        return 'loginPage.error.userNotFound';
      case 'auth/invalid-credential':
      case 'auth/wrong-password': // Often combined into invalid-credential in newer SDKs
        return 'loginPage.error.invalidCredentials';
      case 'auth/email-already-in-use':
        return 'loginPage.error.emailInUse';
      case 'auth/weak-password':
        return 'loginPage.error.weakPassword';
      case 'auth/requires-recent-login':
        return 'loginPage.error.requiresRecentLogin';
      default:
        console.warn('Unhandled Firebase auth error code:', code);
        return 'loginPage.error.generic';
    }
  };

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    if (!auth) {
      console.error("Firebase auth not available for login in AuthContext.");
      return { success: false, error: 'loginPage.error.generic' };
    }
    if (!password) return { success: false, error: 'loginPage.error.passwordRequired' }; 
    
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setIsLoading(false);
      return { success: true };
    } catch (error: any) {
      setIsLoading(false);
      console.error("Firebase login error:", error.code, error.message);
      return { success: false, error: mapAuthCodeToMessage(error.code) };
    }
  };

  const register = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    if (!auth) {
      console.error("Firebase auth not available for registration in AuthContext.");
      return { success: false, error: 'loginPage.error.generic' };
    }
    if (!password) return { success: false, error: 'loginPage.error.passwordRequired' };
    
    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setIsLoading(false);
      return { success: true };
    } catch (error: any) {
      setIsLoading(false);
      console.error("Firebase registration error:", error.code, error.message);
      return { success: false, error: mapAuthCodeToMessage(error.code) };
    }
  };

  const logout = async () => {
    if (!auth) {
      console.error("Firebase auth not available for logout in AuthContext.");
      setUser(null); 
      router.push('/login');
      return;
    }
    setIsLoading(true); 
    try {
      await signOut(auth);
      // onAuthStateChanged will set user to null, which then triggers redirection in AppContent
    } catch (error: any) {
       console.error("Firebase logout error:", error.code, error.message);
       // Ensure user is cleared and loading is stopped even on error
       setUser(null);
       setIsLoading(false); 
       router.push('/login'); // Explicit redirect as a fallback
    }
    // isLoading will be set to false by onAuthStateChanged
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
