
'use server';

import { db } from '@/lib/firebase';
import type { Task } from '@/types';
import { collection, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export async function migrateTasksToFirestoreAction(
  tasks: Task[],
  userId: string
): Promise<{ success: boolean; migratedCount: number; error?: string }> {
  if (!tasks || tasks.length === 0) {
    return { success: true, migratedCount: 0 };
  }

  const batch = writeBatch(db);
  const tasksCollectionRef = collection(db, 'tasks');
  let migratedCount = 0;

  for (const task of tasks) {
    // Ensure task has an id, generate if not present or use taskReference if id is missing
    // Firestore document ID should ideally be stable and unique.
    let docId = task.id;
    if (!docId) {
        if (task.taskReference) {
            // Potentially sanitize taskReference to be a valid Firestore ID
            // For simplicity, we'll use it directly if it's reasonably clean or generate a UUID
            docId = `ref_${task.taskReference.replace(/[\/\.#\$\[\]]/g, '_')}`; // Basic sanitization
        } else {
            docId = uuidv4(); // Fallback to UUID if no id and no taskReference
        }
    }
    
    // If task.id was undefined, assign the new docId to the task object to be saved
    const taskToSave: Task = { ...task, id: docId }; 

    // Add user and timestamp for this migration event in history, if history exists
    const migrationChangeDetails = [
      {
        field: 'migration',
        fieldLabel: 'Data Migration', // This should ideally be a translation key
        oldValue: 'localStorage',
        newValue: 'Firestore',
      },
    ];

    const newHistoryEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      userId: userId, // User performing the migration
      userName: 'Migration Process', // Or fetch user's actual name/email if available
      changes: migrationChangeDetails,
    };

    taskToSave.history = [...(taskToSave.history || []), newHistoryEntry];
    
    // Ensure createdAt is set if not already
    if (!taskToSave.createdAt) {
        taskToSave.createdAt = new Date().toISOString(); // Default to now if not set
    }

    const taskDocRef = doc(tasksCollectionRef, docId);
    batch.set(taskDocRef, taskToSave, { merge: true }); // Use merge:true to update if exists, create if not
    migratedCount++;
  }

  try {
    await batch.commit();
    return { success: true, migratedCount };
  } catch (error: any) {
    console.error('Error migrating tasks to Firestore:', error);
    return { success: false, migratedCount: 0, error: error.message || 'Unknown Firestore error' };
  }
}
    
    