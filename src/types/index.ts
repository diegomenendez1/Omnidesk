
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
  fieldLabel: z.string(), // User-friendly label for the field
  oldValue: z.any().optional().nullable(),
  newValue: z.any().optional().nullable(),
});
export type TaskHistoryChangeDetail = z.infer<typeof TaskHistoryChangeDetailSchema>;

export const TaskHistoryEntrySchema = z.object({
  id: z.string().uuid().describe("Unique ID for this history entry."),
  timestamp: z.string().datetime({ message: "Invalid datetime string for history entry timestamp, expected ISO 8601 format" }).describe("ISO datetime string when the change occurred."),
  userId: z.string().describe("ID of the user who made the change."),
  userName: z.string().describe("Name of the user who made the change."),
  changes: z.array(TaskHistoryChangeDetailSchema).describe("Array of specific field changes in this event."),
});
export type TaskHistoryEntry = z.infer<typeof TaskHistoryEntrySchema>;

export const TaskSchema = z.object({
  id: z.string().describe("Unique Firestore document ID for the task. This is the document's own ID, not a field within it, but useful to have in the type."),
  title: z.string().optional().nullable().describe("A brief title or name for the task/incidence."),
  taskReference: z.string().optional().describe("Unique human-readable reference for the task/order, used for matching (e.g., TO Ref)."),
  status: TaskStatusSchema.describe("Current operational status of the task (e.g., Missing POD)."),
  assignee: z.string().optional().nullable().describe("Name or ID of the person/group assigned to handle the operational part of the task (e.g., Logistic Developer)."),
  delayDays: z.number().nullable().optional().describe("Number of days the task is delayed, if applicable."),
  customerAccount: z.string().optional().nullable().describe("Identifier for the customer account associated with the task."),
  netAmount: z.number().nullable().optional().describe("Net monetary amount related to the task."),
  transportMode: z.string().optional().nullable().describe("Mode of transport for the task (e.g., Air, Sea, Land)."),
  comments: z.string().optional().nullable().describe("General comments or notes related to the task. For structured, multi-user comments, a subcollection or a more complex array structure might be needed."),
  resolutionAdmin: z.string().optional().nullable().describe("Name or ID of the administrator responsible for the final resolution of the task/incidence."),
  resolutionStatus: TaskResolutionStatusSchema.optional().nullable().describe("Final resolution status of the task (e.g., Pendiente, Resuelto)."),
  resolutionTimeDays: z.number().nullable().optional().describe("Number of days taken to resolve the task, if applicable."),
  createdAt: z.string().datetime({ message: "Invalid datetime string for createdAt, expected ISO 8601 format" }).optional().nullable().describe("ISO datetime string when the task was first created/ingested."),
  resolvedAt: z.string().datetime({ message: "Invalid datetime string for resolvedAt, expected ISO 8601 format" }).optional().nullable().describe("ISO datetime string when the task was marked as resolved or SFP."),
  history: z.array(TaskHistoryEntrySchema).optional().default([]).describe("Array of history entries detailing changes to the task."),
  // Allow other dynamic keys from CSV initially, but they might not be strongly typed or directly used.
}).catchall(z.any()); // Keep catchall for flexibility during CSV import if unknown columns exist

export type Task = z.infer<typeof TaskSchema>;


// Type for dates that can be either Firestore Timestamp or ISO string
type DateLike = string | Date | { toDate: () => Date } | { seconds: number; nanoseconds: number };

// Convert DateLike to ISO string for consistent client-side usage
const toISOString = (date: DateLike): string => {
  if (!date) return new Date().toISOString();
  if (typeof date === 'string') return date;
  if (date instanceof Date) return date.toISOString();
  if ('toDate' in date) return date.toDate().toISOString();
  if ('seconds' in date) return new Date(date.seconds * 1000).toISOString();
  return new Date().toISOString();
};

// Base User type
export interface User {
  uid: string;
  email: string | null;
  name?: string | null;
  role?: 'owner' | 'admin' | 'user';
  createdAt?: string; // Always stored as ISO string in the client
  updatedAt?: string; // Always stored as ISO string in the client
  createdBy?: string;
}

// Helper function to convert Firestore data to User
export const userFromFirestore = (data: any): User => {
  return {
    uid: data.uid,
    email: data.email || null,
    name: data.name || null,
    role: data.role || 'user',
    createdAt: toISOString(data.createdAt || new Date()),
    updatedAt: toISOString(data.updatedAt || new Date()),
    createdBy: data.createdBy || null,
  };
};

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
  name: keyof Task | string; // Can be a known Task key or a string for dynamic columns
  description: string; // This will be a translation key or a direct string
  required?: boolean;
}
