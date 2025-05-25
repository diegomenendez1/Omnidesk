
export interface Task {
  id: string;
  name: string;
  status: "To Do" | "In Progress" | "Blocked" | "Done" | "Review";
  priority: "Low" | "Medium" | "High" | "Very High";
  dueDate: string | null; // ISO string date format YYYY-MM-DD
  assignee: string;
  estimatedHours: number | string | null; // Allow string for potential inconsistencies
  actualHours: number | null;
  description?: string;
  // Allow any other string keys for dynamic properties from CSV
  [key: string]: any;
}

// For AI Validation
export interface DataInconsistency {
  cell: string; // e.g., "D2" (column D, row 2)
  description: string;
}

export interface ValidateDataConsistencyOutput {
  inconsistencies: DataInconsistency[];
  summary: string;
}

// For CSV Upload Mapping
export interface SystemColumnInfo {
  name: keyof Task | string; // Allow string for flexibility if needed, but ideally keyof Task
  description: string;
  required?: boolean;
}
