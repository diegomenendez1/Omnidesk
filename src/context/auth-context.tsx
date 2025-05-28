
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
import { doc, getDoc, serverTimestamp, setDoc, collection, getDocs } from 'firebase/firestore';
import type { User as AppUserType } from '@/types'; // Renamed to avoid conflict
import { getUserDataAction } from '@/app/admin/users/actions'; // Import server action


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
    if (!auth) {
      console.error("AuthContext: Firebase auth instance is NOT available on mount. Authentication will fail.");
      setIsLoading(false); 
      return;
    }
    console.log("AuthContext: Setting up onAuthStateChanged listener.");
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('AuthContext: onAuthStateChanged triggered. Firebase user UID:', firebaseUser ? firebaseUser.uid : 'null'); 
      if (firebaseUser) {
        let roleToSet: AppUserType['role'] = 'user'; // Default role
        let firestoreUserData: Partial<AppUserType> = {};

        // 1. Check if this user is the designated owner by email (from .env)
        if (OWNER_EMAIL_FOR_SIMULATION && firebaseUser.email === OWNER_EMAIL_FOR_SIMULATION) {
          console.log(`AuthContext: User ${firebaseUser.email} identified as OWNER based on NEXT_PUBLIC_OWNER_EMAIL.`);
          roleToSet = 'owner';
          // Ensure owner record exists in Firestore and has the correct role
          const ownerDocRef = doc(db, "users", firebaseUser.uid);
          try {
            await setDoc(ownerDocRef, {
              email: firebaseUser.email,
              role: 'owner',
              name: firebaseUser.displayName || firebaseUser.email,
              createdAt: serverTimestamp(), // Will only set on creation
              createdBy: firebaseUser.uid, // Owner created themselves
            }, { merge: true }); // Use merge to update if exists, or create if not
            console.log(`AuthContext: Ensured Firestore record for owner ${firebaseUser.email} with role 'owner'.`);
            firestoreUserData.role = 'owner'; // Reflect this immediately
          } catch (e) {
            console.error("AuthContext: Error ensuring Firestore record for initial owner:", e);
          }
        }
        
        // 2. Fetch role and other data from Firestore if not already set by owner logic
        if (!firestoreUserData.role) { // Only fetch if role wasn't set by owner logic above
            const fetchedUserData = await getUserDataAction(firebaseUser.uid);
            if (fetchedUserData) {
                firestoreUserData = fetchedUserData; // Get all data including name, createdBy etc.
                if (fetchedUserData.role) {
                    console.log(`AuthContext: User ${firebaseUser.email} role '${fetchedUserData.role}' fetched from Firestore.`);
                    roleToSet = fetchedUserData.role;
                } else {
                    console.log(`AuthContext: User ${firebaseUser.email} found in Firestore but has no role field. Defaulting to 'user'.`);
                }
            } else {
                console.log(`AuthContext: No user data found in Firestore for UID: ${firebaseUser.uid}. Role will default to 'user' unless owner.`);
                 // If not the owner and no Firestore record, create one with default 'user' role during their first actual login via onAuthStateChanged
                if (roleToSet === 'user') { // Only if not already determined as owner
                    try {
                        await setDoc(doc(db, "users", firebaseUser.uid), {
                            email: firebaseUser.email,
                            role: 'user',
                            name: firebaseUser.displayName || firebaseUser.email,
                            createdAt: serverTimestamp(),
                            createdBy: firebaseUser.uid, // Self-created or system
                        }, { merge: true });
                        console.log(`AuthContext: Created default Firestore record for user ${firebaseUser.email} with role 'user'.`);
                    } catch (e) {
                        console.error("AuthContext: Error creating default Firestore record for user:", e);
                    }
                }
            }
        }
        
        const appUser: AppUserType = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firestoreUserData.name || firebaseUser.displayName || firebaseUser.email, // Prioritize Firestore name
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
      console.error("AuthContext: Firebase login error:", error.code, error.message); 
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
      
      const newFirebaseUser = userCredential.user;
      let roleForNewUser: AppUserType['role'] = 'user';
      if (OWNER_EMAIL_FOR_SIMULATION && newFirebaseUser.email === OWNER_EMAIL_FOR_SIMULATION) {
        roleForNewUser = 'owner';
      }

      try {
        await setDoc(doc(db, "users", newFirebaseUser.uid), {
          email: newFirebaseUser.email,
          role: roleForNewUser,
          name: newFirebaseUser.displayName || newFirebaseUser.email,
          createdAt: serverTimestamp(),
          createdBy: newFirebaseUser.uid, 
        });
        console.log(`AuthContext: Firestore record created for new user ${newFirebaseUser.email} with role ${roleForNewUser}`);
      } catch (firestoreError) {
        console.error("AuthContext: Error creating Firestore record during registration:", firestoreError);
      }
      
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
      router.replace('/login');
      return;
    }
    console.log("AuthContext: Attempting logout.");
    try {
      await signOut(auth);
      setUser(null); // Explicitly set user to null
      console.log("AuthContext: signOut successful. User set to null. Redirecting to /login.");
      router.replace('/login'); // Manually redirect after state is set
    } catch (error: any) {
       console.error("AuthContext: Firebase logout error:", error); 
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

    