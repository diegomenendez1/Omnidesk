
"use client";

import { useState, useTransition } from 'react';
import type { Task, TaskResolutionStatus, TaskHistoryEntry, TaskHistoryChangeDetail } from '@/types'; 
import { TaskSchema, PROTECTED_RESOLUTION_STATUSES } from '@/types'; 
import { FileUploader } from '@/components/upload/file-uploader';
import { ColumnMapper } from '@/components/upload/column-mapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getMappingSuggestions } from './actions';
import type { SuggestCsvMappingOutput, SystemColumn } from './actions';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context'; // Import useAuth
import type { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

type UploadStep = "upload" | "map" | "confirm" | "done";

const PREFERRED_CSV_TO_SYSTEM_MAP: Record<string, string> = {
  "transport order ref.": "taskReference",
  "to ref.": "taskReference",
  "days pending for first invoice": "delayDays",
  "dias de atraso": "delayDays",
  "invoice on-time status": "status",
  "to status": "status",
  "customer account": "customerAccount",
  "customer acc.": "customerAccount",
  "total net amount main currency": "netAmount",
  "monto $": "netAmount",
  "operations executive": "assignee",
  "desarrollador logístico": "assignee",
  "transport mode": "transportMode",
  "comentarios": "comments",
  "administrador": "resolutionAdmin",
  "estado de resolución": "resolutionStatus",
  "tiempo resolución (días)": "resolutionTimeDays",
  "fecha de creación": "createdAt", // New
  "creation date": "createdAt", // New
  "fecha de resolución": "resolvedAt", // New
  "resolution date": "resolvedAt", // New
};

// Helper function to generate a unique ID for tasks missing one from CSV
const generateTemporaryId = (taskRef?: string, index?: number): string => {
  const randomPart = Math.random().toString(36).substring(2, 9);
  if (taskRef) return `csv-${taskRef}-${randomPart}`;
  return `csv-temp-${Date.now()}-${index || 0}-${randomPart}`;
};


export default function UploadDataPage() {
  const [step, setStep] = useState<UploadStep>("upload");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [rawCsvRows, setRawCsvRows] = useState<string[][]>([]);

  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useLanguage();
  const { user: currentUser } = useAuth(); // Get current user

  const [showBackupDialog, setShowBackupDialog] = useState(false);

  const systemColumns: SystemColumn[] = [
    { name: 'taskReference', description: t('uploadData.systemColumns.taskReference'), required: true }, // taskReference is key
    { name: 'status', description: t('uploadData.systemColumns.status'), required: true },
    { name: 'assignee', description: t('uploadData.systemColumns.assignee') },
    { name: 'delayDays', description: t('uploadData.systemColumns.delayDays') },
    { name: 'customerAccount', description: t('uploadData.systemColumns.customerAccount') },
    { name: 'netAmount', description: t('uploadData.systemColumns.netAmount') },
    { name: 'transportMode', description: t('uploadData.systemColumns.transportMode') },
    { name: 'comments', description: t('uploadData.systemColumns.comments') },
    { name: 'resolutionAdmin', description: t('uploadData.systemColumns.resolutionAdmin') },
    { name: 'resolutionStatus', description: t('uploadData.systemColumns.resolutionStatus') },
    { name: 'resolutionTimeDays', description: t('uploadData.systemColumns.resolutionTimeDays') },
    { name: 'createdAt', description: t('uploadData.systemColumns.createdAt') },
    { name: 'resolvedAt', description: t('uploadData.systemColumns.resolvedAt') },
    // `id` and `name` are handled internally or less commonly mapped.
    // `history` is not mapped from CSV.
  ];

  const [suggestedMappings, setSuggestedMappings] = useState<SuggestCsvMappingOutput['suggestedMappings']>([]);
  const [userMappings, setUserMappings] = useState<Record<string, string | null>>({});
  const [processedTasksForPreview, setProcessedTasksForPreview] = useState<Task[]>([]);

  const getFieldLabel = (fieldKey: string): string => {
    const systemCol = systemColumns.find(sc => sc.name === fieldKey);
    if (systemCol) {
      return t(systemCol.description as any) || systemCol.description;
    }
    // Fallback for keys not in systemColumns (e.g., custom CSV keys if not mapped)
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
    };
    return t(keyMap[fieldKey] || fieldKey);
  };

  const handleFileAccepted = (file: File, headers: string[], previewRows: string[][], allRows: string[][]) => {
    setCsvFile(file);
    setCsvHeaders(headers);
    setRawCsvRows(allRows);

    startTransition(async () => {
      const initialUserMappings: Record<string, string | null> = {};
      const headersForAI: string[] = [];

      headers.forEach(header => {
        const lowerHeader = header.toLowerCase();
        let mappedSystemColumn: string | null = null;

        if (PREFERRED_CSV_TO_SYSTEM_MAP[lowerHeader]) {
          mappedSystemColumn = PREFERRED_CSV_TO_SYSTEM_MAP[lowerHeader];
        } else {
          const directDescMatch = systemColumns.find(
            sc => (t(sc.description as any) || sc.description).toLowerCase() === lowerHeader
          );
          if (directDescMatch) {
            mappedSystemColumn = directDescMatch.name;
          }
        }

        if (mappedSystemColumn) {
          initialUserMappings[header] = mappedSystemColumn;
        } else {
          initialUserMappings[header] = null;
          headersForAI.push(header);
        }
      });

      let aiSuggestionsOutput: SuggestCsvMappingOutput | null = null;
      if (headersForAI.length > 0) {
        try {
          const systemColsForAI = systemColumns.map(sc => ({ ...sc, description: t(sc.description as any) || sc.description }));
          aiSuggestionsOutput = await getMappingSuggestions(headersForAI, systemColsForAI);

          aiSuggestionsOutput.suggestedMappings.forEach(aiMap => {
            if (initialUserMappings.hasOwnProperty(aiMap.csvColumn) && initialUserMappings[aiMap.csvColumn] === null && aiMap.systemColumn !== null) {
              initialUserMappings[aiMap.csvColumn] = aiMap.systemColumn;
            }
          });
        } catch (error) {
          toast({
            title: t('uploadData.aiErrorToastTitle'),
            description: t('uploadData.aiErrorToastDescription'),
            variant: "destructive",
          });
        }
      }

      setUserMappings(initialUserMappings);

      const finalSuggestedMappingsForColumnMapper = headers.map(header => {
        const systemColName = initialUserMappings[header];
        let confidence = 0;
        if (systemColName) {
          const lowerHeader = header.toLowerCase();
          if (PREFERRED_CSV_TO_SYSTEM_MAP[lowerHeader] === systemColName) {
            confidence = 0.99;
          } else if (systemColumns.find(sc => (t(sc.description as any) || sc.description).toLowerCase() === lowerHeader && sc.name === systemColName)) {
            confidence = 0.95;
          } else {
            const aiSuggestionForThisHeader = aiSuggestionsOutput?.suggestedMappings.find(s => s.csvColumn === header && s.systemColumn === systemColName);
            confidence = aiSuggestionForThisHeader?.confidence || (systemColName ? 0.7 : 0);
          }
        }
        return { csvColumn: header, systemColumn: systemColName, confidence };
      });
      setSuggestedMappings(finalSuggestedMappingsForColumnMapper);

      setStep("map");
      toast({ title: t('uploadData.fileAcceptedToastTitle'), description: t('uploadData.fileAcceptedToastDescription') });
    });
  };

  const handleMappingUpdate = (csvCol: string, systemCol: string | null) => {
    setUserMappings(prev => ({ ...prev, [csvCol]: systemCol }));
  };
  
  const downloadJSON = (data: string, filename: string) => {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const actuallyProcessAndSaveData = () => {
    startTransition(() => {
      if (rawCsvRows.length === 0 || csvHeaders.length === 0) {
        toast({ title: t('uploadData.noDataToProcess'), variant: "destructive" });
        return;
      }

      const existingTasks: Task[] = JSON.parse(localStorage.getItem('uploadedTasks') || '[]') as Task[];
      const taskMap = new Map<string, Task>();
      existingTasks.forEach(task => {
        if (task.taskReference) {
          taskMap.set(task.taskReference, { ...task, history: task.history || [] }); // Ensure history array
        } else if (task.id) { 
          taskMap.set(task.id, { ...task, history: task.history || [] }); 
        }
      });
      
      const newCsvTaskInputs: Record<string, any>[] = [];
      const uniqueCsvRowsByRef = new Map<string, any>();

      rawCsvRows.forEach((row, rowIndex) => {
        const constructedTaskInput: any = {};
        let taskRefFromCsv: string | undefined = undefined;

        csvHeaders.forEach((header, colIndex) => {
          const systemColName = userMappings[header];
          if (systemColName) {
            let value = row[colIndex]?.trim();
             if (systemColName === 'taskReference' && value) {
              taskRefFromCsv = value;
            }
            if (systemColName === 'delayDays' || systemColName === 'netAmount' || systemColName === 'resolutionTimeDays') {
              constructedTaskInput[systemColName] = value && value !== "" && !isNaN(parseFloat(value)) ? parseFloat(value) : null;
            } else if (systemColName === 'createdAt' || systemColName === 'resolvedAt') {
              constructedTaskInput[systemColName] = (value && value !== "") ? new Date(value).toISOString() : undefined;
            } else if (value !== undefined && value !== "") {
              constructedTaskInput[systemColName] = value;
            } else if (value === "") { 
              constructedTaskInput[systemColName] = TaskSchema.shape[systemColName as keyof TaskSchema['shape']].isOptional() || TaskSchema.shape[systemColName as keyof TaskSchema['shape']].isNullable() ? null : undefined;
            }
          }
        });
        
        if (taskRefFromCsv) { 
           uniqueCsvRowsByRef.set(taskRefFromCsv, constructedTaskInput);
        }
      });
      
      newCsvTaskInputs.push(...Array.from(uniqueCsvRowsByRef.values()));

      const validationErrors: { rowIndexGlobal: number; csvTaskRef?: string; errors: z.ZodIssue[] }[] = [];
      let validNewOrUpdatedTasksCount = 0;

      newCsvTaskInputs.forEach((csvTaskInput, csvIndex) => {
        const taskRef = csvTaskInput.taskReference;
        if (!taskRef) { 
          console.warn("Skipping CSV row due to missing taskReference after pre-processing:", csvTaskInput);
          return;
        }

        const existingTask = taskMap.get(taskRef);
        
        if (csvTaskInput.status === undefined || csvTaskInput.status === "" || csvTaskInput.status === null) {
            csvTaskInput.status = "Missing Estimated Dates"; 
        }
        
        const taskDataForValidation = {
            ...csvTaskInput, 
            id: existingTask?.id || csvTaskInput.id, 
            createdAt: csvTaskInput.createdAt || existingTask?.createdAt || new Date().toISOString(),
            history: existingTask?.history || [], // Preserve existing history
        };

        if (csvTaskInput.resolvedAt) {
            taskDataForValidation.resolvedAt = csvTaskInput.resolvedAt;
        } else if (existingTask?.resolvedAt && existingTask.resolutionStatus && PROTECTED_RESOLUTION_STATUSES.includes(existingTask.resolutionStatus)) {
            taskDataForValidation.resolvedAt = existingTask.resolvedAt;
        }

        const validationAttempt = TaskSchema.safeParse(taskDataForValidation);

        if (!validationAttempt.success) {
          validationErrors.push({ 
            rowIndexGlobal: rawCsvRows.findIndex(r => r.includes(taskRef)) + 1 || csvIndex +1 , 
            csvTaskRef: taskRef, 
            errors: validationAttempt.error.issues 
          });
          return; 
        }

        let processedCsvTask = validationAttempt.data; 
        let newHistoryForThisTask: TaskHistoryEntry[] = existingTask?.history || [];
        const changesForHistory: TaskHistoryChangeDetail[] = [];

        if (existingTask) { 
          // Compare fields for history logging
          (Object.keys(processedCsvTask) as Array<keyof Task>).forEach(key => {
            if (key === 'id' || key === 'history' || key === 'createdAt') return; // Skip non-comparable or internally managed
            
            const oldValue = existingTask[key];
            const newValue = processedCsvTask[key];

            // Handle date string comparison carefully if resolvedAt is involved
            if (key === 'resolvedAt') {
                const oldDate = oldValue ? new Date(oldValue as string).toISOString() : null;
                const newDate = newValue ? new Date(newValue as string).toISOString() : null;
                if (oldDate !== newDate) {
                    changesForHistory.push({ field: key, fieldLabel: getFieldLabel(key), oldValue, newValue });
                }
            } else if (String(oldValue ?? "") !== String(newValue ?? "")) {
              changesForHistory.push({ field: key, fieldLabel: getFieldLabel(key), oldValue, newValue });
            }
          });
          
          let mergedTask: Task = { 
            ...existingTask, 
            ...processedCsvTask, 
            id: existingTask.id || processedCsvTask.id || generateTemporaryId(taskRef, csvIndex), 
            createdAt: existingTask.createdAt || processedCsvTask.createdAt, 
            // history will be updated below
          };

          if (existingTask.resolutionStatus && 
              PROTECTED_RESOLUTION_STATUSES.includes(existingTask.resolutionStatus as TaskResolutionStatus) &&
              processedCsvTask.resolutionStatus === 'Pendiente' && 
              !changesForHistory.find(c => c.field === 'resolutionStatus')) { // If CSV tries to revert a protected status without explicitly changing it in this CSV row
            mergedTask.resolutionStatus = existingTask.resolutionStatus;
            mergedTask.resolvedAt = existingTask.resolvedAt || processedCsvTask.resolvedAt; 
          } else if (mergedTask.resolutionStatus && PROTECTED_RESOLUTION_STATUSES.includes(mergedTask.resolutionStatus as TaskResolutionStatus) && !mergedTask.resolvedAt) {
            mergedTask.resolvedAt = new Date().toISOString();
            // Check if resolvedAt change was already captured, if not, add it
            if (!changesForHistory.some(c => c.field === 'resolvedAt')) {
                changesForHistory.push({ field: 'resolvedAt', fieldLabel: getFieldLabel('resolvedAt'), oldValue: existingTask.resolvedAt, newValue: mergedTask.resolvedAt });
            }
          }
          
          if (changesForHistory.length > 0) {
            newHistoryForThisTask.push({
              id: uuidv4(),
              timestamp: new Date().toISOString(),
              userId: currentUser?.uid || 'csv_upload',
              userName: currentUser?.name || currentUser?.email || 'CSV Upload',
              changes: changesForHistory,
            });
          }
          mergedTask.history = newHistoryForThisTask;
          taskMap.set(taskRef, mergedTask);

        } else { // New task from CSV
          processedCsvTask.id = processedCsvTask.id || generateTemporaryId(taskRef, csvIndex);
          if (processedCsvTask.resolutionStatus && PROTECTED_RESOLUTION_STATUSES.includes(processedCsvTask.resolutionStatus as TaskResolutionStatus) && !processedCsvTask.resolvedAt) {
             processedCsvTask.resolvedAt = new Date().toISOString();
          }
          // Log creation as a history event
          changesForHistory.push({
            field: 'taskCreation',
            fieldLabel: t('history.taskCreated'),
            oldValue: null,
            newValue: `Ref: ${taskRef}`,
          });
           newHistoryForThisTask.push({
              id: uuidv4(),
              timestamp: new Date().toISOString(),
              userId: currentUser?.uid || 'csv_upload',
              userName: currentUser?.name || currentUser?.email || 'CSV Upload',
              changes: changesForHistory,
            });
          processedCsvTask.history = newHistoryForThisTask;
          taskMap.set(taskRef, processedCsvTask);
        }
        validNewOrUpdatedTasksCount++;
      });
      
      existingTasks.forEach(existingTask => {
        if (existingTask.taskReference && 
            !uniqueCsvRowsByRef.has(existingTask.taskReference) && 
            existingTask.resolutionStatus && 
            PROTECTED_RESOLUTION_STATUSES.includes(existingTask.resolutionStatus as TaskResolutionStatus)) {
          if (!taskMap.has(existingTask.taskReference)) { 
            taskMap.set(existingTask.taskReference, { ...existingTask, history: existingTask.history || [] });
          }
        }
      });

      let finalTaskList = Array.from(taskMap.values());
      finalTaskList.sort((a, b) => (b.netAmount ?? -Infinity) - (a.netAmount ?? -Infinity));
      
      setProcessedTasksForPreview(finalTaskList.slice(0, 10));

      if (validationErrors.length > 0) {
        const errorMessages = validationErrors.slice(0, 5).map(err =>
          `Fila CSV (Ref: ${err.csvTaskRef || 'N/A'}, aprox. original ${err.rowIndexGlobal}): ${err.errors.map(e => `${t(`uploadData.systemColumns.${e.path.join('.')}` as any, e.path.join('.'))} - ${e.message}`).join('; ')}`
        ).join('\n');
        toast({
          title: t('uploadData.validationErrors.title', { count: validationErrors.length }),
          description: t('uploadData.validationErrors.description', {
            details: errorMessages,
            count: validationErrors.length,
            firstN: validationErrors.slice(0,5).length 
          }),
          variant: "destructive",
          duration: 20000,
        });
      }

      if (validNewOrUpdatedTasksCount > 0 || (finalTaskList.length > 0 && existingTasks.length !== finalTaskList.length) || finalTaskList.some((task, idx) => JSON.stringify(task) !== JSON.stringify(existingTasks.find(et => et.taskReference === task.taskReference)))) {
        try {
          localStorage.setItem('uploadedTasks', JSON.stringify(finalTaskList));
          toast({ 
            title: t('uploadData.dataProcessed'), 
            description: t('uploadData.tasksProcessedAndSavedWithSkipped', { savedCount: finalTaskList.length, skippedCount: validationErrors.length }) 
          });
          setStep("done");
        } catch (error) {
          console.error("Error saving tasks to localStorage:", error);
          toast({
            title: t('uploadData.errorSavingLocally'),
            description: t('uploadData.errorSavingLocallyDescription'),
            variant: "destructive",
          });
          setStep("done"); 
        }
      } else if (validationErrors.length > 0 && validNewOrUpdatedTasksCount === 0) {
         toast({
          title: t('uploadData.noValidTasksProcessed'),
          description: t('uploadData.allRowsInvalid'),
          variant: "destructive",
        });
        setStep("done");
      } else if (rawCsvRows.length === 0) {
         toast({ title: t('uploadData.noDataToProcess'), description: "The CSV file appears to be empty or had no data rows.", variant: "destructive" });
         setStep("upload");
      } else {
         toast({ title: t('uploadData.noEffectiveChanges'), description: t('uploadData.noEffectiveChangesDescription'), variant: "default" });
         setStep("done");
      }
    });
  };

  const handleBackupAndProceed = () => {
    const currentTasksJSON = localStorage.getItem('uploadedTasks');
    if (currentTasksJSON) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup-tasks-${timestamp}.json`;
      downloadJSON(currentTasksJSON, filename);
      toast({
        title: t('uploadData.backup.successTitle'),
        description: t('uploadData.backup.successDescription', { filename }),
      });
    }
    setShowBackupDialog(false);
    actuallyProcessAndSaveData();
  };

  const handleContinueWithoutBackup = () => {
    setShowBackupDialog(false);
    actuallyProcessAndSaveData();
  };

  const triggerProcessData = () => {
    const taskRefMapped = Object.values(userMappings).includes('taskReference');
    if (!taskRefMapped) {
      toast({
        title: t('uploadData.incompleteMapping'),
        description: t('uploadData.pleaseMapRequired', { columns: t('uploadData.systemColumns.taskReference') }),
        variant: "destructive"
      });
      return;
    }
    
    const existingData = localStorage.getItem('uploadedTasks');
    if (existingData && existingData.trim() !== "" && existingData.trim() !== "[]") {
        try {
            const parsedData = JSON.parse(existingData);
            if (Array.isArray(parsedData) && parsedData.length > 0) {
                 setShowBackupDialog(true);
                 return; 
            }
        } catch (e) {
            console.error("Error parsing existing localStorage data, proceeding without backup prompt:", e);
        }
    }
    actuallyProcessAndSaveData();
  };


  return (
    <div className="space-y-6 w-full">
      <Card>
        <CardHeader>
          <CardTitle>{t('uploadData.title')}</CardTitle>
          <CardDescription>{t('uploadData.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {step === "upload" && (
            <FileUploader onFileAccepted={handleFileAccepted} isProcessing={isPending} />
          )}

          {step === "map" && csvFile && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">{t('uploadData.columnMappingTitle')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('uploadData.columnMappingDescription', { fileName: csvFile.name })}
              </p>
              <ColumnMapper
                csvHeaders={csvHeaders}
                systemColumns={systemColumns.map(sc => ({ ...sc, description: t(sc.description as any) || sc.description }))}
                suggestedMappings={suggestedMappings}
                currentMappings={userMappings}
                onMappingChange={handleMappingUpdate}
              />
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => { setStep("upload"); setCsvFile(null); setProcessedTasksForPreview([]); }}>{t('uploadData.cancel')}</Button>
                <Button onClick={triggerProcessData} disabled={isPending}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                  {t('uploadData.confirmAndProcess')}
                </Button>
              </div>
            </div>
          )}

          {step === "done" && processedTasksForPreview.length > 0 && (
            <div className="space-y-4">
              <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-700">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <AlertTitle className="text-green-700 dark:text-green-300">{t('uploadData.dataProcessed')}</AlertTitle>
                <AlertDescription className="text-green-600 dark:text-green-400">
                  {t('uploadData.previewTitle')}
                </AlertDescription>
              </Alert>
              <h3 className="text-xl font-semibold">{t('uploadData.previewTitle')}</h3>
              <div className="max-h-96 overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {systemColumns
                        .filter(sc => processedTasksForPreview.length > 0 && processedTasksForPreview[0].hasOwnProperty(sc.name) && sc.name !== 'history') // Exclude history from preview columns
                        .map(col => (
                          <TableHead key={col.name}>{t(col.description as any) || col.description}</TableHead>
                      ))}
                       <TableHead>{t('uploadData.systemColumns.createdAt')}</TableHead>
                       <TableHead>{t('uploadData.systemColumns.resolvedAt')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedTasksForPreview.map((task, index) => (
                      <TableRow key={task.id || `processed-${index}`}>
                        {systemColumns
                          .filter(sc => processedTasksForPreview.length > 0 && processedTasksForPreview[0].hasOwnProperty(sc.name) && sc.name !== 'history')
                          .map(col => {
                            const value = task[col.name as keyof Task];
                            if (col.name === 'netAmount') {
                              return <TableCell key={col.name} className="text-right">{formatCurrency(value as number | null)}</TableCell>;
                            }
                            if (col.name === 'status') {
                              const keyMap: Record<Task['status'], string> = {
                                "Missing Estimated Dates": "interactiveTable.status.missingEstimates",
                                "Missing POD": "interactiveTable.status.missingPOD",
                                "Pending to Invoice Out of Time": "interactiveTable.status.pendingInvoice",
                              };
                              return <TableCell key={col.name}>{t(keyMap[value as Task['status']] as any)}</TableCell>;
                            }
                            if (col.name === 'resolutionStatus') {
                               if (value === undefined || value === null) return <TableCell key={col.name}>{t('interactiveTable.notAvailable')}</TableCell>;
                              const keyMap: Record<Exclude<Task['resolutionStatus'], undefined | null>, string> = {
                                "Pendiente": "interactiveTable.resolutionStatus.pendiente",
                                "SFP": "interactiveTable.resolutionStatus.sfp",
                                "Resuelto": "interactiveTable.resolutionStatus.resuelto",
                              };
                              return <TableCell key={col.name}>{t(keyMap[value as Exclude<Task['resolutionStatus'], undefined | null>] as any)}</TableCell>;
                            }
                            return <TableCell key={col.name}>{String(value === null || value === undefined ? t('interactiveTable.notAvailable') : value)}</TableCell>;
                        })}
                        <TableCell>{task.createdAt ? new Date(task.createdAt).toLocaleDateString() : t('interactiveTable.notAvailable')}</TableCell>
                        <TableCell>{task.resolvedAt ? new Date(task.resolvedAt).toLocaleDateString() : t('interactiveTable.notAvailable')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-between items-center mt-4">
                <Button onClick={() => router.push('/table')} variant="outline">
                    {t('uploadData.goToTableButton')}
                </Button>
                <Button onClick={() => { setStep("upload"); setCsvFile(null); setProcessedTasksForPreview([]); }}>
                    {t('uploadData.uploadAnotherFile')}
                </Button>
              </div>
            </div>
          )}
           {step === "done" && processedTasksForPreview.length === 0 && ( 
                <div className="space-y-4">
                    <Alert variant="destructive">
                        <AlertCircle className="h-5 w-5" />
                        <AlertTitle>{t('uploadData.noValidTasksProcessed')}</AlertTitle>
                        <AlertDescription>
                            {rawCsvRows.length > 0 ? t('uploadData.allRowsInvalid') : t('uploadData.noDataInFile')}
                        </AlertDescription>
                    </Alert>
                     <div className="flex justify-between items-center mt-4">
                        <Button onClick={() => router.push('/table')} variant="outline" disabled={!localStorage.getItem('uploadedTasks') || localStorage.getItem('uploadedTasks') === '[]'}>
                            {t('uploadData.goToTableButton')}
                        </Button>
                        <Button onClick={() => { setStep("upload"); setCsvFile(null); setProcessedTasksForPreview([]); }}>
                            {t('uploadData.uploadAnotherFile')}
                        </Button>
                    </div>
                </div>
            )}
        </CardContent>
      </Card>

      <AlertDialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('uploadData.backup.dialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('uploadData.backup.dialogDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowBackupDialog(false)}>{t('uploadData.cancel')}</AlertDialogCancel>
            <Button variant="outline" onClick={handleContinueWithoutBackup}>
              {t('uploadData.backup.continueWithoutBackupButton')}
            </Button>
            <AlertDialogAction onClick={handleBackupAndProceed}>
              {t('uploadData.backup.backupAndContinueButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
