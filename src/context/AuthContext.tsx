"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Importaciones de Firebase (compatibles con Firebase v11.8.1)
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// Tipos de Firebase
type FirebaseUser = firebase.User;
type UserCredential = firebase.auth.UserCredential;
type DocumentData = firebase.firestore.DocumentData;
type DocumentReference = firebase.firestore.DocumentReference;
type DocumentSnapshot = firebase.firestore.DocumentSnapshot;
type QueryDocumentSnapshot = firebase.firestore.QueryDocumentSnapshot;

// Alias para funciones de Firestore
const { serverTimestamp } = firebase.firestore.FieldValue;

// Inicialización de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializar Firebase solo una vez
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Obtener instancias de auth y firestore
const auth = firebase.auth();
const db = firebase.firestore();

// Constante para simular el correo del propietario
const OWNER_EMAIL_FOR_SIMULATION = process.env.NEXT_PUBLIC_OWNER_EMAIL;

// Tipo simplificado para el usuario en el contexto de autenticación
type AuthUser = {
  uid: string;
  email: string | null;
  name?: string | null;
  role?: 'owner' | 'admin' | 'user';
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
} | null;

// Contexto de autenticación
interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const router = useRouter();
  
  useEffect(() => {
    if (!auth) {
      console.error("AuthContext: Firebase auth instance is NOT available on mount. Authentication will fail.");
      setIsLoading(false); 
      return;
    }
    
    console.log("AuthContext: Setting up onAuthStateChanged listener.");
    
    const handleAuthStateChanged = async (firebaseUser: FirebaseUser | null) => {
      console.log('AuthContext: onAuthStateChanged triggered. Firebase user UID:', firebaseUser ? firebaseUser.uid : 'null');
      
      if (!firebaseUser) {
        console.log('AuthContext: No user is signed in.');
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      try {
        // 1. Determine user role (default to 'user' unless owner)
        let role: 'user' | 'admin' | 'owner' = 'user';
        if (OWNER_EMAIL_FOR_SIMULATION && firebaseUser.email === OWNER_EMAIL_FOR_SIMULATION) {
          console.log(`AuthContext: User ${firebaseUser.email} identified as OWNER.`);
          role = 'owner';
        }
        
        // 2. Get or create user document in Firestore
        const userDocRef = db.collection('users').doc(firebaseUser.uid);
        const userDoc = await userDocRef.get();
        
        let userData: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          role,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        if (userDoc.exists) {
          // Update existing user data with Firestore data
          const firestoreData = userDoc.data();
          if (firestoreData) {
            userData = {
              ...userData,
              ...firestoreData,
              // Ensure required fields are not overridden
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              // Convert Firestore Timestamps to ISO strings
              createdAt: firestoreData.createdAt?.toDate?.()?.toISOString() || userData.createdAt,
              updatedAt: firestoreData.updatedAt?.toDate?.()?.toISOString() || userData.updatedAt
            };
            console.log(`AuthContext: Loaded user data from Firestore for UID ${firebaseUser.uid}`);
          }
        } else {
          // Create new user document
          console.log(`AuthContext: Creating new user document for UID ${firebaseUser.uid}`);
          await userDocRef.set({
            ...userData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
        
        console.log('AuthContext: Setting user state with data:', userData);
        setUser(userData);
      } catch (error) {
        console.error('AuthContext: Error processing user data:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Usar la API de Firebase v8 para el listener de autenticación
    const unsubscribe = auth.onAuthStateChanged(handleAuthStateChanged);
    
    return () => {
      console.log("AuthContext: Unsubscribing from onAuthStateChanged.");
      unsubscribe();
    };
  }, []); 

  // Mapea códigos de error de Firebase a mensajes de error legibles
  const mapAuthCodeToMessage = (code: string): string => {
    console.log("AuthContext mapAuthCodeToMessage received code:", code);
    switch (code) {
      case 'auth/invalid-email':
        return 'loginPage.error.invalidEmail';
      case 'auth/user-disabled':
        return 'loginPage.error.userDisabled';
      case 'auth/user-not-found': 
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return 'loginPage.error.invalidCredentials';
      case 'auth/email-already-in-use':
        return 'loginPage.error.emailInUse';
      case 'auth/weak-password':
        return 'loginPage.error.weakPassword';
      case 'auth/too-many-requests':
        return 'loginPage.error.tooManyRequests';
      case 'auth/operation-not-allowed':
        return 'loginPage.error.operationNotAllowed';
      case 'auth/requires-recent-login':
        return 'loginPage.error.requiresRecentLogin';
      case 'auth/network-request-failed':
        return 'loginPage.error.networkError';
      case 'auth/api-key-not-valid':
      case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
        return 'loginPage.error.apiKeyInvalid';
      default:
        console.warn('AuthContext: Unmapped auth code:', code);
        return 'loginPage.error.generic';
    }
  };

  const login = async (email: string, password: string = 'dummy-password'): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      console.log(`AuthContext: Attempting to log in with email: ${email}`);
      
      // For demo purposes, bypass actual Firebase auth if password is the dummy value
      if (password === 'dummy-password') {
        console.log('AuthContext: Using demo login flow');
        try {
          // Usar la API de Firebase v8 para iniciar sesión
          await auth.signInWithEmailAndPassword(email, 'dummy-password');
          console.log('AuthContext: Demo login successful');
          return { success: true };
        } catch (error: any) {
          console.error('AuthContext: Error signing in:', error);
          // Si el usuario no existe, intentar registrarlo primero
          if (error.code === 'auth/user-not-found') {
            console.log('AuthContext: User not found, attempting to register...');
            const registerResult = await register(email, password);
            if (!registerResult.success) {
              return { success: false, error: registerResult.error };
            }
            return { success: true };
          }
          throw error;
        }
      } else {
        // Actual Firebase auth
        console.log('AuthContext: Using real Firebase auth');
        await auth.signInWithEmailAndPassword(email, password);
        console.log('AuthContext: Firebase login successful');
        return { success: true };
      }
    } catch (error: any) {
      console.error('AuthContext: Login error:', error);
      const errorCode = error.code || 'auth/login-failed';
      const errorMessage = mapAuthCodeToMessage(errorCode);
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string = 'dummy-password'): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      console.log(`AuthContext: Attempting to register user with email: ${email}`);
      
      // For demo purposes, bypass actual Firebase auth if password is the dummy value
      if (password === 'dummy-password') {
        console.log('AuthContext: Using demo registration flow');
        // Simulate successful registration
        return { success: true };
      }
      
      // Actual Firebase auth
      console.log('AuthContext: Using real Firebase auth');
      await auth.createUserWithEmailAndPassword(email, password);
      console.log("AuthContext: createUserWithEmailAndPassword call successful for", email, ". Waiting for onAuthStateChanged.");
      
      // No necesitamos hacer nada más aquí, ya que onAuthStateChanged manejará la actualización del estado
      console.log('AuthContext: Registration successful, waiting for onAuthStateChanged to update user state');
      
      return { success: true };
    } catch (error: any) {
      console.error('AuthContext: Registration error:', error);
      const errorCode = error.code || 'auth/registration-failed';
      const errorMessage = mapAuthCodeToMessage(errorCode);
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<{ success: boolean; error?: string }> => {
    if (!auth) {
      const errorMsg = "AuthContext logout: Firebase auth instance is not available.";
      console.error(errorMsg);
      router.replace('/login');
      return { success: false, error: 'auth/not-initialized' };
    }
    
    console.log("AuthContext: Signing out...");
    try {
      // Usar la API de Firebase v8 para cerrar sesión
      await auth.signOut();
      console.log("AuthContext: Sign out successful");
      // Redirigir al login después de cerrar sesión
      router.replace('/login');
      return { success: true };
    } catch (error: any) {
      console.error("AuthContext: Error signing out:", error);
      const errorCode = error.code || 'auth/logout-failed';
      const errorMessage = mapAuthCodeToMessage(errorCode);
      // Asegurarse de redirigir incluso si hay un error
      router.replace('/login');
      return { success: false, error: errorMessage };
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

// Usamos el tipo User de @/types/index.ts 