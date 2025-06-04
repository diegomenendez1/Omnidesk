'use server';

import { validateDataConsistency } from '@/ai/flows/validate-data-consistency';
import { logTaskHistory } from '@/lib/firestore';
import { auth } from '@/lib/firebase'; // Assuming Firebase Auth is used for user info
import type { ValidateDataConsistencyInput, ValidateDataConsistencyOutput } from '@/ai/flows/validate-data-consistency';

export async function performDataValidation(input: ValidateDataConsistencyInput): Promise<ValidateDataConsistencyOutput> {
  try {
    // The AI flow might already be configured or might need specific invocation logic.
    // Assuming validateDataConsistency is the entry point to the Genkit flow.
    const result = await validateDataConsistency(input);
    return result;
  } catch (error) {
    console.error("Error during data validation:", error);
    // Return a structured error or re-throw, ensuring the client can handle it.
    // For simplicity, returning an error structure that matches ValidateDataConsistencyOutput
    // but indicates failure might be better if the flow itself doesn't handle errors this way.
    // For now, we'll let it throw and catch on the client, or it could return a specific error shape.
    if (error instanceof Error) {
       return {
        inconsistencies: [{ cell: "System", description: `Validation failed: ${error.message}` }],
        summary: "Data validation process encountered an error."
      };
    }
    return {
      inconsistencies: [{ cell: "System", description: "An unknown error occurred during validation." }],
      summary: "Data validation process encountered an unknown error."
    };
  }
}

export async function updateTask(taskId: string, updatedData: Partial<any>) { // Replace 'any' with your Task interface
  const user = await auth().currentUser;
  const userId = user ? user.uid : 'anonymous'; // Get user ID

  // Fetch the current task data to compare for logging
  // You'll need to implement a function to fetch a single task by ID
  // For example: const oldTask = await getTaskById(taskId);
  // Replace this placeholder with your actual fetching logic:
  const oldTask = { /* Fetch task data here */ };

  try {
    // Update the task in Firestore
    // You'll need to implement a function to update a task by ID
    // For example: await updateTaskInFirestore(taskId, updatedData);
    // Replace this placeholder with your actual update logic:
    await new Promise(resolve => setTimeout(resolve, 100)); // Placeholder for async update

    // Log changes to the history subcollection
    if (oldTask) {
      for (const field in updatedData) {
        if (Object.prototype.hasOwnProperty.call(updatedData, field)) {
          const oldValue = (oldTask as any)[field]; // Cast to any to access field dynamically
          const newValue = (updatedData as any)[field]; // Cast to any

          if (oldValue !== newValue) {
            await logTaskHistory(taskId, userId, 'updated', field, oldValue, newValue);
          }
        }
      }
    } else {
        // Log that the task was updated but old data was not found
        await logTaskHistory(taskId, userId, 'updated', undefined, undefined, updatedData);
    }

  } catch (error) {
    console.error("Error updating task and logging history:", error);
    throw error; // Re-throw to handle on the client
  }
}
