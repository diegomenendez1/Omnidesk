
'use server';

import { db } from '@/lib/firebase';
import type { User } from '@/types';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';

// Acción para obtener los datos de un usuario específico de Firestore
export async function getUserDataAction(uid: string): Promise<User | null> {
  console.log(`getUserDataAction: Fetching data for UID: ${uid}`);
  if (!uid) {
    console.log('getUserDataAction: No UID provided');
    return null;
  }
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      console.log(`getUserDataAction: Data found for UID ${uid}:`, data);
      // Asegurarse de que createdAt se maneje correctamente (puede ser un objeto Timestamp)
      const userData: User = {
        uid: uid,
        email: data.email,
        name: data.name || data.email, // Fallback si name no está
        role: data.role,
        createdAt: data.createdAt, // Mantener como está, puede ser un Timestamp
        createdBy: data.createdBy,
      };
      return userData;
    } else {
      console.log(`getUserDataAction: No user data found in Firestore for UID: ${uid}`);
      return null;
    }
  } catch (error) {
    console.error('getUserDataAction: Error fetching user data from Firestore:', error);
    // Este log es importante si el error es "Missing or insufficient permissions"
    // Indica que las reglas de Firestore están bloqueando la lectura.
    return null;
  }
}

// Acción para invitar (registrar en Firestore) un nuevo usuario
export async function inviteUserAction(data: {
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'user';
  creatorUid: string;
}): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    // En una app real, aquí verificarías si el 'creatorUid' tiene permisos de 'owner'
    // leyendo su propio rol desde Firestore antes de permitir esta acción.
    // Por ahora, confiamos en que el frontend ya hizo este chequeo para el acceso a la página.

    const newUserDocRef = await addDoc(collection(db, 'users'), {
      email: data.email,
      name: data.name,
      role: data.role,
      createdAt: serverTimestamp(),
      createdBy: data.creatorUid,
    });
    console.log('inviteUserAction: Firestore record created with ID:', newUserDocRef.id);
    return { success: true, userId: newUserDocRef.id };
  } catch (error: any) {
    console.error('inviteUserAction: Error creating Firestore record:', error);
    return { success: false, error: error.message };
  }
}

// Acción para obtener todos los usuarios de Firestore
export async function getUsersAction(): Promise<User[]> {
  try {
    // En una app real, aquí verificarías si el usuario que llama es 'owner'.
    const usersCollectionRef = collection(db, 'users');
    const q = query(usersCollectionRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const users: User[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      users.push({
        uid: docSnap.id, // Usar el ID del documento como UID aquí para la lista
        email: data.email,
        name: data.name || data.email,
        role: data.role,
        createdAt: data.createdAt,
        createdBy: data.createdBy,
      });
    });
    return users;
  } catch (error) {
    console.error('getUsersAction: Error fetching users from Firestore:', error);
    return [];
  }
}

// Acción para eliminar un registro de usuario de Firestore
export async function deleteUserFirestoreRecordAction(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar permisos de owner aquí
    await deleteDoc(doc(db, 'users', userId));
    return { success: true };
  } catch (error: any) {
    console.error('deleteUserFirestoreRecordAction: Error deleting user record:', error);
    return { success: false, error: error.message };
  }
}

// Acción para actualizar el rol de un usuario en Firestore
export async function updateUserRoleAction(userId: string, newRole: 'owner' | 'admin' | 'user'): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar permisos de owner aquí
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      role: newRole,
    });
    return { success: true };
  } catch (error: any) {
    console.error('updateUserRoleAction: Error updating user role:', error);
    return { success: false, error: error.message };
  }
}
