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
