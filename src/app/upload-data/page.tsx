
"use client";

import { useState, useTransition } from 'react';
import type { Task } from '@/types';
import { FileUploader } from '@/components/upload/file-uploader';
import { ColumnMapper } from '@/components/upload/column-mapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getMappingSuggestions } from './actions';
import type { SuggestCsvMappingOutput, SystemColumn } from './actions';

type UploadStep = "upload" | "map" | "confirm" | "done";

// Define system columns based on Task interface for mapping
const systemColumns: SystemColumn[] = [
  { name: 'id', description: 'Unique identifier for the task (e.g., TASK-001)', required: true },
  { name: 'name', description: 'The title or name of the task', required: true },
  { name: 'status', description: 'Current status (To Do, In Progress, Blocked, Done, Review)', required: true },
  { name: 'priority', description: 'Priority level (Low, Medium, High, Very High)', required: true },
  { name: 'dueDate', description: 'Due date in YYYY-MM-DD format (optional)', required: false },
  { name: 'assignee', description: 'Person or team assigned (optional)', required: false },
  { name: 'estimatedHours', description: 'Estimated hours (numeric, optional)', required: false },
  { name: 'actualHours', description: 'Actual hours spent (numeric, optional)', required: false },
  { name: 'description', description: 'Detailed description of the task (optional)', required: false },
];


export default function UploadDataPage() {
  const [step, setStep] = useState<UploadStep>("upload");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvPreviewRows, setCsvPreviewRows] = useState<string[][]>([]);
  const [rawCsvRows, setRawCsvRows] = useState<string[][]>([]);
  
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [suggestedMappings, setSuggestedMappings] = useState<SuggestCsvMappingOutput['suggestedMappings']>([]);
  const [userMappings, setUserMappings] = useState<Record<string, string | null>>({});
  const [processedTasks, setProcessedTasks] = useState<Task[]>([]);

  const handleFileAccepted = (file: File, headers: string[], previewRows: string[][], allRows: string[][]) => {
    setCsvFile(file);
    setCsvHeaders(headers);
    setCsvPreviewRows(previewRows);
    setRawCsvRows(allRows);

    startTransition(async () => {
      try {
        const suggestions = await getMappingSuggestions(headers, systemColumns);
        setSuggestedMappings(suggestions.suggestedMappings);
        const initialUserMappings: Record<string, string | null> = {};
        suggestions.suggestedMappings.forEach(m => {
          initialUserMappings[m.csvColumn] = m.systemColumn;
        });
        setUserMappings(initialUserMappings);
        setStep("map");
        toast({ title: "Archivo CSV cargado", description: "Revisa el mapeo de columnas sugerido." });
      } catch (error) {
        toast({
          title: "Error al sugerir mapeo",
          description: error instanceof Error ? error.message : "No se pudieron obtener las sugerencias.",
          variant: "destructive",
        });
        // Optionally, allow proceeding without AI suggestions or reset
        // For now, let's proceed to manual mapping
        const initialUserMappings: Record<string, string | null> = {};
        headers.forEach(h => initialUserMappings[h] = null);
        setUserMappings(initialUserMappings);
        setStep("map");
      }
    });
  };

  const handleMappingUpdate = (csvCol: string, systemCol: string | null) => {
    setUserMappings(prev => ({ ...prev, [csvCol]: systemCol }));
  };

  const processData = () => {
    if (rawCsvRows.length === 0 || csvHeaders.length === 0) {
      toast({ title: "No hay datos para procesar", variant: "destructive" });
      return;
    }

    // Check if essential Task fields are mapped
    const requiredSystemCols = systemColumns.filter(sc => sc.required).map(sc => sc.name);
    const mappedSystemCols = Object.values(userMappings);
    const missingRequiredMappings = requiredSystemCols.filter(rc => !mappedSystemCols.includes(rc));

    if (missingRequiredMappings.length > 0) {
      toast({
        title: "Mapeo Incompleto",
        description: `Por favor, mapea las siguientes columnas requeridas del sistema: ${missingRequiredMappings.join(', ')}`,
        variant: "destructive"
      });
      return;
    }


    const tasks: Task[] = [];
    const newOrUpdatedTaskIds = new Set<string>();

    rawCsvRows.forEach((row, rowIndex) => {
      const taskObject: Partial<Task> = {};
      let idColumnValue: string | undefined = undefined;

      csvHeaders.forEach((header, colIndex) => {
        const systemColName = userMappings[header];
        if (systemColName) {
          const value = row[colIndex]?.trim();
          if (systemColName === 'id') {
            idColumnValue = value;
            taskObject.id = value || `GENERATED-${Date.now()}-${rowIndex}`;
          } else if (systemColName === 'name') {
            taskObject.name = value || `Unnamed Task ${rowIndex + 1}`;
          } else if (systemColName === 'status') {
            taskObject.status = value as Task['status'] || "To Do";
          } else if (systemColName === 'priority') {
            taskObject.priority = value as Task['priority'] || "Medium";
          } else if (systemColName === 'dueDate') {
            taskObject.dueDate = value && !isNaN(new Date(value).getTime()) ? value : null;
          } else if (systemColName === 'assignee') {
            taskObject.assignee = value || "";
          } else if (systemColName === 'estimatedHours') {
            taskObject.estimatedHours = value && !isNaN(parseFloat(value)) ? parseFloat(value) : null;
          } else if (systemColName === 'actualHours') {
            taskObject.actualHours = value && !isNaN(parseFloat(value)) ? parseFloat(value) : null;
          } else if (systemColName === 'description') {
            taskObject.description = value || "";
          }
        }
      });

      // Ensure required fields have default values if not properly mapped or empty in CSV
      // This depends on how strictly we want to enforce Task creation
      if (!taskObject.id) taskObject.id = `GENERATED-${Date.now()}-${rowIndex}`;
      if (!taskObject.name) taskObject.name = `Unnamed Task ${taskObject.id}`;
      if (!taskObject.status) taskObject.status = "To Do";
      if (!taskObject.priority) taskObject.priority = "Medium";
      
      // Simple duplicate handling: last one wins for now if IDs match
      // More sophisticated handling would involve checking against existing app data.
      // For this prototype, we assume new data or overwrites.
      if (taskObject.id) {
         newOrUpdatedTaskIds.add(taskObject.id);
      }
      tasks.push(taskObject as Task);
    });
    
    // Filter out old tasks that were not in the CSV if we want to replace a dataset.
    // Or merge with existing data if we had access to it.
    // For now, processedTasks will be just the data from the CSV.
    setProcessedTasks(tasks);
    setStep("done");
    toast({ title: "Datos Procesados", description: `${tasks.length} tareas han sido procesadas del archivo CSV.` });
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cargar Datos desde CSV</CardTitle>
          <CardDescription>Sube un archivo CSV, mapea las columnas y actualiza tus datos.</CardDescription>
        </CardHeader>
        <CardContent>
          {step === "upload" && (
            <FileUploader onFileAccepted={handleFileAccepted} isProcessing={isPending} />
          )}

          {step === "map" && csvFile && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Mapeo de Columnas</h3>
              <p className="text-sm text-muted-foreground">
                Hemos intentado adivinar cómo se asignan las columnas de tu archivo CSV ({csvFile.name}) a las columnas del sistema. 
                Por favor, revisa y ajusta las asignaciones si es necesario.
              </p>
              <ColumnMapper
                csvHeaders={csvHeaders}
                systemColumns={systemColumns}
                suggestedMappings={suggestedMappings}
                currentMappings={userMappings}
                onMappingChange={handleMappingUpdate}
              />
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => { setStep("upload"); setCsvFile(null); }}>Cancelar</Button>
                <Button onClick={processData} disabled={isPending}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                  Confirmar Mapeo y Procesar
                </Button>
              </div>
            </div>
          )}
          
          {step === "done" && processedTasks.length > 0 && (
             <div className="space-y-4">
              <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-700">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <AlertTitle className="text-green-700 dark:text-green-300">Procesamiento Completo</AlertTitle>
                <AlertDescription className="text-green-600 dark:text-green-400">
                  Se han procesado {processedTasks.length} tareas desde el archivo CSV.
                  Estos son los datos transformados. En una aplicación real, estos datos actualizarían la tabla principal.
                </AlertDescription>
              </Alert>
              <h3 className="text-xl font-semibold">Vista Previa de Datos Procesados</h3>
               <div className="max-h-96 overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {systemColumns.map(col => userMappings[csvHeaders.find(h => userMappings[h] === col.name) || ''] === col.name && <TableHead key={col.name}>{col.description}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedTasks.slice(0, 10).map((task, index) => ( // Preview first 10
                      <TableRow key={task.id || index}>
                        {systemColumns.map(col => {
                           if (userMappings[csvHeaders.find(h => userMappings[h] === col.name) || ''] === col.name) {
                             const value = task[col.name as keyof Task];
                             return <TableCell key={col.name}>{String(value === null || value === undefined ? 'N/A' : value)}</TableCell>;
                           }
                           return null;
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button onClick={() => { setStep("upload"); setCsvFile(null); setProcessedTasks([]); }} className="mt-4">
                Cargar otro archivo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
