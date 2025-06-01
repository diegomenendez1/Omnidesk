
'use server';

import type { Task } from '@/types';
import { addOrUpdateTasksInFirestoreAction } from '@/app/tasks/actions';


export async function migrateTasksToFirestoreAction(
  tasksFromLocalStorage: Task[],
  userId: string,
  userName: string // Assuming userName is available or can be fetched
): Promise<{ success: boolean; migratedCount: number; error?: string }> {
  
  const result = await addOrUpdateTasksInFirestoreAction(tasksFromLocalStorage, userId, userName, 'migration');

  return {
    success: result.success,
    migratedCount: result.processedCount, // In migration, all processed are considered "migrated"
    error: result.error,
  };
}
