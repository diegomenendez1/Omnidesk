
"use client";

import { useState, useTransition } from 'react';
import type { Task, TaskStatus, TaskResolutionStatus } from '@/types';
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

type UploadStep = "upload" | "map" | "confirm" | "done";

const validStatuses: TaskStatus[] = ["Missing Estimated Dates", "Missing POD", "Pending to Invoice Out of Time"];
const validResolutionStatuses: TaskResolutionStatus[] = ["Pendiente", "SFP", "Resuelto"];

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
  "tiempo resolución (días)": "resolutionTimeDays"
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

  const [showBackupDialog, setShowBackupDialog] = useState(false);

  const systemColumns: SystemColumn[] = [
    { name: 'status', description: t('uploadData.systemColumns.status'), required: true },
    { name: 'assignee', description: t('uploadData.systemColumns.assignee') },
    { name: 'taskReference', description: t('uploadData.systemColumns.taskReference') },
    { name: 'delayDays', description: t('uploadData.systemColumns.delayDays') },
    { name: 'customerAccount', description: t('uploadData.systemColumns.customerAccount') },
    { name: 'netAmount', description: t('uploadData.systemColumns.netAmount') },
    { name: 'transportMode', description: t('uploadData.systemColumns.transportMode') },
    { name: 'comments', description: t('uploadData.systemColumns.comments') },
    { name: 'resolutionAdmin', description: t('uploadData.systemColumns.resolutionAdmin') },
    { name: 'resolutionStatus', description: t('uploadData.systemColumns.resolutionStatus') },
    { name: 'resolutionTimeDays', description: t('uploadData.systemColumns.resolutionTimeDays') },
  ];

  const [suggestedMappings, setSuggestedMappings] = useState<SuggestCsvMappingOutput['suggestedMappings']>([]);
  const [userMappings, setUserMappings] = useState<Record<string, string | null>>({});
  const [processedTasks, setProcessedTasks] = useState<Task[]>([]);

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
      // Validation for required mappings is done in triggerProcessData before this.

      const tasks: Task[] = [];
      rawCsvRows.forEach((row, rowIndex) => {
        const taskObject: Partial<Task> = {};
        let idCandidate: string | undefined = undefined;

        csvHeaders.forEach((header, colIndex) => {
          const systemColName = userMappings[header];
          if (systemColName) {
            const value = row[colIndex]?.trim();

            if (systemColName === 'status') {
              taskObject.status = validStatuses.includes(value as TaskStatus) ? value as TaskStatus : "Missing Estimated Dates";
            } else if (systemColName === 'assignee') {
              taskObject.assignee = value || "";
            } else if (systemColName === 'taskReference') {
              taskObject.taskReference = value || "";
              if (!idCandidate && value) idCandidate = `csv-${value}-${rowIndex}`;
            } else if (systemColName === 'delayDays' || systemColName === 'netAmount' || systemColName === 'resolutionTimeDays') {
              taskObject[systemColName as 'delayDays' | 'netAmount' | 'resolutionTimeDays'] = value && !isNaN(parseFloat(value)) ? parseFloat(value) : null;
            } else if (systemColName === 'customerAccount' || systemColName === 'transportMode' || systemColName === 'comments' || systemColName === 'resolutionAdmin') {
              taskObject[systemColName as 'customerAccount' | 'transportMode' | 'comments' | 'resolutionAdmin'] = value || "";
            } else if (systemColName === 'resolutionStatus') {
              taskObject.resolutionStatus = validResolutionStatuses.includes(value as TaskResolutionStatus) ? value as TaskResolutionStatus : "Pendiente";
            }
            else if (systemColumns.some(sc => sc.name === systemColName)) {
              (taskObject as any)[systemColName] = value || null;
            }
          }
        });

        if (!taskObject.id && idCandidate) {
          taskObject.id = idCandidate;
        }
        if (!taskObject.id) {
          taskObject.id = `TEMP-CSV-${Date.now()}-${rowIndex}-${Math.random().toString(36).substring(2, 7)}`;
        }

        if (!taskObject.status) taskObject.status = "Missing Estimated Dates";
        if (taskObject.resolutionStatus === undefined && systemColumns.some(sc => sc.name === 'resolutionStatus')) {
           taskObject.resolutionStatus = "Pendiente";
        }


        tasks.push(taskObject as Task);
      });

      setProcessedTasks(tasks);

      try {
        localStorage.setItem('uploadedTasks', JSON.stringify(tasks));
        toast({ title: t('uploadData.dataProcessed'), description: t('uploadData.tasksProcessedAndSaved', { count: tasks.length }) });
        router.push('/table');
      } catch (error) {
        console.error("Error saving tasks to localStorage:", error);
        toast({
          title: t('uploadData.errorSavingLocally'),
          description: t('uploadData.errorSavingLocallyDescription'),
          variant: "destructive",
        });
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
    const requiredSystemCols = systemColumns.filter(sc => sc.required).map(sc => sc.name);
    const mappedSystemCols = Object.values(userMappings);
    const missingRequiredMappings = requiredSystemCols.filter(rc => !mappedSystemCols.includes(rc));

    if (missingRequiredMappings.length > 0) {
      const missingColumnDescriptions = missingRequiredMappings
        .map(colName => systemColumns.find(sc => sc.name === colName)?.description || colName)
        .map(descKey => t(descKey as any) || descKey)
        .join(', ');
      toast({
        title: t('uploadData.incompleteMapping'),
        description: t('uploadData.pleaseMapRequired', { columns: missingColumnDescriptions }),
        variant: "destructive"
      });
      return;
    }
    
    // Check if there's existing data to prompt for backup
    const existingData = localStorage.getItem('uploadedTasks');
    // Check if existingData is not null, not an empty string, and not an empty array string
    if (existingData && existingData.trim() !== "" && existingData.trim() !== "[]") {
        try {
            const parsedData = JSON.parse(existingData);
            if (Array.isArray(parsedData) && parsedData.length > 0) {
                 setShowBackupDialog(true);
                 return; // Wait for user action from dialog
            }
        } catch (e) {
            console.error("Error parsing existing localStorage data, proceeding without backup prompt:", e);
        }
    }
    // If no significant existing data, proceed directly
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
                <Button variant="outline" onClick={() => { setStep("upload"); setCsvFile(null); }}>{t('uploadData.cancel')}</Button>
                <Button onClick={triggerProcessData} disabled={isPending}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                  {t('uploadData.confirmAndProcess')}
                </Button>
              </div>
            </div>
          )}

          {step === "done" && processedTasks.length > 0 && (
            <div className="space-y-4">
              <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-700">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <AlertTitle className="text-green-700 dark:text-green-300">{t('uploadData.dataProcessed')}</AlertTitle>
                <AlertDescription className="text-green-600 dark:text-green-400">
                  {t('uploadData.tasksProcessedAndSaved', { count: processedTasks.length }).replace(t('uploadData.redirectingToTable'), '')}
                  {t('uploadData.previewTitle')}
                </AlertDescription>
              </Alert>
              <h3 className="text-xl font-semibold">{t('uploadData.previewTitle')}</h3>
              <div className="max-h-96 overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {systemColumns.filter(sc => Object.values(userMappings).includes(sc.name)).map(col => (
                        <TableHead key={col.name}>{t(col.description as any) || col.description}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedTasks.slice(0, 10).map((task, index) => (
                      <TableRow key={task.id || `processed-${index}`}>
                        {systemColumns.filter(sc => Object.values(userMappings).includes(sc.name)).map(col => {
                          const value = task[col.name as keyof Task];
                          if (col.name === 'netAmount') {
                            return <TableCell key={col.name} className="text-right">{formatCurrency(value as number | null)}</TableCell>;
                          }
                          if (col.name === 'status') {
                            const keyMap: Record<TaskStatus, string> = {
                              "Missing Estimated Dates": "interactiveTable.status.missingEstimates",
                              "Missing POD": "interactiveTable.status.missingPOD",
                              "Pending to Invoice Out of Time": "interactiveTable.status.pendingInvoice",
                            };
                            return <TableCell key={col.name}>{t(keyMap[value as TaskStatus] as any)}</TableCell>;
                          }
                          if (col.name === 'resolutionStatus') {
                            const keyMap: Record<TaskResolutionStatus, string> = {
                              "Pendiente": "interactiveTable.resolutionStatus.pendiente",
                              "SFP": "interactiveTable.resolutionStatus.sfp",
                              "Resuelto": "interactiveTable.resolutionStatus.resuelto",
                            };
                            return <TableCell key={col.name}>{t(keyMap[value as TaskResolutionStatus] as any)}</TableCell>;
                          }
                          return <TableCell key={col.name}>{String(value === null || value === undefined ? t('interactiveTable.notAvailable') : value)}</TableCell>;
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button onClick={() => { setStep("upload"); setCsvFile(null); setProcessedTasks([]); }} className="mt-4">
                {t('uploadData.uploadAnotherFile')}
              </Button>
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

