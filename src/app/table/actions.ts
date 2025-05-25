'use server';

import { validateDataConsistency } from '@/ai/flows/validate-data-consistency';
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
