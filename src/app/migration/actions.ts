'use server';

import type { Task } from '@/types';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export async function migrateLocalTasksToFirestore(
  tasksToMigrate: Task[],
  keepLocalCopy = true
): Promise<{ success: boolean; migratedCount: number; error?: string }> {
  try {
    if (!tasksToMigrate || tasksToMigrate.length === 0) {
      return { success: true, migratedCount: 0 };
    }

    const tasksCollection = collection(db, 'tasks');
    let migratedCount = 0;
    for (const task of tasksToMigrate) {
      await addDoc(tasksCollection, { ...task });
      migratedCount++;
    }

    if (!keepLocalCopy) {
      // In a real environment, clearing local storage would occur client side.
    }

    return { success: true, migratedCount };
  } catch (error: any) {
    return { success: false, migratedCount: 0, error: error.message };
  }
}
