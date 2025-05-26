
"use client";

import { useState, useTransition, type ChangeEvent, type KeyboardEvent, useEffect } from 'react';
import type { Task } from '@/types';
import { performDataValidation } from '@/app/table/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { DataValidationReport } from './data-validation-report';
import type { ValidateDataConsistencyOutput } from '@/types';
import { ScanSearch } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from '@/lib/utils';

interface InteractiveTableClientProps {
  initialData: Task[];
}

const resolutionStatusOptions: Task["resolutionStatus"][] = ["Pendiente", "SFP", "Resuelto"];
const statusOptions: Task["status"][] = ["Missing Estimated Dates", "Missing POD", "Pending to Invoice Out of Time"];


export function InteractiveTableClient({ initialData }: InteractiveTableClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialData);
  const [validationResult, setValidationResult] = useState<ValidateDataConsistencyOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [editingCellKey, setEditingCellKey] = useState<string | null>(null);
  const [currentEditText, setCurrentEditText] = useState<string>("");
  const [currentEditSelectValue, setCurrentEditSelectValue] = useState<Task['resolutionStatus'] | ''>("Pendiente");
  const [isSelectDropdownOpen, setIsSelectDropdownOpen] = useState(false);


  useEffect(() => {
    const storedTasksJson = localStorage.getItem('uploadedTasks');
    if (storedTasksJson) {
      try {
        const loadedTasks: Task[] = JSON.parse(storedTasksJson);
        if (loadedTasks && loadedTasks.length > 0) {
          setTasks(loadedTasks);
          toast({
            title: "Datos Cargados",
            description: `Se han cargado ${loadedTasks.length} tareas desde la última importación.`,
            variant: "default",
          });
        }
      } catch (error) {
        console.error("Error al parsear tareas desde localStorage:", error);
        toast({
          title: "Error al cargar datos",
          description: "No se pudieron cargar las tareas guardadas.",
          variant: "destructive",
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleValidateData = () => {
    startTransition(async () => {
      try {
        const tableDataString = JSON.stringify(tasks.map((task, index) => ({
          rowIndex: index + 1,
          ...task
        })));
        const result = await performDataValidation({ tableData: tableDataString });
        setValidationResult(result);
        toast({
          title: "Data Validation Complete",
          description: result.summary,
        });
      } catch (error) {
        console.error("Validation failed:", error);
        setValidationResult(null);
        toast({
          title: "Data Validation Failed",
          description: error instanceof Error ? error.message : "An unknown error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  const startEdit = (task: Task, column: keyof Task) => {
    const cellKey = `${task.id}-${String(column)}`;
    setEditingCellKey(cellKey);
    const value = task[column];

    if (column === 'comments' || column === 'resolutionAdmin') {
      setCurrentEditText(String(value || ""));
      setIsSelectDropdownOpen(false); 
    } else if (column === 'resolutionStatus') {
      setCurrentEditSelectValue( (value as Task['resolutionStatus']) || "Pendiente");
      setIsSelectDropdownOpen(true); 
    }
  };

  const handleInlineTextChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCurrentEditText(event.target.value);
  };

  const saveInlineEdit = (taskId: string, column: keyof Task) => {
    if (!editingCellKey || !editingCellKey.startsWith(taskId)) return;

    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, [column]: currentEditText } : task
      )
    );
    setEditingCellKey(null);
    setCurrentEditText("");
    toast({title: "Campo actualizado", description: `Se guardó el cambio para ${String(column)}.`});
  };
  
  const handleInlineSelectChange = (taskId: string, column: keyof Task, value: string) => {
     setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, [column]: value } : task
      )
    );
    setEditingCellKey(null); 
    setCurrentEditSelectValue('');
    setIsSelectDropdownOpen(false);
    toast({title: "Campo actualizado", description: `Se guardó el cambio para ${String(column)}.`});
  };


  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, taskId: string, column: keyof Task) => {
    if (event.key === 'Enter') {
       if (!event.shiftKey && event.currentTarget.tagName !== 'TEXTAREA') { 
        event.preventDefault(); 
        saveInlineEdit(taskId, column);
      }
    } else if (event.key === 'Escape') {
      setEditingCellKey(null);
      setCurrentEditText("");
      setCurrentEditSelectValue('');
      setIsSelectDropdownOpen(false);
    }
  };


  return (
    <div className="space-y-4 w-full">
      <div className="flex justify-between items-center flex-wrap gap-x-4 gap-y-2">
        <h2 className="text-2xl font-semibold truncate min-w-0">Tasks Overview</h2>
        <div className="flex gap-2 flex-shrink-0">
          <Button onClick={handleValidateData} disabled={isPending} variant="default">
            <ScanSearch className="mr-2 h-4 w-4" />
            {isPending ? 'Validando...' : 'Validate Data with AI'}
          </Button>
        </div>
      </div>

      <Card className="w-full">
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>TO Ref.</TableHead>
                  <TableHead>TO Status</TableHead>
                  <TableHead>Desarrollador Logístico</TableHead>
                  <TableHead>Dias de atraso</TableHead>
                  <TableHead>Customer Acc.</TableHead>
                  <TableHead className="text-right">Monto $</TableHead>
                  <TableHead>Transport Mode</TableHead>
                  <TableHead>Comentarios</TableHead>
                  <TableHead>Administrador</TableHead>
                  <TableHead className="text-right">Tiempo Resolución (días)</TableHead>
                  <TableHead className="text-left">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => {
                  const taskId = task.id || `task-${task.taskReference || Math.random().toString(36).substring(2, 9)}`;
                  return (
                    <TableRow key={taskId}>
                      <TableCell>{task.taskReference || 'N/A'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          task.status === "Pending to Invoice Out of Time" ? "bg-orange-100 text-orange-700 dark:bg-orange-700/20 dark:text-orange-300" :
                          task.status === "Missing POD" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-700/20 dark:text-yellow-300" :
                          task.status === "Missing Estimated Dates" ? "bg-purple-100 text-purple-700 dark:bg-purple-700/20 dark:text-purple-300" :
                          "bg-gray-100 text-gray-700 dark:bg-gray-700/20 dark:text-gray-300"
                        }`}>
                          {task.status}
                        </span>
                      </TableCell>
                      <TableCell>{task.assignee || 'N/A'}</TableCell>
                      <TableCell>{task.delayDays === null || task.delayDays === undefined ? 'N/A' : String(task.delayDays)}</TableCell>
                      <TableCell>{task.customerAccount || 'N/A'}</TableCell>
                      <TableCell className="text-right">{formatCurrency(task.netAmount)}</TableCell>
                      <TableCell>{task.transportMode || 'N/A'}</TableCell>
                      
                      <TableCell onClick={() => editingCellKey !== `${taskId}-comments` && startEdit(task, 'comments')} className="max-w-xs truncate cursor-pointer hover:bg-muted/50">
                        {editingCellKey === `${taskId}-comments` ? (
                          <Textarea
                            value={currentEditText}
                            onChange={handleInlineTextChange}
                            onBlur={() => saveInlineEdit(taskId, 'comments')}
                            onKeyDown={(e) => handleKeyDown(e, taskId, 'comments')}
                            autoFocus
                            className="w-full text-sm min-h-[60px]"
                          />
                        ) : (
                          task.comments || <span className="text-muted-foreground italic">N/A</span>
                        )}
                      </TableCell>

                      <TableCell onClick={() => editingCellKey !== `${taskId}-resolutionAdmin` && startEdit(task, 'resolutionAdmin')} className="cursor-pointer hover:bg-muted/50">
                        {editingCellKey === `${taskId}-resolutionAdmin` ? (
                          <Input
                            type="text"
                            value={currentEditText}
                            onChange={handleInlineTextChange}
                            onBlur={() => saveInlineEdit(taskId, 'resolutionAdmin')}
                            onKeyDown={(e) => handleKeyDown(e, taskId, 'resolutionAdmin')}
                            autoFocus
                            className="w-full text-sm"
                          />
                        ) : (
                          task.resolutionAdmin || <span className="text-muted-foreground italic">N/A</span>
                        )}
                      </TableCell>
                      
                      <TableCell className="text-right">{task.resolutionTimeDays === null || task.resolutionTimeDays === undefined ? 'N/A' : String(task.resolutionTimeDays)}</TableCell>
                      
                      <TableCell
                        onClick={() => {
                           if (editingCellKey !== `${taskId}-resolutionStatus`) {
                             startEdit(task, 'resolutionStatus');
                           }
                        }}
                        className="text-left cursor-pointer hover:bg-muted/50"
                      >
                        {editingCellKey === `${taskId}-resolutionStatus` ? (
                          <Select
                            value={currentEditSelectValue}
                            onValueChange={(value) => handleInlineSelectChange(taskId, 'resolutionStatus', value as Task['resolutionStatus'])}
                            open={isSelectDropdownOpen}
                            onOpenChange={(openState) => {
                              setIsSelectDropdownOpen(openState);
                              if (!openState && editingCellKey === `${taskId}-resolutionStatus`) { 
                                setEditingCellKey(null); 
                              }
                            }}
                          >
                            <SelectTrigger className="w-full text-sm" autoFocus>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {resolutionStatusOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            task.resolutionStatus === "Resuelto" ? "bg-green-100 text-green-700 dark:bg-green-700/20 dark:text-green-300" :
                            task.resolutionStatus === "SFP" ? "bg-blue-100 text-blue-700 dark:bg-blue-700/20 dark:text-blue-300" :
                            task.resolutionStatus === "Pendiente" ? "bg-gray-100 text-gray-700 dark:bg-gray-700/20 dark:text-gray-300" : ""
                          }`}>
                            {task.resolutionStatus || "Pendiente"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {validationResult && (
        <DataValidationReport result={validationResult} />
      )}
    </div>
  );
}
    
