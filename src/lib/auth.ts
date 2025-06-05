import { v4 as uuidv4 } from 'uuid';
import { db, collection, doc, getDoc, setDoc, getDocs, query } from './firebase';
import type { User } from '@/types';

let currentUser: User | null = null;

type AuthResult = { success: boolean; user?: User; error?: string };

export async function registerWithEmail(email: string, password: string): Promise<AuthResult> {
  const usersCol = collection(db as any, 'users');
  const snap = await getDocs(usersCol);
  const existing = snap.docs.find(d => d.data().email === email);
  if (existing) {
    return { success: false, error: 'auth/email-already-in-use' };
  }
  const newUser: User & { password: string } = { uid: uuidv4(), email, role: 'user', name: email, createdAt: new Date().toISOString(), createdBy: uuidv4(), password };
  await setDoc(doc(db as any, 'users', newUser.uid), newUser);
  currentUser = newUser;
  return { success: true, user: newUser };
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const usersCol = collection(db as any, 'users');
  const snap = await getDocs(usersCol);
  const userDoc = snap.docs.find(d => d.data().email === email && d.data().password === password);
  if (!userDoc) {
    return { success: false, error: 'auth/invalid-credential' };
  }
  const data = userDoc.data();
  currentUser = data;
  return { success: true, user: data };
}

export function signOut(): void {
  currentUser = null;
}

export function onAuthStateChanged(callback: (user: User | null) => void): () => void {
  callback(currentUser);
  return () => {};
}

export function getCurrentUser(): User | null {
  return currentUser;
}

