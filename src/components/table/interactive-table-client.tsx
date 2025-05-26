
"use client";

import { useState, useTransition, type ChangeEvent, useEffect } from 'react';
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
import { ScanSearch, Edit3, Trash2, PlusCircle, Save, XCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';

interface InteractiveTableClientProps {
  initialData: Task[];
}

const statusOptions: Task["status"][] = ["To Do", "In Progress", "Blocked", "Done", "Review"];
const resolutionStatusOptions: Task["resolutionStatus"][] = ["Pendiente", "En Progreso", "Resuelto", "Bloqueado"];


export function InteractiveTableClient({ initialData }: InteractiveTableClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialData);
  const [validationResult, setValidationResult] = useState<ValidateDataConsistencyOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isNewTask, setIsNewTask] = useState(false);

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

  const handleEdit = (task: Task) => {
    setEditingTask({ ...task });
    setIsNewTask(false);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingTask({
      id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: "", 
      status: "To Do",
      assignee: "",
      taskReference: "",
      delayDays: null,
      customerAccount: "",
      netAmount: null,
      transportMode: "",
      comments: "",
      resolutionAdmin: "",
      resolutionStatus: "Pendiente",
      resolutionTimeDays: null,
    });
    setIsNewTask(true);
    setIsModalOpen(true);
  };

  const handleDelete = (taskId: string | undefined) => {
    if (!taskId) return;
    setTasks(currentTasks => currentTasks.filter(task => task.id !== taskId));
    toast({ title: "Task Deleted", description: `Task ${taskId} has been removed.` });
  };

  const handleSaveTask = () => {
    if (!editingTask) return;

    if (isNewTask) {
      setTasks(prevTasks => [...prevTasks, editingTask]);
      toast({ title: "Task Added", description: `Task ${editingTask.id || 'new task'} created successfully.`});
    } else {
      setTasks(prevTasks => prevTasks.map(task => task.id === editingTask.id ? editingTask : task));
      toast({ title: "Task Updated", description: `Task ${editingTask.id} updated successfully.`});
    }
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editingTask) return;
    const { name, value } = e.target;

    let processedValue: string | number | null = value;
    if (name === 'delayDays' || name === 'netAmount' || name === 'resolutionTimeDays') {
      processedValue = value === '' ? null : Number(value);
    }

    setEditingTask(prev => prev ? { ...prev, [name]: processedValue } : null);
  };

  const handleSelectChange = (name: keyof Task, value: string) => {
    if (!editingTask) return;
    setEditingTask(prev => prev ? { ...prev, [name]: value } : null);
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex justify-between items-center flex-wrap gap-x-4 gap-y-2">
        <h2 className="text-2xl font-semibold truncate min-w-0">Tasks Overview</h2>
        <div className="flex gap-2 flex-shrink-0">
          <Button onClick={handleAddNew} variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Task
          </Button>
          <Button onClick={handleValidateData} disabled={isPending} variant="default">
            <ScanSearch className="mr-2 h-4 w-4" />
            {isPending ? 'Validating...' : 'Validate Data with AI'}
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
                  <TableHead>Monto $</TableHead>
                  <TableHead>Transport Mode</TableHead>
                  <TableHead>Comentarios</TableHead>
                  <TableHead>Admin. Resolución</TableHead>
                  <TableHead>Estado Resolución</TableHead>
                  <TableHead>Tiempo Resolución (días)</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task, rowIndex) => (
                  <TableRow key={task.id || task.taskReference || `task-${rowIndex}`}>
                    <TableCell>{task.taskReference || 'N/A'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        task.status === "Done" ? "bg-green-100 text-green-700 dark:bg-green-700/20 dark:text-green-300" :
                        task.status === "In Progress" ? "bg-blue-100 text-blue-700 dark:bg-blue-700/20 dark:text-blue-300" :
                        task.status === "To Do" ? "bg-gray-100 text-gray-700 dark:bg-gray-700/20 dark:text-gray-300" :
                        task.status === "Blocked" ? "bg-red-100 text-red-700 dark:bg-red-700/20 dark:text-red-300" : 
                        "bg-yellow-100 text-yellow-700 dark:bg-yellow-700/20 dark:text-yellow-300"
                      }`}>
                        {task.status}
                      </span>
                    </TableCell>
                    <TableCell>{task.assignee || 'N/A'}</TableCell>
                    <TableCell>{task.delayDays === null || task.delayDays === undefined ? 'N/A' : String(task.delayDays)}</TableCell>
                    <TableCell>{task.customerAccount || 'N/A'}</TableCell>
                    <TableCell className="text-right">{task.netAmount === null || task.netAmount === undefined ? 'N/A' : String(task.netAmount)}</TableCell>
                    <TableCell>{task.transportMode || 'N/A'}</TableCell>
                    <TableCell className="max-w-xs truncate">{task.comments || 'N/A'}</TableCell>
                    <TableCell>{task.resolutionAdmin || 'N/A'}</TableCell>
                    <TableCell>
                      {task.resolutionStatus ? (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          task.resolutionStatus === "Resuelto" ? "bg-green-100 text-green-700 dark:bg-green-700/20 dark:text-green-300" :
                          task.resolutionStatus === "En Progreso" ? "bg-blue-100 text-blue-700 dark:bg-blue-700/20 dark:text-blue-300" :
                          task.resolutionStatus === "Pendiente" ? "bg-gray-100 text-gray-700 dark:bg-gray-700/20 dark:text-gray-300" :
                          task.resolutionStatus === "Bloqueado" ? "bg-red-100 text-red-700 dark:bg-red-700/20 dark:text-red-300" : ""
                        }`}>
                          {task.resolutionStatus}
                        </span>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">{task.resolutionTimeDays === null || task.resolutionTimeDays === undefined ? 'N/A' : String(task.resolutionTimeDays)}</TableCell>
                    <TableCell className="text-center sticky right-0 bg-card">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(task)} className="hover:text-primary">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id)} className="hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {validationResult && (
        <DataValidationReport result={validationResult} />
      )}

      {isModalOpen && editingTask && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{isNewTask ? "Add New Task" : "Edit Task"}</DialogTitle>
              <DialogDescription>
                {isNewTask ? "Fill in the details for the new task." : `Modify the details for task ${editingTask.id || editingTask.taskReference || 'selected task'}.`}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
              {/* Standard Fields */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="taskReference" className="text-right">TO Ref.</Label>
                <Input id="taskReference" name="taskReference" value={editingTask.taskReference || ""} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">TO Status</Label>
                <Select name="status" value={editingTask.status} onValueChange={(value) => handleSelectChange("status", value as Task["status"])}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="assignee" className="text-right">Desarrollador Logístico</Label>
                <Input id="assignee" name="assignee" value={editingTask.assignee || ""} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="delayDays" className="text-right">Dias de atraso</Label>
                <Input id="delayDays" name="delayDays" type="number" value={editingTask.delayDays === null ? "" : String(editingTask.delayDays)} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customerAccount" className="text-right">Customer Acc.</Label>
                <Input id="customerAccount" name="customerAccount" value={editingTask.customerAccount || ""} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="netAmount" className="text-right">Monto $</Label>
                <Input id="netAmount" name="netAmount" type="number" value={editingTask.netAmount === null ? "" : String(editingTask.netAmount)} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="transportMode" className="text-right">Transport Mode</Label>
                <Input id="transportMode" name="transportMode" value={editingTask.transportMode || ""} onChange={handleInputChange} className="col-span-3" />
              </div>

              {/* New Admin Fields */}
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="comments" className="text-right pt-2">Comentarios</Label>
                <Textarea id="comments" name="comments" value={editingTask.comments || ""} onChange={handleInputChange} className="col-span-3" placeholder="Add comments..." />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="resolutionAdmin" className="text-right">Admin. Resolución</Label>
                <Input id="resolutionAdmin" name="resolutionAdmin" value={editingTask.resolutionAdmin || ""} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="resolutionStatus" className="text-right">Estado Resolución</Label>
                <Select name="resolutionStatus" value={editingTask.resolutionStatus || "Pendiente"} onValueChange={(value) => handleSelectChange("resolutionStatus", value as Task["resolutionStatus"])}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select resolution status" />
                  </SelectTrigger>
                  <SelectContent>
                    {resolutionStatusOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {/* resolutionTimeDays is not editable here as per requirement */}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline"><XCircle className="mr-2 h-4 w-4" />Cancel</Button>
              </DialogClose>
              <Button onClick={handleSaveTask}><Save className="mr-2 h-4 w-4" />Save Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
