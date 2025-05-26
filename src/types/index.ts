
export interface Task {
  id?: string; // Made optional
  name?: string; // Made optional
  status: "To Do" | "In Progress" | "Blocked" | "Done" | "Review";
  assignee: string;

  // Campos para mapeo de CSV
  taskReference?: string;
  delayDays?: number | null;
  customerAccount?: string;
  netAmount?: number | null;
  transportMode?: string;

  [key: string]: any;
}

// For AI Validation
export interface DataInconsistency {
  cell: string;
  description: string;
}

export interface ValidateDataConsistencyOutput {
  inconsistencies: DataInconsistency[];
  summary: string;
}

// For CSV Upload Mapping
export interface SystemColumnInfo {
  name: keyof Task | string;
  description: string;
  required?: boolean;
}
