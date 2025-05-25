
'use server';
/**
 * @fileOverview Flow for suggesting CSV column mappings to system columns.
 *
 * - suggestCsvMappings - Function to get AI-suggested mappings.
 * - SuggestCsvMappingInput - Input type for the flow.
 * - SuggestCsvMappingOutput - Output type for the flow.
 * - SystemColumnDefinition - Type for defining system columns with descriptions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SystemColumnDefinitionSchema = z.object({
  name: z.string().describe('The internal name of the system column (e.g., "dueDate").'),
  description: z.string().describe('A user-friendly description of what this system column represents (e.g., "Due date for the task in YYYY-MM-DD format").'),
  required: z.boolean().optional().describe('Whether this system column is required for creating a valid record.')
});
export type SystemColumnDefinition = z.infer<typeof SystemColumnDefinitionSchema>;

const SuggestCsvMappingInputSchema = z.object({
  csvHeaders: z.array(z.string()).describe('An array of header names extracted from the uploaded CSV file.'),
  systemColumns: z.array(SystemColumnDefinitionSchema).describe('An array of available system columns to map to, including their names and descriptions.'),
});
export type SuggestCsvMappingInput = z.infer<typeof SuggestCsvMappingInputSchema>;

const SuggestedMappingSchema = z.object({
  csvColumn: z.string().describe('The original header name from the CSV file.'),
  systemColumn: z.string().nullable().describe('The name of the system column it is suggested to map to. Null if no suitable mapping is found or if it should be ignored.'),
  confidence: z.number().optional().describe('A confidence score (0-1) for the suggestion, if available.'),
});
type SuggestedMapping = z.infer<typeof SuggestedMappingSchema>;

const SuggestCsvMappingOutputSchema = z.object({
  suggestedMappings: z.array(SuggestedMappingSchema).describe('An array of suggested mappings for each CSV column.'),
  unmappedCsvColumns: z.array(z.string()).optional().describe('CSV columns for which no mapping suggestion could be made.'),
});
export type SuggestCsvMappingOutput = z.infer<typeof SuggestCsvMappingOutputSchema>;

export async function suggestCsvMappings(input: SuggestCsvMappingInput): Promise<SuggestCsvMappingOutput> {
  return suggestCsvMappingsFlow(input);
}

const suggestCsvMappingsPrompt = ai.definePrompt({
  name: 'suggestCsvMappingsPrompt',
  input: { schema: SuggestCsvMappingInputSchema },
  output: { schema: SuggestCsvMappingOutputSchema },
  prompt: `You are an intelligent data mapping assistant. Your task is to suggest how columns from an uploaded CSV file should be mapped to a predefined set of system columns.

Available System Columns:
{{#each systemColumns}}
- Name: "{{name}}", Description: "{{description}}"{{#if required}} (Required){{/if}}
{{/each}}

CSV Headers from the uploaded file:
{{#each csvHeaders}}
- "{{this}}"
{{/each}}

Based on the CSV headers and the descriptions of the system columns, provide a suggested mapping for EACH CSV header.
For each CSV header, identify the most appropriate system column.
If a CSV header does not seem to match any system column, or if it's ambiguous, you can suggest mapping it to 'null' (meaning "do not import" or "no clear match").
Consider common naming variations (e.g., "Due Date", "Deadline", "Fecha de Entrega" might all map to a system column named "dueDate" described as "Due date for the task").
Prioritize mapping to required system columns if a reasonable match exists.

Return the suggestions in the specified JSON format. For each csvColumn, provide the systemColumn it maps to (or null) and an optional confidence score.
List any CSV columns you couldn't map under unmappedCsvColumns.
`,
});

const suggestCsvMappingsFlow = ai.defineFlow(
  {
    name: 'suggestCsvMappingsFlow',
    inputSchema: SuggestCsvMappingInputSchema,
    outputSchema: SuggestCsvMappingOutputSchema,
  },
  async (input) => {
    const { output } = await suggestCsvMappingsPrompt(input);
    if (!output) {
      // Fallback or error handling if AI provides no output
      // Create a default mapping where all systemColumns are null
      const fallbackMappings = input.csvHeaders.map(header => ({
        csvColumn: header,
        systemColumn: null,
        confidence: 0
      }));
      return {
        suggestedMappings: fallbackMappings,
        unmappedCsvColumns: input.csvHeaders
      };
    }
    // Ensure all CSV headers are present in the output, even if unmapped by the AI
    const finalMappings: SuggestedMapping[] = [];
    // const mappedByAI = new Set(output.suggestedMappings.map(m => m.csvColumn)); // Not strictly needed with the loop below

    for (const csvHeader of input.csvHeaders) {
        const aiMapping = output.suggestedMappings.find(m => m.csvColumn === csvHeader);
        if (aiMapping) {
            finalMappings.push(aiMapping);
        } else {
            // If AI didn't provide a mapping for a header, add it as unmapped
            finalMappings.push({ csvColumn: csvHeader, systemColumn: null, confidence: 0 });
        }
    }
    output.suggestedMappings = finalMappings;
    
    // Ensure unmappedCsvColumns is populated correctly
    // An unmapped column is one for which systemColumn is null in the final mappings
    const unmapped = finalMappings
        .filter(m => m.systemColumn === null)
        .map(m => m.csvColumn);
    output.unmappedCsvColumns = unmapped;

    return output;
  }
);

