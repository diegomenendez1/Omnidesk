
import { z } from 'zod';

// Zod Schemas for validation
export const TaskStatusSchema = z.enum([
  "Missing Estimated Dates",
  "Missing POD",
  "Pending to Invoice Out of Time"
]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TaskResolutionStatusSchema = z.enum([
  'Pendiente',
  'SFP',
  'Resuelto'
]);
export type TaskResolutionStatus = z.infer<typeof TaskResolutionStatusSchema>;

export const TaskSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  status: TaskStatusSchema, // Required
  assignee: z.string().optional(), // Optional to allow empty string if not mapped or value is empty

  taskReference: z.string().optional(),
  delayDays: z.number().nullable().optional(),
  customerAccount: z.string().optional(),
  netAmount: z.number().nullable().optional(),
  transportMode: z.string().optional(),

  comments: z.string().optional(),
  resolutionAdmin: z.string().optional(),
  // resolutionStatus is optional; if not provided, it remains undefined.
  // The application logic (e.g., in InteractiveTableClient or during display) can default it if necessary.
  resolutionStatus: TaskResolutionStatusSchema.optional(),
  resolutionTimeDays: z.number().nullable().optional(),
  // Allow other dynamic keys that might come from CSV but are not strictly part of the core Task model
  // This is a common pattern when dealing with flexible data imports.
  // However, for stricter validation, this could be removed.
  // For now, keeping it to avoid breaking if extra columns are mapped.
}).catchall(z.any()); // Use .catchall(z.any()) or .passthrough() if you want to allow extra fields not defined in schema

// The main Task type derived from the Zod schema
export type Task = z.infer<typeof TaskSchema>;

// --- Other existing types ---
export interface DataInconsistency {
  cell: string;
  description: string;
}

export interface ValidateDataConsistencyOutput {
  inconsistencies: DataInconsistency[];
  summary: string;
}

export interface SystemColumnInfo {
  name: keyof Task | string; // Now refers to keys of Zod-derived Task
  description: string;
  required?: boolean;
}
