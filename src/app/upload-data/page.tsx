
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
  { name: 'id', description: 'ID Interno de Tarea (ej. TASK-001)', required: true },
  { name: 'taskReference', description: 'TO Ref. (Referencia Orden de Transporte)', required: false },
  { name: 'name', description: 'Nombre de la Tarea', required: true },
  { name: 'status', description: 'TO Status (Estado de la Orden/Tarea)', required: true },
  { name: 'priority', description: 'Prioridad (Baja, Media, Alta, Muy Alta)', required: true },
  { name: 'dueDate', description: 'Fecha de Vencimiento (YYYY-MM-DD)', required: false },
  { name: 'assignee', description: 'Desarrollador Logístico (Ejecutivo de Operaciones)', required: false },
  { name: 'estimatedHours', description: 'Horas Estimadas (numérico)', required: false },
  { name: 'actualHours', description: 'Horas Reales (numérico)', required: false },
  { name: 'description', description: 'Descripción Detallada', required: false },
  { name: 'delayDays', description: 'Dias de atraso (Días Pendientes para Factura)', required: false },
  { name: 'customerAccount', description: 'Customer Account (Cuenta de Cliente)', required: false },
  { name: 'netAmount', description: 'Monto $ (Importe Neto Total Moneda Principal)', required: false },
  { name: 'transportMode', description: 'Transport Mode (Modo de Transporte)', required: false },
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
    rawCsvRows.forEach((row, rowIndex) => {
      const taskObject: Partial<Task> = {};
      
      csvHeaders.forEach((header, colIndex) => {
        const systemColName = userMappings[header];
        if (systemColName) {
          const value = row[colIndex]?.trim();
          // Assign general properties
          taskObject[systemColName as keyof Task] = value;

          // Specific parsing for known types
          if (systemColName === 'id') {
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
          } else if (systemColName === 'estimatedHours' || systemColName === 'actualHours' || systemColName === 'delayDays' || systemColName === 'netAmount') {
            taskObject[systemColName as 'estimatedHours' | 'actualHours' | 'delayDays' | 'netAmount'] = value && !isNaN(parseFloat(value)) ? parseFloat(value) : null;
          } else if (systemColName === 'description' || systemColName === 'taskReference' || systemColName === 'customerAccount' || systemColName === 'transportMode') {
             taskObject[systemColName as 'description' | 'taskReference' | 'customerAccount' | 'transportMode'] = value || "";
          }
        }
      });

      // Ensure required fields have default values if not properly mapped or empty
      if (!taskObject.id) taskObject.id = `GENERATED-${Date.now()}-${rowIndex}`;
      if (!taskObject.name) taskObject.name = `Unnamed Task ${taskObject.id}`;
      if (!taskObject.status) taskObject.status = "To Do";
      if (!taskObject.priority) taskObject.priority = "Medium";
      
      tasks.push(taskObject as Task);
    });
    
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
              <h3 className="text-xl font-semibold">Vista Previa de Datos Procesados (primeras 10 filas)</h3>
               <div className="max-h-96 overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {/* Filter systemColumns to only show those that were actually mapped by the user */}
                      {systemColumns.filter(sc => Object.values(userMappings).includes(sc.name)).map(col => (
                        <TableHead key={col.name}>{col.description}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedTasks.slice(0, 10).map((task, index) => (
                      <TableRow key={task.id || index}>
                        {systemColumns.filter(sc => Object.values(userMappings).includes(sc.name)).map(col => {
                           const value = task[col.name as keyof Task];
                           return <TableCell key={col.name}>{String(value === null || value === undefined ? 'N/A' : value)}</TableCell>;
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
