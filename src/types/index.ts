
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

export const PROTECTED_RESOLUTION_STATUSES: ReadonlyArray<TaskResolutionStatus> = ['SFP', 'Resuelto'];

export const TaskHistoryChangeDetailSchema = z.object({
  field: z.string(),
  fieldLabel: z.string(),
  oldValue: z.any().optional().nullable(),
  newValue: z.any().optional().nullable(),
});
export type TaskHistoryChangeDetail = z.infer<typeof TaskHistoryChangeDetailSchema>;

export const TaskHistoryEntrySchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(), // ISO string
  userId: z.string(),
  userName: z.string(),
  changes: z.array(TaskHistoryChangeDetailSchema),
});
export type TaskHistoryEntry = z.infer<typeof TaskHistoryEntrySchema>;

export const TaskSchema = z.object({
  id: z.string().describe("Unique Firestore document ID for the task."), // Will be set before saving to Firestore
  taskReference: z.string().optional().describe("Unique human-readable reference for the task/order, used for matching."),
  status: TaskStatusSchema,
  assignee: z.string().optional().nullable(),
  delayDays: z.number().nullable().optional(),
  customerAccount: z.string().optional().nullable(),
  netAmount: z.number().nullable().optional(),
  transportMode: z.string().optional().nullable(),
  comments: z.string().optional().nullable(),
  resolutionAdmin: z.string().optional().nullable(),
  resolutionStatus: TaskResolutionStatusSchema.optional().nullable(),
  resolutionTimeDays: z.number().nullable().optional(),
  createdAt: z.string().datetime({ message: "Invalid datetime string for createdAt, expected ISO 8601 format" }).optional().nullable().describe("ISO datetime string when the task was first created/ingested."),
  resolvedAt: z.string().datetime({ message: "Invalid datetime string for resolvedAt, expected ISO 8601 format" }).optional().nullable().describe("ISO datetime string when the task was resolved."),
  history: z.array(TaskHistoryEntrySchema).optional().default([]),
  // Allow other dynamic keys from CSV initially, but they might not be strongly typed or directly used.
}).catchall(z.any()); // Keep catchall for flexibility during CSV import if unknown columns exist

export type Task = z.infer<typeof TaskSchema>;


export interface User {
  uid: string;
  email: string | null;
  name?: string | null;
  role?: 'owner' | 'admin' | 'user';
  createdAt?: any; // Firestore Timestamp or Date string from server action
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

// This type was in upload-data/actions.ts, better to have it here.
export interface SystemColumnDefinition {
  name: keyof Task | string;
  description: string; // This will be a translation key
  required?: boolean;
}
