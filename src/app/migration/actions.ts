
'use server';

import type { Task } from '@/types';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';


export async function migrateLocalTasksToFirestore(
  tasksToMigrate: Task[]
): Promise<{ success: boolean; migratedCount: number; error?: string }> {
 try {
    if (!tasksToMigrate || tasksToMigrate.length === 0) {
 return { success: true, migratedCount: 0 };
    }

    const tasksCollection = collection(db, 'tasks');
    let migratedCount = 0;

    for (const task of tasksToMigrate) {
      // Basic mapping - adjust as needed based on your Task type and Firestore schema
      await addDoc(tasksCollection, { ...task });
      migratedCount++;
    }

    if (!keepLocalCopy) {
      // Clear localStorage - This part also needs to be handled on the client side
 return { success: false, migratedCount: 0, error: error.message };
 }
}
