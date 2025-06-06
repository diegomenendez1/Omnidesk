"use client";



import { useState, useTransition, type ChangeEvent, type KeyboardEvent, useEffect, useMemo, useCallback, useRef } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, addDoc, FieldValue, serverTimestamp } from 'firebase/firestore';
import type { Task, TaskStatus, TaskResolutionStatus, TaskHistoryEntry, TaskHistoryChangeDetail } from '@/types';
import { PROTECTED_RESOLUTION_STATUSES, TaskSchema } from '@/types';
import { performDataValidation } from '@/app/table/actions'; // Assuming this action remains for AI validation
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { DataValidationReport } from './data-validation-report';
import { TaskHistoryDialog } from './task-history-dialog';
import type { ValidateDataConsistencyOutput } from '@/types';
import { ScanSearch, ArrowUp, ArrowDown, Filter as FilterIcon, History as HistoryIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, calculateBusinessDays } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import { auth } from '@/lib/firebase'; // Firebase Auth for current user
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/firebase'; // Import Firestore instance
import { logTaskHistory } from '@/lib/firestore'; // Import logTaskHistory function

const resolutionStatusOptions: TaskResolutionStatus[] = ["Pendiente", "SFP", "Resuelto"];
const statusOptions: TaskStatus[] = ["Missing Estimated Dates", "Missing POD", "Pending to Invoice Out of Time"];

const ALL_FILTER_VALUE = "_ALL_VALUES_";

type SortDirection = 'ascending' | 'descending';
interface SortConfig {
  key: keyof Task | 'accumulatedBusinessDays' | null;
  direction: SortDirection | null;
}

interface InteractiveTableClientProps {
  initialData: Task[];
}


export function InteractiveTableClient({ }: InteractiveTableClientProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const tasksRef = useRef<Task[]>([]);
  const [validationResult, setValidationResult] = useState<ValidateDataConsistencyOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [editingCellKey, setEditingCellKey] = useState<string | null>(null);
  const [currentEditText, setCurrentEditText] = useState<string>("");
  const [currentEditSelectValue, setCurrentEditSelectValue] = useState<TaskResolutionStatus | TaskStatus | ''>('');
  const [isSelectDropdownOpen, setIsSelectDropdownOpen] = useState(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<Partial<Record<keyof Task, string | undefined>>>({});
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });

  // Keep a ref to the latest tasks for cleanup purposes
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // Fetch tasks and their history from Firestore
  useEffect(() => {
    const tasksCollectionRef = collection(db, 'tasks');
    const q = query(tasksCollectionRef);

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log("InteractiveTable: Firestore snapshot received.");
      const tasksDataPromises = snapshot.docs.map(async docSnapshot => {
        const task = {
          id: docSnapshot.id,
          ...docSnapshot.data() as Task
        };

        // Fetch history subcollection for each task
        const historyCollectionRef = collection(docSnapshot.ref, 'history');
        const historyUnsubscribe = onSnapshot(historyCollectionRef, (historySnap) => {
          const historyData: TaskHistoryEntry[] = historySnap.docs.map(histDoc => ({
            id: histDoc.id,
            ...histDoc.data() as TaskHistoryEntry // Ensure TaskHistoryEntry type
          }));
          // Update the specific task's history in the tasks state
          setTasks(currentTasks => currentTasks.map(t =>
            t.id === task.id ? { ...t, history: historyData.sort((a, b) => new Date(a.timestamp as any).getTime() - new Date(b.timestamp as any).getTime()) } : t
          ));
        }, (historyErr) => {
          console.error(`InteractiveTable: Error fetching history for task ${task.id}:`, historyErr);
          // Handle history fetching error if necessary
        });

        // Store the history unsubscribe function to clean up later
        (task as any)._historyUnsubscribe = historyUnsubscribe;

        return task;
      });

      const fetchedTasks = await Promise.all(tasksDataPromises);

      setTasks(currentTasks => {
        // Clean up old history listeners for tasks that are no longer in the snapshot
        currentTasks.forEach(oldTask => {
          if (!fetchedTasks.find(newTask => newTask.id === oldTask.id) && (oldTask as any)._historyUnsubscribe) {
            (oldTask as any)._historyUnsubscribe();
          }
        });
         // Merge newly fetched tasks, keeping existing history listeners
        const newTasksMap = new Map(fetchedTasks.map(task => [task.id, task]));
        return currentTasks
            .filter(task => newTasksMap.has(task.id)) // Keep only tasks still in the snapshot
            .map(task => { // Update existing tasks
                const updatedTask = newTasksMap.get(task.id)!;
                // Keep the old history listener if it exists, otherwise add the new one
                return { ...updatedTask, history: task.history, _historyUnsubscribe: task._historyUnsubscribe || updatedTask._historyUnsubscribe };
            });
      });

      setLoading(false);
    }, (err) => {
      console.error("InteractiveTable: Error fetching tasks from Firestore:", err);
      setError("Failed to load tasks."); // User-friendly error message
      setLoading(false);
    });


    // Cleanup the main listener and all history listeners when the component unmounts
    return () => {
      unsubscribe();
      tasksRef.current.forEach(task => {
        if ((task as any)._historyUnsubscribe) {
           (task as any)._historyUnsubscribe();
        }
      });
    };
  }, []); // Empty dependency array ensures this runs only once on mount


  const getFieldLabel = (fieldKey: keyof Task | string): string => {
    const keyMap: Record<string, string> = {
      'comments': 'interactiveTable.tableHeaders.comments',
      'resolutionAdmin': 'interactiveTable.tableHeaders.admin',
      'resolutionStatus': 'interactiveTable.tableHeaders.actions',
      'status': 'interactiveTable.tableHeaders.toStatus',
      'taskReference': 'interactiveTable.tableHeaders.toRef',
      'delayDays': 'interactiveTable.tableHeaders.delayDays',
      'customerAccount': 'interactiveTable.tableHeaders.customerAccount',
      'netAmount': 'interactiveTable.tableHeaders.amount',
      'transportMode': 'interactiveTable.tableHeaders.transportMode',
      'assignee': 'interactiveTable.tableHeaders.logisticDeveloper',
      'resolutionTimeDays': 'interactiveTable.tableHeaders.resolutionTimeDays',
      'createdAt': 'uploadData.systemColumns.createdAt',
      'resolvedAt': 'uploadData.systemColumns.resolvedAt',
      // Add other specific fields if needed
    };
    // Try to translate if it's a known key, otherwise return the fieldKey itself
    const translation = t(keyMap[fieldKey] || `history.fields.${fieldKey}`);
    // Check if translation is the same as the key path, meaning it wasn't found
    if (translation === `history.fields.${fieldKey}` && keyMap[fieldKey]) {
         return t(keyMap[fieldKey]); // Fallback to getting the translation from the key map
    }
    return translation === `history.fields.${fieldKey}` ? fieldKey : translation;
  };

  const logChangeHistory = useCallback(async (taskId: string, action: 'created' | 'updated' | 'deleted', changes: TaskHistoryChangeDetail[] = []) => {
    const user = auth.currentUser; // Fetch user inside the callback
    if (!taskId) {
      console.error("Cannot log history without a task ID.");
      return;
    }
    try {
      await logTaskHistory(
        taskId,
        user?.uid || 'system_change',
        user?.name || user?.email || 'System Change',
        action,
        changes
      );
    } catch (error) {
      console.error(`Failed to log history entry for task ${taskId}:`, error);
      toast({
        title: t('interactiveTable.historyLogFailedTitle'),
        description: t('interactiveTable.historyLogFailedDescription'),
        variant: "destructive",
      });
    }
  }, [t]);


  const handleValidateData = () => {
    startTransition(async () => {
      try {
        // Use the current state of tasks from Firestore
        const tableDataString = JSON.stringify(tasks.map((task, index) => ({
          rowIndex: index + 1,
          ...task
        })));
        const result = await performDataValidation({ tableData: tableDataString });
        setValidationResult(result);
        toast({
          title: t('interactiveTable.validationComplete'),
          description: result.summary,
        });
      } catch (error) {
        console.error("Validation failed:", error);
        setValidationResult(null);
        toast({
          title: t('interactiveTable.validationFailed'),
          description: error instanceof Error ? error.message : t('interactiveTable.validationFailedDescription'),
          variant: "destructive",
        });
      }
    });
  };

  const startEdit = (task: Task, column: keyof Task) => {
    // Use task.id for cell key if available, fallback to taskReference if not
    const cellKey = `${task.id || task.taskReference || uuidv4()}-${String(column)}`;
    setEditingCellKey(cellKey);
    const value = task[column];

    if (column === 'comments' || column === 'resolutionAdmin') {
      setCurrentEditText(String(value || ""));
    } else if (column === 'resolutionStatus') {
      setCurrentEditSelectValue((value as TaskResolutionStatus) || resolutionStatusOptions[0]);
      setIsSelectDropdownOpen(true);
    }
  };

  const handleInlineTextChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCurrentEditText(event.target.value);
  };

  const saveInlineEdit = (taskIdOrRef: string, column: keyof Task) => {
    const taskToUpdate = tasks.find(t => t.id === taskIdOrRef || t.taskReference === taskIdOrRef);

    if (!taskToUpdate) {
      console.error("Task not found for update:", taskIdOrRef);
      toast({ title: t('interactiveTable.saveFailed'), description: t('interactiveTable.taskNotFound'), variant: "destructive" });
      setEditingCellKey(null);
      setCurrentEditText("");
      return;
    }

    if (!taskToUpdate.id) {
       console.error("Task found but without Firestore ID. Cannot save edit:", taskToUpdate);
       toast({ title: t('interactiveTable.saveFailed'), description: t('interactiveTable.taskWithoutId'), variant: "destructive" });
       setEditingCellKey(null);
       setCurrentEditText("");
       return;
    }

    const cellKey = `${taskToUpdate.id}-${String(column)}`;
     if (editingCellKey !== cellKey) {
        // This edit was triggered by a stale cellKey or parallel edit attempt
        console.warn("Ignoring stale edit attempt:", editingCellKey, cellKey);
        setEditingCellKey(null);
        setCurrentEditText("");
        return;
     }


    const oldValue = taskToUpdate[column];
    const newValue = currentEditText;

    // Check if value actually changed
    if (String(oldValue || "") === String(newValue || "")) {
      setEditingCellKey(null);
      setCurrentEditText("");
      return;
    }

    const updatedFields = {
      [column]: newValue
    };

    try {
      // Validate the specific field being updated using Zod
      // Note: For 'netAmount', the value from currentEditText would be a string.
      // If TaskSchema expects a number, parsing/coercion should happen here or within the schema.
      // For simplicity, assuming TaskSchema can handle string inputs for these fields.
      const partialTaskSchema = TaskSchema.partial().pick({ [column]: true });
      // Using parse will throw an error if validation fails
      partialTaskSchema.parse(updatedFields);

      const taskRef = doc(db, 'tasks', taskToUpdate.id);
      updateDoc(taskRef, updatedFields)
        .then(() => {
        console.log(`Task ${taskToUpdate.id} field ${String(column)} updated successfully.`);
        // Log history after successful update
        logChangeHistory(taskToUpdate.id!, 'updated', [{ field: String(column), fieldLabel: getFieldLabel(column), oldValue, newValue }]);
        toast({ title: t('interactiveTable.fieldUpdated'), description: t('interactiveTable.changeSavedFor', { field: getFieldLabel(column) }) });
      })
        .catch(error => {
        console.error("Error updating document:", error);
        toast({ title: t('interactiveTable.saveFailed'), description: t('interactiveTable.errorSavingChange'), variant: 'destructive' });
      })
        .finally(() => {
        setEditingCellKey(null);
        setCurrentEditText("");
      });
    } catch (validationError: any) {
      console.error("Zod validation failed for inline edit:", validationError);
      toast({
        title: t('interactiveTable.validationFailedTitle'),
        description: t('interactiveTable.validationErrorMessage', { error: validationError.message || 'Invalid data format.' }),
        variant: "destructive",
      });
      setEditingCellKey(null);
      setCurrentEditText("");
    }
  };

  const handleInlineSelectChange = (taskIdOrRef: string, column: keyof Task, value: string) => {
    const taskToUpdate = tasks.find(t => t.id === taskIdOrRef || t.taskReference === taskIdOrRef);

     if (!taskToUpdate) {
      console.error("Task not found for select update:", taskIdOrRef);
      toast({ title: t('interactiveTable.saveFailed'), description: t('interactiveTable.taskNotFound'), variant: "destructive" });
      setEditingCellKey(null);
      setCurrentEditSelectValue('');
      setIsSelectDropdownOpen(false);
      return;
    }

    if (!taskToUpdate.id) {
       console.error("Task found but without Firestore ID. Cannot save select change:", taskToUpdate);
       toast({ title: t('interactiveTable.saveFailed'), description: t('interactiveTable.taskWithoutId'), variant: "destructive" });
       setEditingCellKey(null);
       setCurrentEditSelectValue('');
       setIsSelectDropdownOpen(false);
       return;
    }

     const cellKey = `${taskToUpdate.id}-${String(column)}`;
     if (editingCellKey !== cellKey) {
        // This edit was triggered by a stale cellKey or parallel edit attempt
        console.warn("Ignoring stale select edit attempt:", editingCellKey, cellKey);
        setEditingCellKey(null);
        setCurrentEditSelectValue('');
        setIsSelectDropdownOpen(false);
        return;
     }


    const oldValue = taskToUpdate[column];
    const newValue = value;

    // Check if value actually changed
    if (String(oldValue || "") === String(newValue || "")) {
      setEditingCellKey(null);
      setCurrentEditSelectValue('');
      setIsSelectDropdownOpen(false);
      return;
    }

    const changesForHistory: TaskHistoryChangeDetail[] = [{
        field: String(column),
        fieldLabel: getFieldLabel(column),
        oldValue,
        newValue,
    }];

    const updateData: Partial<Task> = { [column]: newValue as any }; // Use any for now due to conditional types

    // Handle resolvedAt date update based on resolutionStatus
    if (column === 'resolutionStatus') {
        const oldResolvedAt = taskToUpdate.resolvedAt;
        if (PROTECTED_RESOLUTION_STATUSES.includes(newValue as TaskResolutionStatus)) {
            // Set resolvedAt only if it's changing to a protected status and not already set
            if (!taskToUpdate.resolvedAt) {
                updateData.resolvedAt = new Date().toISOString(); // Or use serverTimestamp() if needed
                changesForHistory.push({
                    field: 'resolvedAt',
                    fieldLabel: getFieldLabel('resolvedAt'),
                    oldValue: oldResolvedAt,
                    newValue: updateData.resolvedAt,
                });
            }
        } else if (newValue === 'Pendiente' && taskToUpdate.resolvedAt) {
            // Clear resolvedAt if changing back to Pendiente and resolvedAt was set
            updateData.resolvedAt = null;
             changesForHistory.push({
                  field: 'resolvedAt',
                  fieldLabel: getFieldLabel('resolvedAt'),
                  oldValue: oldResolvedAt,
                  newValue: null,
              });
        }
    }

    const taskRef = doc(db, 'tasks', taskToUpdate.id);
    updateDoc(taskRef, updateData)
      .then(() => {
        console.log(`Task ${taskToUpdate.id} field ${String(column)} updated successfully.`);
         // Log history after successful update
        logChangeHistory(taskToUpdate.id!, 'updated', changesForHistory);
        toast({ title: t('interactiveTable.fieldUpdated'), description: t('interactiveTable.changeSavedFor', { field: getFieldLabel(column)}) });
      })
      .catch(error => {
        console.error("Error updating document:", error);
        toast({ title: t('interactiveTable.saveFailed'), description: t('interactiveTable.errorSavingChange'), variant: "destructive" });
      })
       .finally(() => {
         setEditingCellKey(null);
         setCurrentEditSelectValue('');
         setIsSelectDropdownOpen(false);
       });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, taskIdOrRef: string, column: keyof Task) => {
    if (event.key === 'Enter') {
      if (!event.shiftKey && event.currentTarget.tagName !== 'TEXTAREA') {
        event.preventDefault();
        saveInlineEdit(taskIdOrRef, column);
      }
    } else if (event.key === 'Escape') {
      setEditingCellKey(null);
      setCurrentEditText("");
      setCurrentEditSelectValue('');
      setIsSelectDropdownOpen(false);
    }
  };

   const deleteTask = (taskId: string) => {
     if (!taskId) {
        console.error("Cannot delete task without Firestore ID.");
        toast({ title: t('interactiveTable.deleteFailed'), description: t('interactiveTable.taskWithoutId'), variant: "destructive" });
        return;
     }

     const taskRef = doc(db, 'tasks', taskId);
     deleteDoc(taskRef)
       .then(() => {
         console.log(`Task ${taskId} deleted successfully.`);
         // History logging for deletion might need a separate trigger or be handled server-side
         // if you want to log it after the document is gone. Or log before deletion attempt.
         logChangeHistory(taskId, 'deleted'); // Log deletion attempt
         toast({ title: t('interactiveTable.taskDeleted'), description: t('interactiveTable.taskDeletedSuccessfully') });
       })
       .catch(error => {
         console.error("Error deleting document:", error);
         toast({ title: t('interactiveTable.deleteFailed'), description: t('interactiveTable.errorDeletingTask'), variant: "destructive" });
       });
   };


  const getStatusDisplay = (statusValue?: TaskStatus) => {
    if (!statusValue) return t('interactiveTable.notAvailable');
    const keyMap: Record<TaskStatus, string> = {
      "Missing Estimated Dates": "interactiveTable.status.missingEstimates",
      "Missing POD": "interactiveTable.status.missingPOD",
      "Pending to Invoice Out of Time": "interactiveTable.status.pendingInvoice",
    };
    return t(keyMap[statusValue] as any);
  };

  const getResolutionStatusDisplay = (statusValue?: TaskResolutionStatus) => {
    if (!statusValue) return t('interactiveTable.resolutionStatus.pendiente');
    const keyMap: Record<TaskResolutionStatus, string> = {
      "Pendiente": "interactiveTable.resolutionStatus.pendiente",
      "SFP": "interactiveTable.resolutionStatus.sfp",
      "Resuelto": "interactiveTable.resolutionStatus.resuelto",
    };
    return t(keyMap[statusValue] as any);
  };

  const handleFilterChange = (columnKey: keyof Task, value: string) => {
    setFilters(prev => ({
      ...prev,
      [columnKey]: value === ALL_FILTER_VALUE ? undefined : value,
    }));
  };

  const getUniqueValuesForColumn = (columnKey: keyof Task): string[] => {
    const values = new Set<string>();
    tasks.forEach(task => {
      const val = task[columnKey];
      let stringVal = (val === null || val === undefined)
                        ? t('interactiveTable.notAvailable')
                        : String(val);

      if (columnKey === 'resolvedAt' && val) {
        try {
             // Handle potential Firestore Timestamp objects
            if (typeof val === 'object' && val !== null && 'seconds' in val) {
                 stringVal = new Date((val as any).seconds * 1000).toLocaleDateString();
            } else {
                 stringVal = new Date(val as string).toLocaleDateString();
            }
        } catch {
            // keep original stringVal if date parsing fails
        }
      }

      if (stringVal.trim() !== "" || stringVal === t('interactiveTable.notAvailable')) {
        values.add(stringVal);
      }
    });
    return Array.from(values).sort((a, b) => {
        if (a === t('interactiveTable.notAvailable')) return 1;
        if (b === t('interactiveTable.notAvailable')) return -1;
        if (!isNaN(parseFloat(a)) && !isNaN(parseFloat(b))) {
            return parseFloat(a) - parseFloat(b);
        }
        return a.localeCompare(b, undefined, { sensitivity: 'base' });
    });
  };

  const uniqueTaskReferences = useMemo(() => getUniqueValuesForColumn('taskReference'), [tasks, t]);
  const uniqueAssignees = useMemo(() => getUniqueValuesForColumn('assignee'), [tasks, t]);
  const uniqueCustomerAccounts = useMemo(() => getUniqueValuesForColumn('customerAccount'), [tasks, t]);
  const uniqueNetAmounts = useMemo(() => {
    const numericValues = new Set<string>();
    tasks.forEach(task => {
        if (task.netAmount !== null && task.netAmount !== undefined) {
            numericValues.add(String(task.netAmount));
        } else {
             numericValues.add(t('interactiveTable.notAvailable'));
        }
    });
    return Array.from(numericValues).sort((a,b) => {
        if (a === t('interactiveTable.notAvailable')) return 1;
        if (b === t('interactiveTable.notAvailable')) return -1;
        return parseFloat(a) - parseFloat(b);
    });
  }, [tasks, t]);
  const uniqueTransportModes = useMemo(() => getUniqueValuesForColumn('transportMode'), [tasks, t]);
  const uniqueResolutionAdmins = useMemo(() => getUniqueValuesForColumn('resolutionAdmin'), [tasks, t]);
  const uniqueResolutionTimeDays = useMemo(() => getUniqueValuesForColumn('resolutionTimeDays'), [tasks, t]);
  const uniqueResolvedAtDates = useMemo(() => getUniqueValuesForColumn('resolvedAt'), [tasks, t]);


  const filteredTasks = useMemo(() => tasks.filter(task => {
    return Object.entries(filters).every(([columnKeyStr, filterValue]) => {
      const columnKey = columnKeyStr as keyof Task;
      if (filterValue === undefined || filterValue === ALL_FILTER_VALUE) return true;

      const taskValue = task[columnKey];
      let taskValueString: string;

      if (taskValue === null || taskValue === undefined) {
        taskValueString = t('interactiveTable.notAvailable');
      } else if (columnKey === 'resolvedAt' && taskValue) {
         try {
             if (typeof taskValue === 'object' && taskValue !== null && 'seconds' in taskValue) {
                 taskValueString = new Date((taskValue as any).seconds * 1000).toLocaleDateString();
             } else {
                taskValueString = new Date(taskValue as string).toLocaleDateString();
             }
        } catch {
            taskValueString = String(taskValue);
        }
      } else {
        taskValueString = String(taskValue);
      }

      if (columnKey === 'comments') {
        return taskValueString.toLowerCase().includes(String(filterValue).toLowerCase());
      }
      return taskValueString === filterValue;
    });
  }), [tasks, filters, t]);

  const calculateAccumulatedBusinessDaysForTask = (task: Task): number | null => {
      // Use resolvedAt if the task is resolved, otherwise use the current date
      const endDate = (task.resolutionStatus && PROTECTED_RESOLUTION_STATUSES.includes(task.resolutionStatus) && task.resolvedAt)
         ? (typeof task.resolvedAt === 'object' && task.resolvedAt !== null && 'seconds' in task.resolvedAt ? new Date((task.resolvedAt as any).seconds * 1000) : new Date(task.resolvedAt as string))
         : new Date();


      if (task.createdAt) {
          try {
            const startDate = typeof task.createdAt === 'object' && task.createdAt !== null && 'seconds' in task.createdAt ? new Date((task.createdAt as any).seconds * 1000) : new Date(task.createdAt as string);

            if (isNaN(startDate.getTime())) return task.delayDays ?? null; // Invalid createdAt
            // Calculate business days until resolved date (if resolved) or until today (if pending)
             if (endDate < startDate) return 0; // Handle cases where resolvedAt is before createdAt
            return calculateBusinessDays(startDate, endDate);
          } catch (e) {
            console.error("Error calculating business days for task:", task.id, e);
            return null;
          }
      }
       // If createdAt is missing, use the existing delayDays if available
      return task.delayDays ?? null;
  };


  const requestSort = (key: keyof Task | 'accumulatedBusinessDays') => {
    let newDirection: SortDirection = 'ascending';
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'ascending') {
        newDirection = 'descending';
      }
    }
    setSortConfig({ key, direction: newDirection });
  };

  const sortedTasks = useMemo(() => {
    let sortableItems = [...filteredTasks];
    if (sortConfig.key !== null && sortConfig.direction !== null) {
      sortableItems.sort((a, b) => {
        if (!sortConfig.key) return 0;
        const key = sortConfig.key;

        let valA, valB;

        if (key === 'accumulatedBusinessDays') {
            valA = calculateAccumulatedBusinessDaysForTask(a);
            valB = calculateAccumulatedBusinessDaysForTask(b);
        } else if (key === 'createdAt' || key === 'resolvedAt') {
            // Handle Firestore Timestamp objects for sorting dates
            const dateA = a[key];
            const dateB = b[key];
             valA = dateA ? (typeof dateA === 'object' && dateA !== null && 'seconds' in dateA ? (dateA as any).seconds * 1000 : new Date(dateA as string).getTime()) : null;
            valB = dateB ? (typeof dateB === 'object' && dateB !== null && 'seconds' in dateB ? (dateB as any).seconds * 1000 : new Date(dateB as string).getTime()) : null;

            if (valA && isNaN(valA)) valA = null;
            if (valB && isNaN(valB)) valB = null;
        } else {
            valA = a[key as keyof Task];
            valB = b[key as keyof Task];
        }


        if ((valA === null || typeof valA === 'undefined') && (valB !== null && typeof valB !== 'undefined')) return sortConfig.direction === 'ascending' ? 1 : -1;
        if ((valB === null || typeof valB === 'undefined') && (valA !== null && typeof valA !== 'undefined')) return sortConfig.direction === 'ascending' ? -1 : 1;
        if ((valA === null || typeof valA === 'undefined') && (valB === null || typeof valB === 'undefined')) return 0;

        let comparison = 0;
        if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        } else {
          comparison = String(valA).toLowerCase().localeCompare(String(valB).toLowerCase());
        }

        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    return sortableItems;
  }, [filteredTasks, sortConfig, calculateAccumulatedBusinessDaysForTask]);

  const allOptionLabel = t('interactiveTable.filterAllOption');
  const filterActionPlaceholder = t('interactiveTable.filterActionPlaceholder');

  const renderSortIcon = (columnKey: keyof Task | 'accumulatedBusinessDays') => {
    if (sortConfig.key === columnKey) {
      return sortConfig.direction === 'ascending'
        ? <ArrowUp className="ml-1 h-3 w-3 text-muted-foreground" />
        : <ArrowDown className="ml-1 h-3 w-3 text-muted-foreground" />;
    }
    return <span className="ml-1 h-3 w-3"></span>;
  };

  const renderFilterPopover = (columnKey: keyof Task, columnLabelKey: string, uniqueValues: string[], isNumeric: boolean = false) => {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-60 hover:opacity-100 data-[state=open]:opacity-100 data-[state=open]:bg-accent">
            <FilterIcon className="h-4 w-4" />
            <span className="sr-only">{t('interactiveTable.filterBy', {columnName: t(columnLabelKey as any)})}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-2" align="start">
          <Select
            value={filters[columnKey] || ALL_FILTER_VALUE}
            onValueChange={(value) => handleFilterChange(columnKey, value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder={filterActionPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>{allOptionLabel}</SelectItem>
              {uniqueValues.map(opt => (
                <SelectItem key={opt} value={opt}>
                  {columnKey === 'netAmount' ? formatCurrency(opt === t('interactiveTable.notAvailable') ? null : parseFloat(opt)) : opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PopoverContent>
      </Popover>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4 w-full text-center py-10">
        <p>{t('interactiveTable.loadingData')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 w-full text-center py-10 text-red-500">
        <p>{error}</p>
      </div>
    );
  }


  return (
    <div className="w-full text-center py-10">
      Interactive table placeholder ({initialData.length} tasks).
    </div>
  );
}
