
'use server';

import {
  db,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  writeBatch,
  Timestamp,
  where,
  WriteBatch,
} from '@/lib/firebase';
import type { Task, TaskHistoryEntry, TaskHistoryChangeDetail } from '@/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Converts Firestore Timestamps in a task object to ISO strings.
 * Handles nested objects and arrays (like history).
 */
function convertTimestampsToISO(data: any): any {
  if (data instanceof Timestamp) {
    return data.toDate().toISOString();
  }
  if (Array.isArray(data)) {
    return data.map(convertTimestampsToISO);
  }
  if (typeof data === 'object' && data !== null) {
    const res: { [key: string]: any } = {};
    for (const key in data) {
      res[key] = convertTimestampsToISO(data[key]);
    }
    return res;
  }
  return data;
}

export async function getTasksFromFirestoreAction(): Promise<Task[]> {
  try {
    const tasksCollectionRef = collection(db, 'tasks');
    const q = query(tasksCollectionRef, orderBy('createdAt', 'desc')); // Or sort by another relevant field
    const querySnapshot = await getDocs(q);
    const tasks: Task[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const taskWithId = {
        ...data,
        id: docSnap.id, // Ensure Firestore document ID is part of the task object
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        resolvedAt: data.resolvedAt instanceof Timestamp ? data.resolvedAt.toDate().toISOString() : data.resolvedAt,
        history: (data.history || []).map((entry: any) => ({
          ...entry,
          timestamp: entry.timestamp instanceof Timestamp ? entry.timestamp.toDate().toISOString() : entry.timestamp,
        })),
      } as Task;
      tasks.push(convertTimestampsToISO(taskWithId) as Task);
    });
    console.log(`getTasksFromFirestoreAction: Fetched ${tasks.length} tasks.`);
    return tasks;
  } catch (error) {
    console.error('getTasksFromFirestoreAction: Error fetching tasks:', error);
    return [];
  }
}

export async function updateTaskInFirestoreAction(
  taskId: string,
  updates: Partial<Omit<Task, 'id' | 'history' | 'createdAt'>>, // Exclude fields managed by action
  changeDetails: TaskHistoryChangeDetail[],
  userId: string,
  userName: string
): Promise<{ success: boolean; error?: string; updatedTask?: Task }> {
  if (!taskId) {
    return { success: false, error: 'Task ID is required.' };
  }
  try {
    const taskDocRef = doc(db, 'tasks', taskId);
    const taskSnap = await getDoc(taskDocRef);

    if (!taskSnap.exists()) {
      return { success: false, error: `Task with ID ${taskId} not found.` };
    }

    const existingTaskData = taskSnap.data() as Task;
    const existingHistory = (existingTaskData.history || []) as TaskHistoryEntry[];

    const newHistoryEntry: TaskHistoryEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      userId,
      userName,
      changes: changeDetails,
    };

    const updatedHistory = [...existingHistory, newHistoryEntry];
    const finalUpdates: Partial<Task> = {
      ...updates,
      history: updatedHistory,
      // resolvedAt might be set in 'updates' if resolutionStatus changes
    };

    // Handle specific logic for resolvedAt based on resolutionStatus change
    if (updates.resolutionStatus && updates.resolutionStatus !== existingTaskData.resolutionStatus) {
        if (['Resuelto', 'SFP'].includes(updates.resolutionStatus) && !updates.resolvedAt && !existingTaskData.resolvedAt) {
            finalUpdates.resolvedAt = new Date().toISOString();
        } else if (updates.resolutionStatus === 'Pendiente' && existingTaskData.resolvedAt) {
            finalUpdates.resolvedAt = null;
        }
    }


    await updateDoc(taskDocRef, finalUpdates);
    
    const updatedDocSnap = await getDoc(taskDocRef);
    const updatedTask = convertTimestampsToISO({ id: updatedDocSnap.id, ...updatedDocSnap.data() }) as Task;

    return { success: true, updatedTask };
  } catch (error: any) {
    console.error(`updateTaskInFirestoreAction: Error updating task ${taskId}:`, error);
    return { success: false, error: error.message || 'Failed to update task.' };
  }
}


// This action will be used for both migration and CSV upload.
export async function addOrUpdateTasksInFirestoreAction(
  tasksToProcess: Task[], // Tasks from CSV/localStorage, validated against TaskSchema but may not have Firestore IDs yet
  userId: string,
  userName: string,
  source: 'csv-upload' | 'migration' // To describe the source in history
): Promise<{ success: boolean; processedCount: number; error?: string; createdCount: number; updatedCount: number }> {
  if (!tasksToProcess || tasksToProcess.length === 0) {
    return { success: true, processedCount: 0, createdCount: 0, updatedCount: 0 };
  }

  const batch = writeBatch(db);
  const tasksCollectionRef = collection(db, 'tasks');
  let processedCount = 0;
  let createdCount = 0;
  let updatedCount = 0;

  // Fetch existing taskReferences from Firestore to avoid N+1 reads in loop
  const existingTaskRefsFromDb = new Map<string, {id: string, data: Task}>();
  if (tasksToProcess.some(t => t.taskReference)) {
      const allCsvTaskRefs = tasksToProcess.filter(t => t.taskReference).map(t => t.taskReference);
      if (allCsvTaskRefs.length > 0) {
          // Firestore 'in' query limit is 30, so batch if necessary
          for (let i = 0; i < allCsvTaskRefs.length; i += 30) {
              const chunk = allCsvTaskRefs.slice(i, i + 30);
              const q = query(tasksCollectionRef, where('taskReference', 'in', chunk));
              const querySnapshot = await getDocs(q);
              querySnapshot.forEach(docSnap => {
                existingTaskRefsFromDb.set(docSnap.data().taskReference, {id: docSnap.id, data: docSnap.data() as Task});
              });
          }
      }
  }


  for (const incomingTask of tasksToProcess) {
    let docId = incomingTask.id; // CSV might provide an ID, or it's from localStorage migration
    let existingTaskData: Task | null = null;
    let operation: 'create' | 'update' = 'create';

    // Try to find existing task by taskReference if provided
    if (incomingTask.taskReference) {
        const foundByRef = existingTaskRefsFromDb.get(incomingTask.taskReference);
        if (foundByRef) {
            docId = foundByRef.id;
            existingTaskData = convertTimestampsToISO(foundByRef.data) as Task;
            operation = 'update';
        }
    }
    // If not found by taskReference, but an ID was provided (e.g. from previous Firestore save or migration)
    if (!existingTaskData && docId) {
        const taskDocRef = doc(db, 'tasks', docId);
        const docSnap = await getDoc(taskDocRef);
        if (docSnap.exists()) {
            existingTaskData = convertTimestampsToISO(docSnap.data()) as Task;
            operation = 'update';
        } else {
            // ID was provided but not found, could be an old ID, treat as create with this ID
            // or generate new one if this ID might conflict. For now, use it.
        }
    }
    
    // If still no docId, generate one for creation
    if (!docId) {
        docId = uuidv4();
    }
    
    const taskToSave: Task = {
        ...incomingTask, // incomingTask should be pre-validated by Zod on client
        id: docId, // Ensure the final ID is set
        createdAt: existingTaskData?.createdAt || incomingTask.createdAt || new Date().toISOString(), // Preserve original createdAt or set new
        history: existingTaskData?.history || incomingTask.history || [],
    };

    // History generation
    const changeDetails: TaskHistoryChangeDetail[] = [];
    if (operation === 'update' && existingTaskData) {
      (Object.keys(incomingTask) as Array<keyof Task>).forEach(key => {
        if (key === 'id' || key === 'history' || key === 'createdAt') return;
        const oldValue = existingTaskData![key];
        const newValue = incomingTask[key];
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changeDetails.push({ field: key, fieldLabel: key, oldValue, newValue });
        }
      });
    } else { // create
      changeDetails.push({
        field: 'taskCreation',
        fieldLabel: `Task Creation via ${source}`,
        oldValue: null,
        newValue: `Task Ref: ${taskToSave.taskReference || taskToSave.id}`,
      });
    }

    if (changeDetails.length > 0) {
      const historyEntry: TaskHistoryEntry = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        userId,
        userName,
        changes: changeDetails,
      };
      taskToSave.history = [...taskToSave.history!, historyEntry];
    }
    
    // Specific logic for resolvedAt based on resolutionStatus change
    if (taskToSave.resolutionStatus) {
        if (['Resuelto', 'SFP'].includes(taskToSave.resolutionStatus) && !taskToSave.resolvedAt) {
            taskToSave.resolvedAt = new Date().toISOString();
        } else if (taskToSave.resolutionStatus === 'Pendiente' && existingTaskData?.resolvedAt) {
            taskToSave.resolvedAt = null;
        }
    }


    const taskDocRef = doc(tasksCollectionRef, docId);
    batch.set(taskDocRef, taskToSave, { merge: true }); // Use merge:true to be safe
    
    processedCount++;
    if (operation === 'create') createdCount++;
    else updatedCount++;
  }

  try {
    await batch.commit();
    return { success: true, processedCount, createdCount, updatedCount };
  } catch (error: any) {
    console.error('addOrUpdateTasksInFirestoreAction: Error processing batch:', error);
    return { success: false, processedCount: 0, createdCount: 0, updatedCount: 0, error: error.message || `Failed to ${source === 'migration' ? 'migrate' : 'upload'} tasks.` };
  }
}
