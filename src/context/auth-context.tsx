
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import app, { auth, db } from '@/lib/firebase'; // Import Firebase auth instance
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  type User as FirebaseUser 
} from 'firebase/auth';
import type { TranslationKey } from '@/lib/translations'; 
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

// Helper function to get owner email from environment variable or use a default
const getOwnerEmail = (): string | undefined => {
  // For client-side, process.env is not directly available like in Node.js for .env files.
  // NEXT_PUBLIC_ variables are inlined at build time.
  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL;
  if (!ownerEmail) {
    console.warn("AuthContext: NEXT_PUBLIC_OWNER_EMAIL is not set. Owner role assignment will rely on Firestore or default to 'user'.");
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
  createdAt?: any; // Firestore Timestamp
  createdBy?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: TranslationKey | string }>;
  register: (email: string, password?: string) => Promise<{ success: boolean; error?: TranslationKey | string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Server Action (simulated or to be imported if defined elsewhere)
async function getUserDataAction(uid: string): Promise<User | null> {
  try {
    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      // Ensure createdAt is handled correctly if it's a Firestore Timestamp
      return {
        uid: uid,
        email: data.email,
        name: data.name,
        role: data.role,
        createdAt: data.createdAt, // This might be a Firestore Timestamp object
        createdBy: data.createdBy,
      } as User;
    } else {
      console.log(`AuthContext: No user data found in Firestore for UID: ${uid}`);
      return null;
    }
  } catch (error) {
    console.error("AuthContext: Error fetching user data from Firestore:", error);
    return null;
  }
}


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!auth) {
      console.error("AuthContext: Firebase auth instance is NOT available on mount. Authentication will fail.");
      setIsLoading(false); 
      return;
    }
    console.log("AuthContext: Setting up onAuthStateChanged listener.");
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('AuthContext: onAuthStateChanged triggered. Firebase user UID:', firebaseUser ? firebaseUser.uid : 'null'); 
      if (firebaseUser) {
        let roleToSet: User['role'] = 'user'; // Default role
        let firestoreUserData: Partial<User> = {};

        // 1. Check if this user is the designated owner by email (from .env)
        if (OWNER_EMAIL_FOR_SIMULATION && firebaseUser.email === OWNER_EMAIL_FOR_SIMULATION) {
          console.log(`AuthContext: User ${firebaseUser.email} identified as OWNER based on NEXT_PUBLIC_OWNER_EMAIL.`);
          roleToSet = 'owner';
          // Optionally, ensure owner record exists in Firestore
          const ownerDocRef = doc(db, "users", firebaseUser.uid);
          const ownerDocSnap = await getDoc(ownerDocRef);
          if (!ownerDocSnap.exists()) {
            try {
              await setDoc(ownerDocRef, {
                email: firebaseUser.email,
                role: 'owner',
                name: firebaseUser.displayName || firebaseUser.email,
                createdAt: serverTimestamp(),
                createdBy: firebaseUser.uid, // Owner created themselves
              });
              console.log(`AuthContext: Created Firestore record for initial owner ${firebaseUser.email}`);
            } catch (e) {
              console.error("AuthContext: Error creating Firestore record for initial owner:", e);
            }
          }
        } else {
          // 2. If not the owner by .env email, try to fetch role from Firestore
          const fetchedUserData = await getUserDataAction(firebaseUser.uid);
          if (fetchedUserData && fetchedUserData.role) {
            console.log(`AuthContext: User ${firebaseUser.email} role '${fetchedUserData.role}' fetched from Firestore.`);
            roleToSet = fetchedUserData.role;
            firestoreUserData = fetchedUserData;
          } else {
            console.log(`AuthContext: User ${firebaseUser.email} has no specific role in Firestore or data fetch failed, defaulting to 'user'.`);
            // If user exists in Auth but not in Firestore users collection (e.g. first login after manual creation, or if user doc was deleted)
            // We might want to create a default user document here for them.
            // For now, they just get 'user' role in the context.
          }
        }
        
        const appUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email,
          role: roleToSet,
          createdAt: firestoreUserData.createdAt,
          createdBy: firestoreUserData.createdBy,
        };
        console.log('AuthContext: User object set in context:', appUser);
        setUser(appUser);

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
  }, []); // `auth` instance is stable

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
    if (!auth) {
      console.error("AuthContext login: Firebase auth instance is not available.");
      return { success: false, error: 'loginPage.error.generic' as TranslationKey };
    }
    if (!password) { 
      return { success: false, error: 'loginPage.error.passwordRequired' as TranslationKey };
    }
    
    console.log("AuthContext: Attempting login for", email);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("AuthContext: signInWithEmailAndPassword call successful for", email, ". Waiting for onAuthStateChanged.");
      //isLoading and user state will be updated by onAuthStateChanged
      return { success: true };
    } catch (error: any) {
      console.error("AuthContext: Firebase login error:", error.code, error.message, error); 
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("AuthContext: createUserWithEmailAndPassword call successful for", email, ". Waiting for onAuthStateChanged.");
      
      // After successful Firebase Auth registration, create user document in Firestore
      // For a new registration, assign 'user' role by default unless it's the owner email
      const newFirebaseUser = userCredential.user;
      let roleForNewUser: User['role'] = 'user';
      if (OWNER_EMAIL_FOR_SIMULATION && newFirebaseUser.email === OWNER_EMAIL_FOR_SIMULATION) {
        roleForNewUser = 'owner';
      }

      try {
        await setDoc(doc(db, "users", newFirebaseUser.uid), {
          email: newFirebaseUser.email,
          role: roleForNewUser,
          name: newFirebaseUser.displayName || newFirebaseUser.email,
          createdAt: serverTimestamp(),
          createdBy: newFirebaseUser.uid, // User created themselves or was created by system if owner logic
        });
        console.log(`AuthContext: Firestore record created for new user ${newFirebaseUser.email} with role ${roleForNewUser}`);
      } catch (firestoreError) {
        console.error("AuthContext: Error creating Firestore record during registration:", firestoreError);
        // Decide if this should fail the whole registration or just log. For now, log.
      }
      
      return { success: true };
    } catch (error: any) {
      console.error("AuthContext: Firebase registration error:", error.code, error.message, error); 
      return { success: false, error: mapAuthCodeToMessage(error.code) };
    }
  };

  const logout = async () => {
    if (!auth) {
      console.warn("AuthContext logout: Firebase auth instance not available. Forcing local logout.");
      setUser(null); 
      // Redirection will be handled by AppContent in layout.tsx
      return;
    }
    console.log("AuthContext: Attempting logout.");
    try {
      await signOut(auth);
      console.log("AuthContext: signOut successful. User should be null via onAuthStateChanged.");
    } catch (error: any) {
       console.error("AuthContext: Firebase logout error:", error); 
       setUser(null); 
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
