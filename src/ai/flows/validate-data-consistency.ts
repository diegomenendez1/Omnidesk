// 'use server'
'use server';
/**
 * @fileOverview This file defines a Genkit flow for validating data consistency in an interactive table.
 *
 * - validateDataConsistency - A function that takes table data as input and returns a report of any data inconsistencies.
 * - ValidateDataConsistencyInput - The input type for the validateDataConsistency function.
 * - ValidateDataConsistencyOutput - The return type for the validateDataConsistency function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateDataConsistencyInputSchema = z.object({
  tableData: z.string().describe('The data from the interactive table, in JSON format.'),
});
export type ValidateDataConsistencyInput = z.infer<
  typeof ValidateDataConsistencyInputSchema
>;

const DataInconsistencySchema = z.object({
  cell: z.string().describe('The specific cell with the inconsistency (e.g., "A2").'),
  description: z
    .string()
    .describe('A detailed description of the data inconsistency.'),
});

const ValidateDataConsistencyOutputSchema = z.object({
  inconsistencies: z
    .array(DataInconsistencySchema)
    .describe('An array of data inconsistencies found in the table.'),
  summary: z
    .string()
    .describe('A summary of the number of inconsistencies found.'),
});

export type ValidateDataConsistencyOutput = z.infer<
  typeof ValidateDataConsistencyOutputSchema
>;

export async function validateDataConsistency(
  input: ValidateDataConsistencyInput
): Promise<ValidateDataConsistencyOutput> {
  return validateDataConsistencyFlow(input);
}

const validateDataConsistencyPrompt = ai.definePrompt({
  name: 'validateDataConsistencyPrompt',
  input: {schema: ValidateDataConsistencyInputSchema},
  output: {schema: ValidateDataConsistencyOutputSchema},
  prompt: `You are an AI assistant that specializes in identifying data inconsistencies in tables.

  Analyze the following table data (in JSON format) for any inconsistencies, including:
  - Outliers in numerical data
  - Mismatched data types within a column
  - Missing values
  - Unexpected or invalid data formats

  Table Data: {{{tableData}}}

  Return a JSON object containing an array of inconsistencies and a summary of the number of inconsistencies found. Each inconsistency should include the cell location and a description of the issue.
  Follow the schema to return your output.
  `,
});

const validateDataConsistencyFlow = ai.defineFlow(
  {
    name: 'validateDataConsistencyFlow',
    inputSchema: ValidateDataConsistencyInputSchema,
    outputSchema: ValidateDataConsistencyOutputSchema,
  },
  async input => {
    const {output} = await validateDataConsistencyPrompt(input);
    return output!;
  }
);
