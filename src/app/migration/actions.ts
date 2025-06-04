'use server';

import type { Task } from '@/types';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export async function migrateLocalTasksToFirestore(
  tasksToMigrate: Task[],

  keepLocalCopy: boolean
): Promise<{ success: boolean; migratedCount: number; error?: string }> {
  if (!tasksToMigrate || tasksToMigrate.length === 0) {
    return { success: true, migratedCount: 0 };
  }

  const tasksCollection = collection(db, 'tasks');
  let migratedCount = 0;

  try {

    for (const task of tasksToMigrate) {
      await addDoc(tasksCollection, { ...task });
      migratedCount++;
    }
    // keepLocalCopy flag will be acted upon in the client after success
    return { success: true, migratedCount };
  } catch (error: any) {
    console.error('migrateLocalTasksToFirestore: Error migrating tasks:', error);
    return { success: false, migratedCount, error: error.message };
  }
}


export async function migrateTasksToFirestoreAction(
  tasksToMigrate: Task[],
  userId: string,
  keepLocalCopy = true
): Promise<{ success: boolean; migratedCount: number; error?: string }> {
  console.log(
    `migrateTasksToFirestoreAction: user ${userId} migrating ${tasksToMigrate.length} tasks.`
  );
  return migrateLocalTasksToFirestore(tasksToMigrate, keepLocalCopy);
}
