import { InteractiveTableClient } from '@/components/table/interactive-table-client';
import type { Task } from '@/types';

// Mock data for the table - some intentional inconsistencies
const initialTasks: Task[] = [
  { id: "TASK-001", name: "Project Alpha Kickoff", status: "To Do", priority: "High", dueDate: "2024-08-15", assignee: "Alice", estimatedHours: 8, actualHours: null, description: "Initial meeting and planning for Project Alpha." },
  { id: "TASK-002", name: "Design UX Mockups", status: "In Progress", priority: "Medium", dueDate: "2024-08-20", assignee: "Bob", estimatedHours: 24, actualHours: 10, description: "Create detailed mockups for core user flows." },
  { id: "TASK-003", name: "Develop Feature X", status: "To Do", priority: "High", dueDate: "2024-09-01", assignee: "Charlie", estimatedHours: 40, actualHours: 0, description: "Implement the primary functionality of Feature X." },
  { id: "TASK-004", name: "User Testing Session 1", status: "Blocked", priority: "Low", dueDate: "2024-09-10", assignee: "Alice", estimatedHours: 16, actualHours: null, description: "Conduct first round of user testing. Blocked by incomplete prototype." },
  { id: "TASK-005", name: "Technical Documentation", status: "Done", priority: "Medium", dueDate: "2024-07-30", assignee: "David", estimatedHours: 12, actualHours: 10, description: "Write up technical specifications and API docs." },
  { id: "TASK-006", name: "Critical Bug Fixing", status: "In Progress", priority: "Very High", dueDate: "2024-08-05", assignee: "Eve", estimatedHours: "unknown", actualHours: 5, description: "Address P0 bugs reported by QA." }, // Inconsistency: estimatedHours string
  { id: "TASK-007", name: "Setup Staging Environment", status: "To Do", priority: "High", dueDate: "2024-09-15", assignee: "Bob", estimatedHours: 8, actualHours: null, description: "Prepare the staging server for upcoming release." },
  { id: "TASK-008", name: "Client Demo Preparation", status: "Done", priority: "Medium", dueDate: "20240725", assignee: "Charlie", estimatedHours: 2, actualHours: 2, description: "Prepare presentation materials for client demo." }, // Inconsistency: dueDate format
  { id: "TASK-009", name: "Review Code Submissions", status: "To Do", priority: "Low", dueDate: null, assignee: "David", estimatedHours: 4, actualHours: null, description: "Review pull requests from junior developers." }, // Inconsistency: null dueDate
  { id: "TASK-010", name: "Marketing Campaign Launch", status: "In Progress", priority: "High", dueDate: "2024-08-25", assignee: "Flora", estimatedHours: 30, actualHours: 15, description: "Launch the new marketing campaign for Q3." },
  { id: "TASK-011", name: "Performance Optimization", status: "To Do", priority: "Medium", dueDate: "2024-09-05", assignee: "George", estimatedHours: -5, actualHours: null, description: "Optimize database queries for faster load times." } // Inconsistency: negative estimatedHours
];


export default function InteractiveTablePage() {
  return (
    <div className="space-y-6 w-full">
      <InteractiveTableClient initialData={initialTasks} />
    </div>
  );
}
