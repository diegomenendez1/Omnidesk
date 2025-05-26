
import { InteractiveTableClient } from '@/components/table/interactive-table-client';
import type { Task } from '@/types';

// Mock data for the table - some intentional inconsistencies
// Adjusted to reflect removal of 'priority' and optional 'id', 'name'
const initialTasks: Task[] = [
  { id: "TASK-001", name: "Project Alpha Kickoff", status: "To Do", dueDate: "2024-08-15", assignee: "Alice", estimatedHours: 8, actualHours: null, description: "Initial meeting and planning for Project Alpha.", taskReference: "T001", delayDays: 0, customerAccount: "Acme Corp", netAmount: 1200, transportMode: "Air" },
  { id: "TASK-002", name: "Design UX Mockups", status: "In Progress", dueDate: "2024-08-20", assignee: "Bob", estimatedHours: 24, actualHours: 10, description: "Create detailed mockups for core user flows.", taskReference: "T002", delayDays: 2, customerAccount: "Beta Inc", netAmount: 2500, transportMode: "Sea" },
  { id: "TASK-003", name: "Develop Feature X", status: "To Do", dueDate: "2024-09-01", assignee: "Charlie", estimatedHours: 40, actualHours: 0, description: "Implement the primary functionality of Feature X.", taskReference: "T003", netAmount: 5000 },
  { id: "TASK-004", name: "User Testing Session 1", status: "Blocked", dueDate: "2024-09-10", assignee: "Alice", estimatedHours: 16, actualHours: null, description: "Conduct first round of user testing. Blocked by incomplete prototype.", taskReference: "T004", delayDays: 5 },
  { id: "TASK-005", name: "Technical Documentation", status: "Done", dueDate: "2024-07-30", assignee: "David", estimatedHours: 12, actualHours: 10, description: "Write up technical specifications and API docs.", taskReference: "T005" },
  { id: "TASK-006", name: "Critical Bug Fixing", status: "In Progress", dueDate: "2024-08-05", assignee: "Eve", estimatedHours: "unknown", actualHours: 5, description: "Address P0 bugs reported by QA.", taskReference: "T006BUG" }, 
  { id: "TASK-007", name: "Setup Staging Environment", status: "To Do", dueDate: "2024-09-15", assignee: "Bob", estimatedHours: 8, actualHours: null, description: "Prepare the staging server for upcoming release.", taskReference: "T007INFRA" },
  { id: "TASK-008", name: "Client Demo Preparation", status: "Done", dueDate: "20240725", assignee: "Charlie", estimatedHours: 2, actualHours: 2, description: "Prepare presentation materials for client demo.", taskReference: "T008DEMO" }, 
  { id: "TASK-009", name: "Review Code Submissions", status: "To Do", dueDate: null, assignee: "David", estimatedHours: 4, actualHours: null, description: "Review pull requests from junior developers.", taskReference: "T009CODE" }, 
  { id: "TASK-010", name: "Marketing Campaign Launch", status: "In Progress", dueDate: "2024-08-25", assignee: "Flora", estimatedHours: 30, actualHours: 15, description: "Launch the new marketing campaign for Q3.", taskReference: "T010MARKET" },
  { id: "TASK-011", name: "Performance Optimization", status: "To Do", dueDate: "2024-09-05", assignee: "George", estimatedHours: -5, actualHours: null, description: "Optimize database queries for faster load times.", taskReference: "T011PERF" } 
];


export default function InteractiveTablePage() {
  return (
    <div className="space-y-6 w-full">
      <InteractiveTableClient initialData={initialTasks} />
    </div>
  );
}
