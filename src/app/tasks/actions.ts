'use server';

import type { Task, TaskHistoryEntry, TaskHistoryChangeDetail } from '@/types';
import { getTasks, saveTasks } from '@/lib/local-db';
import { v4 as uuidv4 } from 'uuid';

export async function getTasksFromFirestoreAction(): Promise<Task[]> {
  return getTasks();
}

export async function updateTaskInFirestoreAction(
  taskId: string,
  updates: Partial<Omit<Task, 'id' | 'history' | 'createdAt'>>,
  changeDetails: TaskHistoryChangeDetail[],
  userId: string,
  userName: string
): Promise<{ success: boolean; error?: string; updatedTask?: Task }> {
  const tasks = getTasks();
  const idx = tasks.findIndex(t => t.id === taskId);
  if (idx === -1) {
    return { success: false, error: `Task with ID ${taskId} not found.` };
  }
  const existing = tasks[idx];
  const history: TaskHistoryEntry[] = existing.history || [];
  history.push({
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    userId,
    userName,
    changes: changeDetails,
  });
  const updated: Task = { ...existing, ...updates, history };
  tasks[idx] = updated;
  saveTasks(tasks);
  return { success: true, updatedTask: updated };
}

export async function addOrUpdateTasksInFirestoreAction(
  tasksToProcess: Task[],
  userId: string,
  userName: string,
  source: 'csv-upload' | 'migration'
): Promise<{ success: boolean; processedCount: number; createdCount: number; updatedCount: number }> {
  let tasks = getTasks();
  let processedCount = 0;
  let createdCount = 0;
  let updatedCount = 0;

  for (const incoming of tasksToProcess) {
    let idx = tasks.findIndex(t => t.id === incoming.id || (incoming.taskReference && t.taskReference === incoming.taskReference));
    let existing = idx !== -1 ? tasks[idx] : null;
    const history: TaskHistoryEntry[] = existing?.history || [];
    history.push({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      userId,
      userName,
      changes: [{ field: 'import', fieldLabel: source, oldValue: null, newValue: incoming }],
    });
    const taskToSave: Task = {
      ...existing,
      ...incoming,
      id: existing ? existing.id : incoming.id || uuidv4(),
      createdAt: existing?.createdAt || incoming.createdAt || new Date().toISOString(),
      history,
    };
    if (idx !== -1) {
      tasks[idx] = taskToSave;
      updatedCount++;
    } else {
      tasks.push(taskToSave);
      createdCount++;
    }
    processedCount++;
  }

  saveTasks(tasks);
  return { success: true, processedCount, createdCount, updatedCount };
}
