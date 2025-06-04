
'use server';

import { suggestCsvMappings } from '@/ai/flows/suggest-csv-mapping-flow';
import { db } from '@/lib/firebase';
import { logTaskHistory } from '@/lib/firestore';
import type { Task } from '@/types/task';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  limit,
  getDocs,
} from 'firebase/firestore';
import { getCurrentUser } from '@/lib/auth';
import type { SuggestCsvMappingInput, SuggestCsvMappingOutput, SystemColumnDefinition } from '@/ai/flows/suggest-csv-mapping-flow';

// Re-exporting types for client-side usage if needed
export type { SuggestCsvMappingOutput };
export type SystemColumn = SystemColumnDefinition; // For easier import on client

export async function getMappingSuggestions(
  csvHeaders: string[],
  systemColumns: SystemColumnDefinition[]
): Promise<SuggestCsvMappingOutput> {
  try {
    const input: SuggestCsvMappingInput = { csvHeaders, systemColumns };
    const result = await suggestCsvMappings(input);
    return result;
  } catch (error) {
    console.error("Error getting mapping suggestions:", error);
    // Fallback: suggest no mappings
    return {
      suggestedMappings: csvHeaders.map(header => ({
        csvColumn: header,
        systemColumn: null,
        confidence: 0,
      })),
      unmappedCsvColumns: csvHeaders,
    };
  }
}

export async function processCsvData(data: any[], mappedColumns: Record<string, string>): Promise<{ success: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: 'User not authenticated.' };
  }

  const userId = user.uid;
  const tasksCollection = collection(db, 'tasks');

  try {
    for (const row of data) {
      const taskData: Partial<Task> = {};
      let taskId: string | undefined;

      // Map CSV data to task fields
      for (const csvHeader in mappedColumns) {
        const systemColumn = mappedColumns[csvHeader];
        if (systemColumn && row[csvHeader] !== undefined) {
          // Assuming systemColumn names match Task interface keys
          (taskData as any)[systemColumn] = row[csvHeader];
        }
      }

      // Check if the row corresponds to an existing task (e.g., by a unique identifier like referenceId)
      // This is a simplified example, you might need more sophisticated matching
      if (taskData.referenceId) {
        const tasksQuery = query(
          collection(db, 'tasks'),
          where('referenceId', '==', taskData.referenceId),
          limit(1)
        );
        const querySnapshot = await getDocs(tasksQuery);
        if (!querySnapshot.empty) {
          const existingTaskDoc = querySnapshot.docs[0];
          taskId = existingTaskDoc.id;
          const existingTask = existingTaskDoc.data() as Task;

          // Update existing task and log changes
          const taskRef = doc(db, 'tasks', taskId);
          await setDoc(taskRef, taskData, { merge: true });

          for (const field in taskData) {
            if ((existingTask as any)[field] !== (taskData as any)[field]) {
              await logTaskHistory(taskId, userId, 'updated', field, (existingTask as any)[field], (taskData as any)[field]);
            }
          }
        }
      }
      // If no matching task is found by referenceId, you might want to create a new task here
      // await addDoc(tasksCollection, { ...taskData, createdBy: userId, createdAt: serverTimestamp(), status: 'new' }); // Example
    }
    return { success: true, message: 'CSV data processed successfully.' };
  } catch (error) {
    console.error("Error processing CSV data:", error);
    return { success: false, message: `Error processing CSV data: ${error.message}` };
  }
}

