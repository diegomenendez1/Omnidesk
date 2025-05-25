
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
const priorityOptions: Task["priority"][] = ["Low", "Medium", "High", "Very High"];

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
          rowIndex: index + 1, // For easier cell referencing like A1, B2
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
      id: `TASK-${String(tasks.length + 1).padStart(3, '0')}`, // Simple ID generation
      name: "",
      status: "To Do",
      priority: "Medium",
      dueDate: new Date().toISOString().split('T')[0], // Default to today
      assignee: "",
      estimatedHours: 0,
      actualHours: null,
      description: ""
    });
    setIsNewTask(true);
    setIsModalOpen(true);
  };

  const handleDelete = (taskId: string) => {
    setTasks(currentTasks => currentTasks.filter(task => task.id !== taskId));
    toast({ title: "Task Deleted", description: `Task ${taskId} has been removed.` });
  };

  const handleSaveTask = () => {
    if (!editingTask) return;

    if (isNewTask) {
      setTasks(prevTasks => [...prevTasks, editingTask]);
      toast({ title: "Task Added", description: `Task ${editingTask.id} created successfully.`});
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
    setEditingTask(prev => prev ? { ...prev, [name]: name === 'estimatedHours' || name === 'actualHours' ? (value === '' ? null : Number(value)) : value } : null);
  };

  const handleSelectChange = (name: keyof Task, value: string) => {
    if (!editingTask) return;
    setEditingTask(prev => prev ? { ...prev, [name]: value } : null);
  };
  
  // Function to get cell reference (e.g., A1, B2)
  const getCellRef = (rowIndex: number, colKey: keyof Task) => {
    const colLetter = String.fromCharCode(65 + Object.keys(tasks[0] || {}).indexOf(colKey));
    return `${colLetter}${rowIndex + 1}`;
  };


  return (
    <div className="space-y-4">
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
      
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead className="text-right">Est. Hours</TableHead>
                  <TableHead className="text-right">Actual Hours</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task, rowIndex) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.id}</TableCell>
                    <TableCell>{task.name}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        task.status === "Done" ? "bg-green-100 text-green-700" :
                        task.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                        task.status === "To Do" ? "bg-gray-100 text-gray-700" :
                        task.status === "Blocked" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {task.status}
                      </span>
                    </TableCell>
                    <TableCell>{task.priority}</TableCell>
                    <TableCell>{task.dueDate || 'N/A'}</TableCell>
                    <TableCell>{task.assignee}</TableCell>
                    <TableCell className="text-right">{task.estimatedHours === null || task.estimatedHours === undefined ? 'N/A' : String(task.estimatedHours)}</TableCell>
                    <TableCell className="text-right">{task.actualHours === null || task.actualHours === undefined ? 'N/A' : String(task.actualHours)}</TableCell>
                    <TableCell className="text-center">
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
                {isNewTask ? "Fill in the details for the new task." : `Modify the details for task ${editingTask.id}.`}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" name="name" value={editingTask.name} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Textarea id="description" name="description" value={editingTask.description || ""} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">Status</Label>
                <Select name="status" value={editingTask.status} onValueChange={(value) => handleSelectChange("status", value)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priority" className="text-right">Priority</Label>
                 <Select name="priority" value={editingTask.priority} onValueChange={(value) => handleSelectChange("priority", value)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dueDate" className="text-right">Due Date</Label>
                <Input id="dueDate" name="dueDate" type="date" value={editingTask.dueDate || ""} onChange={handleInputChange} className="col-span-3" />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="assignee" className="text-right">Assignee</Label>
                <Input id="assignee" name="assignee" value={editingTask.assignee} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="estimatedHours" className="text-right">Est. Hours</Label>
                <Input id="estimatedHours" name="estimatedHours" type="number" value={editingTask.estimatedHours === null ? "" : String(editingTask.estimatedHours)} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="actualHours" className="text-right">Actual Hours</Label>
                <Input id="actualHours" name="actualHours" type="number" value={editingTask.actualHours === null ? "" : String(editingTask.actualHours)} onChange={handleInputChange} className="col-span-3" />
              </div>
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

    