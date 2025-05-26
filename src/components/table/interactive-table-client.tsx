
"use client";

import { useState, useTransition, type ChangeEvent, type KeyboardEvent, useEffect, useMemo } from 'react';
import type { Task, TaskStatus, TaskResolutionStatus } from '@/types';
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
import { useLanguage } from '@/context/language-context';

const resolutionStatusOptions: TaskResolutionStatus[] = ["Pendiente", "SFP", "Resuelto"];
const statusOptions: TaskStatus[] = ["Missing Estimated Dates", "Missing POD", "Pending to Invoice Out of Time"];

const ALL_FILTER_VALUE = "_ALL_VALUES_"; // Unique value for "All" option

interface InteractiveTableClientProps {
  initialData: Task[];
}

export function InteractiveTableClient({ initialData }: InteractiveTableClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialData);
  const [validationResult, setValidationResult] = useState<ValidateDataConsistencyOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [editingCellKey, setEditingCellKey] = useState<string | null>(null);
  const [currentEditText, setCurrentEditText] = useState<string>("");
  const [currentEditSelectValue, setCurrentEditSelectValue] = useState<TaskResolutionStatus | TaskStatus | ''>(resolutionStatusOptions[0]);
  const [isSelectDropdownOpen, setIsSelectDropdownOpen] = useState(false);

  const [filters, setFilters] = useState<Partial<Record<keyof Task, string | undefined>>>({});

  useEffect(() => {
    const storedTasksJson = localStorage.getItem('uploadedTasks');
    if (storedTasksJson) {
      try {
        const loadedTasks: Task[] = JSON.parse(storedTasksJson);
        if (loadedTasks && loadedTasks.length > 0) {
          setTasks(loadedTasks);
          toast({
            title: t('localStorage.loadedData'),
            description: t('localStorage.loadedTasksDescription', { count: loadedTasks.length }),
            variant: "default",
          });
        }
      } catch (error) {
        console.error("Error parsing tasks from localStorage:", error);
        toast({
          title: t('localStorage.errorLoadingData'),
          description: t('localStorage.errorLoadingDataDescription'),
          variant: "destructive",
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

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
    const cellKey = `${task.id || task.taskReference}-${String(column)}`;
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

  const saveInlineEdit = (taskId: string, column: keyof Task) => {
    const taskIdentifier = tasks.find(t => t.id === taskId || t.taskReference === taskId);
    if (!editingCellKey || !taskIdentifier || (!editingCellKey.startsWith(taskIdentifier.id || '') && !editingCellKey.startsWith(taskIdentifier.taskReference || ''))) return;

    setTasks(prevTasks =>
      prevTasks.map(task =>
        (task.id === taskId || task.taskReference === taskId) ? { ...task, [column]: currentEditText } : task
      )
    );
    setEditingCellKey(null);
    setCurrentEditText("");
    toast({ title: t('interactiveTable.fieldUpdated'), description: t('interactiveTable.changeSavedFor', { field: t(`interactiveTable.tableHeaders.${column}` as any, String(column))}) });
  };

  const handleInlineSelectChange = (taskId: string, column: keyof Task, value: string) => {
     setTasks(prevTasks =>
      prevTasks.map(task =>
        (task.id === taskId || task.taskReference === taskId) ? { ...task, [column]: value } : task
      )
    );
    setEditingCellKey(null);
    setCurrentEditSelectValue('');
    setIsSelectDropdownOpen(false);
    toast({ title: t('interactiveTable.fieldUpdated'), description: t('interactiveTable.changeSavedFor', { field: t(`interactiveTable.tableHeaders.${column}` as any, String(column))}) });
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
      // Use translated "N/A" for null/undefined values, but ensure it's not an empty string for the value prop
      const stringVal = (val === null || val === undefined) 
                        ? t('interactiveTable.notAvailable') 
                        : String(val);
      
      if (stringVal.trim() !== "") { // Ensure non-empty and non-whitespace-only strings are added
        values.add(stringVal);
      } else if (val === "") { // Explicitly handle original empty strings if needed as a distinct filter option
        // If you want to filter by "actually empty" string values, use a placeholder key and label
        // For now, we are excluding them from direct filter options.
        // Example: values.add("_EMPTY_"); // And then handle "_EMPTY_" in filter logic and display "(Empty)"
      }
    });
    return Array.from(values).sort((a, b) => {
        if (a === t('interactiveTable.notAvailable')) return 1; // Push "N/A" to the end
        if (b === t('interactiveTable.notAvailable')) return -1;
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
  };
  
  const uniqueTaskReferences = useMemo(() => getUniqueValuesForColumn('taskReference'), [tasks, t]);
  const uniqueAssignees = useMemo(() => getUniqueValuesForColumn('assignee'), [tasks, t]);
  const uniqueDelayDays = useMemo(() => getUniqueValuesForColumn('delayDays'), [tasks, t]);
  const uniqueCustomerAccounts = useMemo(() => getUniqueValuesForColumn('customerAccount'), [tasks, t]);
  const uniqueNetAmounts = useMemo(() => {
    // For netAmount, we want to filter by the formatted currency string if that's what's displayed
    // Or by the raw number if that's preferred. Let's use raw numbers for filtering.
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


  const filteredTasks = tasks.filter(task => {
    return Object.entries(filters).every(([columnKeyStr, filterValue]) => {
      const columnKey = columnKeyStr as keyof Task;
      if (filterValue === undefined) return true; // "All" selected or no filter set

      const taskValue = task[columnKey];
      let taskValueString: string;

      if (columnKey === 'netAmount') {
          taskValueString = (taskValue === null || taskValue === undefined) ? t('interactiveTable.notAvailable') : String(taskValue);
      } else {
          taskValueString = (taskValue === null || taskValue === undefined) ? t('interactiveTable.notAvailable') : String(taskValue);
      }
      
      if (columnKey === 'comments') { 
        return taskValueString.toLowerCase().includes(String(filterValue).toLowerCase());
      }
      return taskValueString === filterValue;
    });
  });
  
  const filterPlaceholder = (headerKey: string) => t('interactiveTable.filterBy', { columnName: t(headerKey as any) });
  const allOptionLabel = t('interactiveTable.filterAllOption');

  return (
    <div className="space-y-4 w-full">
      <div className="flex justify-between items-center flex-wrap gap-x-4 gap-y-2">
        <h2 className="text-2xl font-semibold truncate min-w-0">{t('interactiveTable.title')}</h2>
        <div className="flex gap-2 flex-shrink-0">
          <Button onClick={handleValidateData} disabled={isPending} variant="default">
            <ScanSearch className="mr-2 h-4 w-4" />
            {isPending ? t('interactiveTable.validating') : t('interactiveTable.validateWithAI')}
          </Button>
        </div>
      </div>

      <Card className="w-full">
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('interactiveTable.tableHeaders.toRef')}</TableHead>
                  <TableHead>{t('interactiveTable.tableHeaders.toStatus')}</TableHead>
                  <TableHead>{t('interactiveTable.tableHeaders.logisticDeveloper')}</TableHead>
                  <TableHead>{t('interactiveTable.tableHeaders.delayDays')}</TableHead>
                  <TableHead>{t('interactiveTable.tableHeaders.customerAccount')}</TableHead>
                  <TableHead className="text-right">{t('interactiveTable.tableHeaders.amount')}</TableHead>
                  <TableHead>{t('interactiveTable.tableHeaders.transportMode')}</TableHead>
                  <TableHead>{t('interactiveTable.tableHeaders.comments')}</TableHead>
                  <TableHead>{t('interactiveTable.tableHeaders.admin')}</TableHead>
                  <TableHead className="text-right">{t('interactiveTable.tableHeaders.resolutionTimeDays')}</TableHead>
                  <TableHead className="text-left">{t('interactiveTable.tableHeaders.actions')}</TableHead>
                </TableRow>
                <TableRow>
                  <TableCell className="p-1">
                    <Select value={filters.taskReference || ALL_FILTER_VALUE} onValueChange={(value) => handleFilterChange('taskReference', value)}>
                        <SelectTrigger className="h-8"><SelectValue placeholder={filterPlaceholder('interactiveTable.tableHeaders.toRef')} /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_FILTER_VALUE}>{allOptionLabel}</SelectItem>
                            {uniqueTaskReferences.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                        </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-1">
                    <Select value={filters.status || ALL_FILTER_VALUE} onValueChange={(value) => handleFilterChange('status', value as TaskStatus)}>
                      <SelectTrigger className="h-8"><SelectValue placeholder={filterPlaceholder('interactiveTable.tableHeaders.toStatus')} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_FILTER_VALUE}>{t('interactiveTable.allStatuses')}</SelectItem>
                        {statusOptions.map(opt => (<SelectItem key={opt} value={opt}>{getStatusDisplay(opt)}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-1">
                     <Select value={filters.assignee || ALL_FILTER_VALUE} onValueChange={(value) => handleFilterChange('assignee', value)}>
                        <SelectTrigger className="h-8"><SelectValue placeholder={filterPlaceholder('interactiveTable.tableHeaders.logisticDeveloper')} /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_FILTER_VALUE}>{allOptionLabel}</SelectItem>
                            {uniqueAssignees.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                        </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-1">
                     <Select value={filters.delayDays || ALL_FILTER_VALUE} onValueChange={(value) => handleFilterChange('delayDays', value)}>
                        <SelectTrigger className="h-8"><SelectValue placeholder={filterPlaceholder('interactiveTable.tableHeaders.delayDays')} /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_FILTER_VALUE}>{allOptionLabel}</SelectItem>
                            {uniqueDelayDays.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                        </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-1">
                     <Select value={filters.customerAccount || ALL_FILTER_VALUE} onValueChange={(value) => handleFilterChange('customerAccount', value)}>
                        <SelectTrigger className="h-8"><SelectValue placeholder={filterPlaceholder('interactiveTable.tableHeaders.customerAccount')} /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_FILTER_VALUE}>{allOptionLabel}</SelectItem>
                            {uniqueCustomerAccounts.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                        </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-1">
                     <Select value={filters.netAmount || ALL_FILTER_VALUE} onValueChange={(value) => handleFilterChange('netAmount', value)}>
                        <SelectTrigger className="h-8 w-[120px] text-right"><SelectValue placeholder={filterPlaceholder('interactiveTable.tableHeaders.amount')} /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_FILTER_VALUE}>{allOptionLabel}</SelectItem>
                            {uniqueNetAmounts.map(opt => (<SelectItem key={opt} value={opt}>{opt === t('interactiveTable.notAvailable') ? opt : formatCurrency(parseFloat(opt))}</SelectItem>))}
                        </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-1">
                     <Select value={filters.transportMode || ALL_FILTER_VALUE} onValueChange={(value) => handleFilterChange('transportMode', value)}>
                        <SelectTrigger className="h-8"><SelectValue placeholder={filterPlaceholder('interactiveTable.tableHeaders.transportMode')} /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_FILTER_VALUE}>{allOptionLabel}</SelectItem>
                            {uniqueTransportModes.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                        </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-1">
                    <Input
                      placeholder={filterPlaceholder('interactiveTable.tableHeaders.comments')}
                      value={String(filters.comments || '')}
                      onChange={(e) => handleFilterChange('comments', e.target.value)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <Select value={filters.resolutionAdmin || ALL_FILTER_VALUE} onValueChange={(value) => handleFilterChange('resolutionAdmin', value)}>
                        <SelectTrigger className="h-8"><SelectValue placeholder={filterPlaceholder('interactiveTable.tableHeaders.admin')} /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_FILTER_VALUE}>{allOptionLabel}</SelectItem>
                            {uniqueResolutionAdmins.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                        </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-1">
                    <Select value={filters.resolutionTimeDays || ALL_FILTER_VALUE} onValueChange={(value) => handleFilterChange('resolutionTimeDays', value)}>
                        <SelectTrigger className="h-8 w-[120px] text-right"><SelectValue placeholder={filterPlaceholder('interactiveTable.tableHeaders.resolutionTimeDays')} /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_FILTER_VALUE}>{allOptionLabel}</SelectItem>
                            {uniqueResolutionTimeDays.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                        </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-1 text-left"> {/* ensure alignment for the header */}
                    <Select value={filters.resolutionStatus || ALL_FILTER_VALUE} onValueChange={(value) => handleFilterChange('resolutionStatus', value as TaskResolutionStatus)}>
                      <SelectTrigger className="h-8"><SelectValue placeholder={filterPlaceholder('interactiveTable.tableHeaders.actions')} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_FILTER_VALUE}>{t('interactiveTable.allStatuses')}</SelectItem>
                        {resolutionStatusOptions.map(opt => (<SelectItem key={opt} value={opt}>{getResolutionStatusDisplay(opt)}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => {
                  const taskId = task.id || task.taskReference || `task-${Math.random().toString(36).substring(2, 9)}`;
                  return (
                    <TableRow key={taskId}>
                      <TableCell>{task.taskReference || t('interactiveTable.notAvailable')}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          task.status === "Pending to Invoice Out of Time" ? "bg-orange-100 text-orange-700 dark:bg-orange-700/20 dark:text-orange-300" :
                          task.status === "Missing POD" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-700/20 dark:text-yellow-300" :
                          task.status === "Missing Estimated Dates" ? "bg-purple-100 text-purple-700 dark:bg-purple-700/20 dark:text-purple-300" :
                          "bg-gray-100 text-gray-700 dark:bg-gray-700/20 dark:text-gray-300"
                        }`}>
                          {getStatusDisplay(task.status)}
                        </span>
                      </TableCell>
                      <TableCell>{task.assignee || t('interactiveTable.notAvailable')}</TableCell>
                      <TableCell>{task.delayDays === null || task.delayDays === undefined ? t('interactiveTable.notAvailable') : String(task.delayDays)}</TableCell>
                      <TableCell>{task.customerAccount || t('interactiveTable.notAvailable')}</TableCell>
                      <TableCell className="text-right">{formatCurrency(task.netAmount)}</TableCell>
                      <TableCell>{task.transportMode || t('interactiveTable.notAvailable')}</TableCell>
                      
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
                          task.comments || <span className="text-muted-foreground italic">{t('interactiveTable.notAvailable')}</span>
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
                          task.resolutionAdmin || <span className="text-muted-foreground italic">{t('interactiveTable.notAvailable')}</span>
                        )}
                      </TableCell>
                      
                      <TableCell className="text-right">{task.resolutionTimeDays === null || task.resolutionTimeDays === undefined ? t('interactiveTable.notAvailable') : String(task.resolutionTimeDays)}</TableCell>
                      
                      <TableCell
                        onClick={() => { if (editingCellKey !== `${taskId}-resolutionStatus`) { startEdit(task, 'resolutionStatus'); } }}
                        className="text-left cursor-pointer hover:bg-muted/50"
                      >
                        {editingCellKey === `${taskId}-resolutionStatus` ? (
                          <Select
                            value={currentEditSelectValue as TaskResolutionStatus || resolutionStatusOptions[0]}
                            onValueChange={(value) => handleInlineSelectChange(taskId, 'resolutionStatus', value as TaskResolutionStatus)}
                            open={isSelectDropdownOpen}
                            onOpenChange={(openState) => {
                              setIsSelectDropdownOpen(openState);
                              if (!openState && editingCellKey === `${taskId}-resolutionStatus`) { setEditingCellKey(null); }
                            }}
                          >
                            <SelectTrigger className="w-full text-sm" autoFocus>
                              <SelectValue placeholder={t('interactiveTable.selectStatus')} />
                            </SelectTrigger>
                            <SelectContent>
                              {resolutionStatusOptions.map(opt => (
                                <SelectItem key={opt} value={opt}>{getResolutionStatusDisplay(opt)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            task.resolutionStatus === "Resuelto" ? "bg-green-100 text-green-700 dark:bg-green-700/20 dark:text-green-300" :
                            task.resolutionStatus === "SFP" ? "bg-blue-100 text-blue-700 dark:bg-blue-700/20 dark:text-blue-300" :
                            "bg-gray-100 text-gray-700 dark:bg-gray-700/20 dark:text-gray-300"
                          }`}>
                            {getResolutionStatusDisplay(task.resolutionStatus)}
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

    