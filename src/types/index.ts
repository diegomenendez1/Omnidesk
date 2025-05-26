
// Internal values for statuses, should be language-neutral if possible,
// or use these as keys for translation for display purposes.
export type TaskStatus = "Missing Estimated Dates" | "Missing POD" | "Pending to Invoice Out of Time";
export type TaskResolutionStatus = 'Pendiente' | 'SFP' | 'Resuelto';

export interface Task {
  id?: string;
  name?: string; 
  status: TaskStatus;
  assignee: string; 

  taskReference?: string; 
  delayDays?: number | null;
  customerAccount?: string; 
  netAmount?: number | null;
  transportMode?: string;

  comments?: string; 
  resolutionAdmin?: string; 
  resolutionStatus?: TaskResolutionStatus;
  resolutionTimeDays?: number | null;

  [key: string]: any;
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
  description: string; // This will become a translation key
  required?: boolean;
}
