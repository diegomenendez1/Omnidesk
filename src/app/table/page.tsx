
import { InteractiveTableClient } from '@/components/table/interactive-table-client';
import type { Task } from '@/types';

// Mock data for the table - adjusted for removed columns
const initialTasks: Task[] = [
  { id: "TASK-001", name: "Project Alpha Kickoff", status: "To Do", assignee: "Alice", taskReference: "T001", delayDays: 0, customerAccount: "Acme Corp", netAmount: 1200, transportMode: "Air" },
  { id: "TASK-002", name: "Design UX Mockups", status: "In Progress", assignee: "Bob", taskReference: "T002", delayDays: 2, customerAccount: "Beta Inc", netAmount: 2500, transportMode: "Sea" },
  { id: "TASK-003", name: "Develop Feature X", status: "To Do", assignee: "Charlie", taskReference: "T003", netAmount: 5000 },
  { id: "TASK-004", name: "User Testing Session 1", status: "Blocked", assignee: "Alice", taskReference: "T004", delayDays: 5 },
  { id: "TASK-005", name: "Technical Documentation", status: "Done", assignee: "David", taskReference: "T005" },
  { id: "TASK-006", name: "Critical Bug Fixing", status: "In Progress", assignee: "Eve", taskReference: "T006BUG" },
  { id: "TASK-007", name: "Setup Staging Environment", status: "To Do", assignee: "Bob", taskReference: "T007INFRA" },
  { id: "TASK-008", name: "Client Demo Preparation", status: "Done", assignee: "Charlie", taskReference: "T008DEMO" },
  { id: "TASK-009", name: "Review Code Submissions", status: "To Do", assignee: "David", taskReference: "T009CODE" },
  { id: "TASK-010", name: "Marketing Campaign Launch", status: "In Progress", assignee: "Flora", taskReference: "T010MARKET" },
  { id: "TASK-011", name: "Performance Optimization", status: "To Do", assignee: "George", taskReference: "T011PERF", netAmount: -5 } // Example with negative netAmount
];


export default function InteractiveTablePage() {
  return (
    <div className="space-y-6 w-full">
      <InteractiveTableClient initialData={initialTasks} />
    </div>
  );
}
