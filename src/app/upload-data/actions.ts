
'use server';

import { suggestCsvMappings } from '@/ai/flows/suggest-csv-mapping-flow';
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
