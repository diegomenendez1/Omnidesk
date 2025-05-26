
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
import { useRouter } from 'next/navigation';

type UploadStep = "upload" | "map" | "confirm" | "done";

// Define system columns based on Task interface for mapping
const systemColumns: SystemColumn[] = [
  { name: 'status', description: 'TO Status', required: true },
  { name: 'assignee', description: 'Desarrollador Logístico', required: false },
  { name: 'taskReference', description: 'TO Ref.', required: false },
  { name: 'delayDays', description: 'Dias de atraso', required: false },
  { name: 'customerAccount', description: 'Customer Acc.', required: false },
  { name: 'netAmount', description: 'Monto $', required: false },
  { name: 'transportMode', description: 'Transport Mode', required: false },
  { name: 'comments', description: 'Comentarios', required: false },
  { name: 'resolutionAdmin', description: 'Administrador', required: false },
  { name: 'resolutionStatus', description: 'Estado de Resolución', required: false },
  { name: 'resolutionTimeDays', description: 'Tiempo Resolución (días)', required: false },
];

// Predefined map for common user CSV headers to system column names
// Keys should be lowercase for case-insensitive matching
const PREFERRED_CSV_TO_SYSTEM_MAP: Record<string, string> = {
  "transport order ref.": "taskReference",
  "days pending for first invoice": "delayDays",
  "invoice on-time status": "status",
  "customer account": "customerAccount",
  "total net amount main currency": "netAmount",
  "operations executive": "assignee",
  "transport mode": "transportMode"
  // Add other common CSV headers from the user if known, e.g.,
  // "comentario": "comments",
  // "admin resolucion": "resolutionAdmin",
  // "estado resolucion": "resolutionStatus",
  // "tiempo resolucion": "resolutionTimeDays"
};


export default function UploadDataPage() {
  const [step, setStep] = useState<UploadStep>("upload");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvPreviewRows, setCsvPreviewRows] = useState<string[][]>([]);
  const [rawCsvRows, setRawCsvRows] = useState<string[][]>([]);

  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const [suggestedMappings, setSuggestedMappings] = useState<SuggestCsvMappingOutput['suggestedMappings']>([]);
  const [userMappings, setUserMappings] = useState<Record<string, string | null>>({});
  const [processedTasks, setProcessedTasks] = useState<Task[]>([]);

  const handleFileAccepted = (file: File, headers: string[], previewRows: string[][], allRows: string[][]) => {
    setCsvFile(file);
    setCsvHeaders(headers);
    setCsvPreviewRows(previewRows);
    setRawCsvRows(allRows); // Store all rows

    startTransition(async () => {
      const initialUserMappings: Record<string, string | null> = {};
      const headersForAI: string[] = [];

      headers.forEach(header => {
        const lowerHeader = header.toLowerCase();
        let mappedSystemColumn: string | null = null;

        // Step 1: Preferred mapping
        if (PREFERRED_CSV_TO_SYSTEM_MAP[lowerHeader]) {
          mappedSystemColumn = PREFERRED_CSV_TO_SYSTEM_MAP[lowerHeader];
        } else {
          // Step 2: Direct description match
          const directDescMatch = systemColumns.find(
            sc => sc.description.toLowerCase() === lowerHeader
          );
          if (directDescMatch) {
            mappedSystemColumn = directDescMatch.name;
          }
        }

        if (mappedSystemColumn) {
          initialUserMappings[header] = mappedSystemColumn;
        } else {
          initialUserMappings[header] = null; // Fallback, AI will try to fill this
          headersForAI.push(header);
        }
      });
      
      let aiSuggestionsOutput: SuggestCsvMappingOutput | null = null;
      if (headersForAI.length > 0) {
        try {
          aiSuggestionsOutput = await getMappingSuggestions(headersForAI, systemColumns);
          aiSuggestionsOutput.suggestedMappings.forEach(aiMap => {
            if (initialUserMappings.hasOwnProperty(aiMap.csvColumn) && initialUserMappings[aiMap.csvColumn] === null && aiMap.systemColumn !== null) {
              initialUserMappings[aiMap.csvColumn] = aiMap.systemColumn;
            }
          });
        } catch (error) {
          toast({
            title: "Error al obtener sugerencias de IA",
            description: "Algunas columnas no pudieron ser mapeadas automáticamente. Por favor, revísalas manualmente.",
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
            } else if (systemColumns.find(sc => sc.description.toLowerCase() === lowerHeader && sc.name === systemColName)) {
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
      toast({ title: "Archivo CSV cargado", description: "Revisa el mapeo de columnas." });
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
        description: `Por favor, mapea las siguientes columnas requeridas del sistema: ${missingRequiredMappings.map(colName => systemColumns.find(sc => sc.name === colName)?.description || colName).join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    const tasks: Task[] = [];
    rawCsvRows.forEach((row, rowIndex) => {
      const taskObject: Partial<Task> = {};
      let idCandidate: string | undefined = undefined;

      csvHeaders.forEach((header, colIndex) => {
        const systemColName = userMappings[header];
        if (systemColName) {
          const value = row[colIndex]?.trim();

          if (systemColName === 'status') {
            taskObject.status = value as Task['status'] || "To Do";
          } else if (systemColName === 'assignee') {
            taskObject.assignee = value || "";
          } else if (systemColName === 'taskReference') {
            taskObject.taskReference = value || "";
            if (!idCandidate) idCandidate = value;
          } else if (systemColName === 'delayDays' || systemColName === 'netAmount' || systemColName === 'resolutionTimeDays') {
            taskObject[systemColName as 'delayDays' | 'netAmount' | 'resolutionTimeDays'] = value && !isNaN(parseFloat(value)) ? parseFloat(value) : null;
          } else if (systemColName === 'customerAccount' || systemColName === 'transportMode' || systemColName === 'comments' || systemColName === 'resolutionAdmin') {
             taskObject[systemColName as 'customerAccount' | 'transportMode' | 'comments' | 'resolutionAdmin'] = value || "";
          } else if (systemColName === 'resolutionStatus') {
            taskObject.resolutionStatus = value as Task['resolutionStatus'] || "Pendiente";
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

      if (!taskObject.status) taskObject.status = "To Do";
      if (!taskObject.resolutionStatus && systemColumns.some(sc => sc.name === 'resolutionStatus')) {
        taskObject.resolutionStatus = "Pendiente";
      }

      tasks.push(taskObject as Task);
    });

    setProcessedTasks(tasks);

    try {
      localStorage.setItem('uploadedTasks', JSON.stringify(tasks));
      toast({ title: "Datos Procesados", description: `${tasks.length} tareas procesadas y guardadas. Redirigiendo a la tabla...` });
      router.push('/table');
    } catch (error) {
      console.error("Error al guardar tareas en localStorage:", error);
      toast({
        title: "Error al guardar datos localmente",
        description: "No se pudieron guardar los datos para la tabla interactiva. La vista previa sigue disponible en esta página.",
        variant: "destructive",
      });
      setStep("done"); // Permanecer en la página de carga para mostrar la vista previa
    }
  };


  return (
    <div className="space-y-6 w-full">
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
                  Para este prototipo, los datos se han guardado localmente y se intentarán cargar en la Tabla Interactiva.
                </AlertDescription>
              </Alert>
              <h3 className="text-xl font-semibold">Vista Previa de Datos Procesados (primeras 10 filas)</h3>
               <div className="max-h-96 overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {systemColumns.filter(sc => Object.values(userMappings).includes(sc.name)).map(col => (
                        <TableHead key={col.name}>{col.description}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedTasks.slice(0, 10).map((task, index) => (
                      <TableRow key={task.id || `processed-${index}`}>
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
    

    