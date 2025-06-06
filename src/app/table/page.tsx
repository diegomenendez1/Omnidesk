
"use client"; // This page now uses hooks for translation, so it must be a client component

import { InteractiveTableClient } from '@/components/table/interactive-table-client';
import type { Task } from '@/types';
import { useLanguage } from '@/context/language-context'; // Import useLanguage

export default function InteractiveTablePage() {
  const { t } = useLanguage(); // Get translation function

  // These initial tasks are for fallback/demo.
  // The actual data is loaded from localStorage in InteractiveTableClient
  const initialTasks: Task[] = [
    { 
      id: "TASK-001", 
      status: "Missing Estimated Dates", 
      assignee: "Alice", 
      taskReference: "T001", 
      delayDays: 0, 
      customerAccount: "Acme Corp", 
      netAmount: 1200, 
      transportMode: "Air", 
      comments: "Initial setup pending", 
      resolutionAdmin: "AdminX", 
      resolutionStatus: "Pendiente", 
      resolutionTimeDays: null,
      history: []
    },
    { 
      id: "TASK-002", 
      status: "Missing POD", 
      assignee: "Bob", 
      taskReference: "T002", 
      delayDays: 2, 
      customerAccount: "Beta Inc", 
      netAmount: 2500, 
      transportMode: "Sea", 
      comments: "Awaiting feedback", 
      resolutionAdmin: "AdminY", 
      resolutionStatus: "SFP", 
      resolutionTimeDays: null,
      history: []
    },
    // Add more tasks with the same structure...
    { 
      id: "TASK-011", 
      status: "Missing POD", 
      assignee: "George", 
      taskReference: "T011PERF", 
      netAmount: -5, 
      comments: "Investigating negative net amount", 
      resolutionAdmin: "AdminY", 
      resolutionStatus: "Pendiente", 
      resolutionTimeDays: null,
      history: []
    }
  ];

  return (
    // The w-full was already here, which is good.
    <div className="space-y-6 w-full">
      <InteractiveTableClient initialData={initialTasks} />
    </div>
  );
}
