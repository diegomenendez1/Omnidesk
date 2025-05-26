
"use client"; // This page now uses hooks for translation, so it must be a client component

import { InteractiveTableClient } from '@/components/table/interactive-table-client';
import type { Task } from '@/types';
import { useLanguage } from '@/context/language-context'; // Import useLanguage

export default function InteractiveTablePage() {
  const { t } = useLanguage(); // Get translation function

  // These initial tasks are for fallback/demo.
  // The actual data is loaded from localStorage in InteractiveTableClient
  const initialTasks: Task[] = [
    { id: "TASK-001", status: "Missing Estimated Dates", assignee: "Alice", taskReference: "T001", delayDays: 0, customerAccount: "Acme Corp", netAmount: 1200, transportMode: "Air", comments: "Initial setup pending", resolutionAdmin: "AdminX", resolutionStatus: "Pendiente", resolutionTimeDays: null },
    { id: "TASK-002", status: "Missing POD", assignee: "Bob", taskReference: "T002", delayDays: 2, customerAccount: "Beta Inc", netAmount: 2500, transportMode: "Sea", comments: "Awaiting feedback", resolutionAdmin: "AdminY", resolutionStatus: "SFP", resolutionTimeDays: null },
    { id: "TASK-003", status: "Pending to Invoice Out of Time", assignee: "Charlie", taskReference: "T003", netAmount: 5000, comments: "", resolutionAdmin: "", resolutionStatus: "Pendiente", resolutionTimeDays: null },
    { id: "TASK-004", status: "Missing Estimated Dates", assignee: "Alice", taskReference: "T004", delayDays: 5, comments: "Resource unavailable", resolutionAdmin: "AdminX", resolutionStatus: "Pendiente", resolutionTimeDays: null },
    { id: "TASK-005", status: "Missing POD", assignee: "David", taskReference: "T005", comments: "All docs completed", resolutionAdmin: "AdminZ", resolutionStatus: "Resuelto", resolutionTimeDays: 3 },
    { id: "TASK-006", status: "Pending to Invoice Out of Time", assignee: "Eve", taskReference: "T006BUG", comments: "High priority bug", resolutionAdmin: "AdminY", resolutionStatus: "SFP", resolutionTimeDays: null },
    { id: "TASK-007", status: "Missing Estimated Dates", assignee: "Bob", taskReference: "T007INFRA", comments: "", resolutionAdmin: "", resolutionStatus: "Pendiente", resolutionTimeDays: null },
    { id: "TASK-008", status: "Missing POD", assignee: "Charlie", taskReference: "T008DEMO", comments: "Demo successful", resolutionAdmin: "AdminX", resolutionStatus: "Resuelto", resolutionTimeDays: 1 },
    { id: "TASK-009", status: "Pending to Invoice Out of Time", assignee: "David", taskReference: "T009CODE", comments: "", resolutionAdmin: "", resolutionStatus: "Pendiente", resolutionTimeDays: null },
    { id: "TASK-010", status: "Missing Estimated Dates", assignee: "Flora", taskReference: "T010MARKET", comments: "Campaign is live", resolutionAdmin: "AdminZ", resolutionStatus: "SFP", resolutionTimeDays: null },
    { id: "TASK-011", status: "Missing POD", assignee: "George", taskReference: "T011PERF", netAmount: -5, comments: "Investigating negative net amount", resolutionAdmin: "AdminY", resolutionStatus: "Pendiente", resolutionTimeDays: null }
  ];

  return (
    // The w-full was already here, which is good.
    <div className="space-y-6 w-full">
      <InteractiveTableClient initialData={initialTasks} />
    </div>
  );
}
