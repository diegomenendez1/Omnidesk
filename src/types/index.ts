
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

// Define states that are considered "final" or "protected" from being reverted to 'Pendiente' by CSV import
export const PROTECTED_RESOLUTION_STATUSES: ReadonlyArray<TaskResolutionStatus> = ['SFP', 'Resuelto'];

export const TaskSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  status: TaskStatusSchema, // Required
  assignee: z.string().optional(), 

  taskReference: z.string().optional().describe("Unique reference for the task/order, used for matching."),
  delayDays: z.number().nullable().optional(),
  customerAccount: z.string().optional(),
  netAmount: z.number().nullable().optional(),
  transportMode: z.string().optional(),

  comments: z.string().optional(),
  resolutionAdmin: z.string().optional(),
  resolutionStatus: TaskResolutionStatusSchema.optional(),
  resolutionTimeDays: z.number().nullable().optional(),
  
  createdAt: z.string().datetime({ message: "Invalid datetime string for createdAt, expected ISO 8601 format" }).optional().describe("ISO datetime string when the task was first created/ingested."),
  // Allow other dynamic keys from CSV. For stricter validation, remove .catchall(z.any()).
}).catchall(z.any());

export type Task = z.infer<typeof TaskSchema>;

// --- Other existing types ---
export interface User {
  uid: string;
  email: string | null;
  name?: string | null;
  role?: 'owner' | 'admin' | 'user';
  createdAt?: any; // Firestore Timestamp or Date
  createdBy?: string;
}

export interface DataInconsistency {
  cell: string;
  description: string;
}

export interface ValidateDataConsistencyOutput {
  inconsistencies: DataInconsistency[];
  summary: string;
}

export interface SystemColumnInfo {
  name: keyof Task | string; 
  description: string;
  required?: boolean;
}
