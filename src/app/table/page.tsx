
import { InteractiveTableClient } from '@/components/table/interactive-table-client';
import type { Task } from '@/types';

// Mock data for the table - adjusted for removed and new columns
const initialTasks: Task[] = [
  { id: "TASK-001", name: "Project Alpha Kickoff", status: "To Do", assignee: "Alice", taskReference: "T001", delayDays: 0, customerAccount: "Acme Corp", netAmount: 1200, transportMode: "Air", comments: "Initial setup pending", resolutionAdmin: "AdminX", resolutionStatus: "Pendiente", resolutionTimeDays: null },
  { id: "TASK-002", name: "Design UX Mockups", status: "In Progress", assignee: "Bob", taskReference: "T002", delayDays: 2, customerAccount: "Beta Inc", netAmount: 2500, transportMode: "Sea", comments: "Awaiting feedback", resolutionAdmin: "AdminY", resolutionStatus: "En Progreso", resolutionTimeDays: null },
  { id: "TASK-003", name: "Develop Feature X", status: "To Do", assignee: "Charlie", taskReference: "T003", netAmount: 5000, comments: "", resolutionAdmin: "", resolutionStatus: "Pendiente", resolutionTimeDays: null },
  { id: "TASK-004", name: "User Testing Session 1", status: "Blocked", assignee: "Alice", taskReference: "T004", delayDays: 5, comments: "Resource unavailable", resolutionAdmin: "AdminX", resolutionStatus: "Bloqueado", resolutionTimeDays: null },
  { id: "TASK-005", name: "Technical Documentation", status: "Done", assignee: "David", taskReference: "T005", comments: "All docs completed", resolutionAdmin: "AdminZ", resolutionStatus: "Resuelto", resolutionTimeDays: 3 },
  { id: "TASK-006", name: "Critical Bug Fixing", status: "In Progress", assignee: "Eve", taskReference: "T006BUG", comments: "High priority bug", resolutionAdmin: "AdminY", resolutionStatus: "En Progreso", resolutionTimeDays: null },
  { id: "TASK-007", name: "Setup Staging Environment", status: "To Do", assignee: "Bob", taskReference: "T007INFRA", comments: "", resolutionAdmin: "", resolutionStatus: "Pendiente", resolutionTimeDays: null },
  { id: "TASK-008", name: "Client Demo Preparation", status: "Done", assignee: "Charlie", taskReference: "T008DEMO", comments: "Demo successful", resolutionAdmin: "AdminX", resolutionStatus: "Resuelto", resolutionTimeDays: 1 },
  { id: "TASK-009", name: "Review Code Submissions", status: "To Do", assignee: "David", taskReference: "T009CODE", comments: "", resolutionAdmin: "", resolutionStatus: "Pendiente", resolutionTimeDays: null },
  { id: "TASK-010", name: "Marketing Campaign Launch", status: "In Progress", assignee: "Flora", taskReference: "T010MARKET", comments: "Campaign is live", resolutionAdmin: "AdminZ", resolutionStatus: "En Progreso", resolutionTimeDays: null },
  { id: "TASK-011", name: "Performance Optimization", status: "To Do", assignee: "George", taskReference: "T011PERF", netAmount: -5, comments: "Investigating negative net amount", resolutionAdmin: "AdminY", resolutionStatus: "Pendiente", resolutionTimeDays: null }
];


export default function InteractiveTablePage() {
  return (
    <div className="space-y-6 w-full">
      <InteractiveTableClient initialData={initialTasks} />
    </div>
  );
}
