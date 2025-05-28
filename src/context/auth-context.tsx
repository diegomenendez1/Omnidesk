
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

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  name?: string; 
  role?: 'owner' | 'admin' | 'user'; // Added role
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: TranslationKey | string }>;
  register: (email: string, password?: string) => Promise<{ success: boolean; error?: TranslationKey | string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// TEMPORARY: Designate an owner email for simulation
const OWNER_EMAIL_FOR_SIMULATION = "owner@example.com"; // Replace with your actual owner email for testing

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start true, onAuthStateChanged will set to false
  const router = useRouter(); 

  console.log("AuthProvider: Initializing, isLoading:", isLoading);

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
        let role: User['role'] = 'user'; // Default role
        if (firebaseUser.email === OWNER_EMAIL_FOR_SIMULATION) {
          role = 'owner';
        }
        // In a real app, you'd fetch the role from Firestore here:
        // const userDoc = await getDoc(doc(firestore, "users", firebaseUser.uid));
        // if (userDoc.exists()) { role = userDoc.data().role; }

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
      setIsLoading(false); // Auth state resolved, set loading to false
      console.log('AuthContext: isLoading set to false by onAuthStateChanged.');
    });

    return () => {
      console.log("AuthContext: Unsubscribing from onAuthStateChanged.");
      unsubscribe();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // auth dependency removed as it's stable, router not needed here

  const mapAuthCodeToMessage = (code: string): TranslationKey => {
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
        console.warn("AuthContext: Unmapped Firebase error code:", code);
        return 'loginPage.error.generic';
    }
  };

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: TranslationKey | string }> => {
    if (!auth) {
      console.error("AuthContext login: Firebase auth instance is not available.");
      return { success: false, error: 'loginPage.error.generic' };
    }
    if (!password) { 
      return { success: false, error: 'loginPage.error.passwordRequired' };
    }
    
    // Do NOT set AuthContext.isLoading here. LoginPage handles its own submission loading state.
    console.log("AuthContext: Attempting login for", email);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting user and AuthContext.isLoading to false if successful
      console.log("AuthContext: signInWithEmailAndPassword successful for", email);
      return { success: true };
    } catch (error: any) {
      console.error("AuthContext: Firebase login error:", error.code, error.message);
      return { success: false, error: mapAuthCodeToMessage(error.code) };
    }
  };

  const register = async (email: string, password?: string): Promise<{ success: boolean; error?: TranslationKey | string }> => {
    if (!auth) {
      console.error("AuthContext register: Firebase auth instance is not available.");
      return { success: false, error: 'loginPage.error.generic' };
    }
    if (!password) { 
      return { success: false, error: 'loginPage.error.passwordRequired' };
    }
    
    // Do NOT set AuthContext.isLoading here. LoginPage handles its own submission loading state.
    console.log("AuthContext: Attempting registration for", email);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting user and AuthContext.isLoading to false if successful
      console.log("AuthContext: createUserWithEmailAndPassword successful for", email);
      return { success: true };
    } catch (error: any) {
      console.error("AuthContext: Firebase registration error:", error.code, error.message);
      return { success: false, error: mapAuthCodeToMessage(error.code) };
    }
  };

  const logout = async () => {
    if (!auth) {
      console.warn("AuthContext logout: Firebase auth instance not available. Forcing local logout.");
      setUser(null); 
      // AuthContext.isLoading should be handled by onAuthStateChanged eventually setting user to null
      // but for immediate UI update if auth is broken:
      if(isLoading) setIsLoading(false); 
      router.replace("/login"); 
      return;
    }
    console.log("AuthContext: Attempting logout.");
    // Do NOT set AuthContext.isLoading here. Let onAuthStateChanged handle it.
    try {
      await signOut(auth);
      console.log("AuthContext: signOut successful.");
      // onAuthStateChanged will set user to null and isLoading to false
      // router.replace("/login") will be handled by AppContent due to user becoming null
    } catch (error: any) {
       setUser(null); // Ensure user is cleared locally on error
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
