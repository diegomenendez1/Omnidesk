
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
import { ScanSearch, ArrowUp, ArrowDown, Filter as FilterIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const resolutionStatusOptions: TaskResolutionStatus[] = ["Pendiente", "SFP", "Resuelto"];
const statusOptions: TaskStatus[] = ["Missing Estimated Dates", "Missing POD", "Pending to Invoice Out of Time"];

const ALL_FILTER_VALUE = "_ALL_VALUES_"; 

type SortDirection = 'ascending' | 'descending';
interface SortConfig {
  key: keyof Task | null;
  direction: SortDirection | null;
}

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
  const [currentEditSelectValue, setCurrentEditSelectValue] = useState<TaskResolutionStatus | TaskStatus | ''>('');
  const [isSelectDropdownOpen, setIsSelectDropdownOpen] = useState(false);

  const [filters, setFilters] = useState<Partial<Record<keyof Task, string | undefined>>>({});
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });


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
  }, [t]); // t is added as a dependency because it's used in toast messages

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
     if (!editingCellKey || !taskIdentifier || (!editingCellKey.startsWith(taskIdentifier.id || String(Math.random())) && !editingCellKey.startsWith(taskIdentifier.taskReference || String(Math.random())))) return;

    setTasks(prevTasks =>
      prevTasks.map(task => {
        const currentId = task.id || task.taskReference;
        const targetId = taskId;
        if (currentId === targetId) {
          return { ...task, [column]: currentEditText };
        }
        return task;
      })
    );
    setEditingCellKey(null);
    setCurrentEditText("");
    toast({ title: t('interactiveTable.fieldUpdated'), description: t('interactiveTable.changeSavedFor', { field: t(`interactiveTable.tableHeaders.${column}` as any, String(column))}) });
  };

  const handleInlineSelectChange = (taskId: string, column: keyof Task, value: string) => {
     setTasks(prevTasks =>
      prevTasks.map(task => {
        const currentId = task.id || task.taskReference;
        const targetId = taskId;
        if (currentId === targetId) {
          return { ...task, [column]: value };
        }
        return task;
      })
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
      const stringVal = (val === null || val === undefined) 
                        ? t('interactiveTable.notAvailable') 
                        : String(val);
      
      if (stringVal.trim() !== "" && stringVal !== t('interactiveTable.notAvailable')) { 
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
  const uniqueDelayDays = useMemo(() => getUniqueValuesForColumn('delayDays'), [tasks, t]);
  const uniqueCustomerAccounts = useMemo(() => getUniqueValuesForColumn('customerAccount'), [tasks, t]);
  const uniqueNetAmounts = useMemo(() => {
    const numericValues = new Set<string>();
    tasks.forEach(task => {
        if (task.netAmount !== null && task.netAmount !== undefined) {
            numericValues.add(String(task.netAmount));
        }
    });
    return Array.from(numericValues).sort((a,b) => parseFloat(a) - parseFloat(b));
  }, [tasks]);
  const uniqueTransportModes = useMemo(() => getUniqueValuesForColumn('transportMode'), [tasks, t]);
  const uniqueResolutionAdmins = useMemo(() => getUniqueValuesForColumn('resolutionAdmin'), [tasks, t]);
  const uniqueResolutionTimeDays = useMemo(() => getUniqueValuesForColumn('resolutionTimeDays'), [tasks, t]);


  const filteredTasks = useMemo(() => tasks.filter(task => {
    return Object.entries(filters).every(([columnKeyStr, filterValue]) => {
      const columnKey = columnKeyStr as keyof Task;
      if (filterValue === undefined) return true;

      const taskValue = task[columnKey];
      let taskValueString: string;

      if (taskValue === null || taskValue === undefined) {
        taskValueString = t('interactiveTable.notAvailable');
      } else {
        taskValueString = String(taskValue);
      }
      
      if (columnKey === 'comments') { 
        return taskValueString.toLowerCase().includes(String(filterValue).toLowerCase());
      }
      return taskValueString === filterValue;
    });
  }), [tasks, filters, t]);

  const requestSort = (key: keyof Task) => {
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
        const valA = a[key];
        const valB = b[key];

        if ((valA === null || typeof valA === 'undefined') && (valB !== null && typeof valB !== 'undefined')) return 1;
        if ((valB === null || typeof valB === 'undefined') && (valA !== null && typeof valA !== 'undefined')) return -1;
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
  }, [filteredTasks, sortConfig]);
  
  const allOptionLabel = t('interactiveTable.filterAllOption');
  const filterActionPlaceholder = t('interactiveTable.filterActionPlaceholder');

  const renderSortIcon = (columnKey: keyof Task) => {
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
            <span className="sr-only">Filter {t(columnLabelKey as any)}</span>
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
                  {columnKey === 'netAmount' ? formatCurrency(parseFloat(opt)) : opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PopoverContent>
      </Popover>
    );
  };


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
                  <TableHead className="group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 cursor-pointer flex-grow py-3 pr-2" onClick={() => requestSort('taskReference')}>
                        {t('interactiveTable.tableHeaders.toRef')}
                        {renderSortIcon('taskReference')}
                      </div>
                      {renderFilterPopover('taskReference', 'interactiveTable.tableHeaders.toRef', uniqueTaskReferences)}
                    </div>
                  </TableHead>

                  <TableHead className="group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 cursor-pointer flex-grow py-3 pr-2" onClick={() => requestSort('status')}>
                        {t('interactiveTable.tableHeaders.toStatus')}
                        {renderSortIcon('status')}
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-7 w-7 opacity-60 hover:opacity-100 data-[state=open]:opacity-100 data-[state=open]:bg-accent">
                            <FilterIcon className="h-4 w-4" />
                            <span className="sr-only">Filter {t('interactiveTable.tableHeaders.toStatus')}</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-60 p-2" align="start">
                          <Select value={filters.status || ALL_FILTER_VALUE} onValueChange={(value) => handleFilterChange('status', value as TaskStatus)}>
                            <SelectTrigger className="h-8"><SelectValue placeholder={filterActionPlaceholder} /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value={ALL_FILTER_VALUE}>{t('interactiveTable.allStatuses')}</SelectItem>
                              {statusOptions.map(opt => (<SelectItem key={opt} value={opt}>{getStatusDisplay(opt)}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </TableHead>
                  
                  <TableHead className="group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 cursor-pointer flex-grow py-3 pr-2" onClick={() => requestSort('assignee')}>
                        {t('interactiveTable.tableHeaders.logisticDeveloper')}
                        {renderSortIcon('assignee')}
                      </div>
                      {renderFilterPopover('assignee', 'interactiveTable.tableHeaders.logisticDeveloper', uniqueAssignees)}
                    </div>
                  </TableHead>

                  <TableHead className="group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 cursor-pointer flex-grow py-3 pr-2" onClick={() => requestSort('delayDays')}>
                        {t('interactiveTable.tableHeaders.delayDays')}
                        {renderSortIcon('delayDays')}
                      </div>
                      {renderFilterPopover('delayDays', 'interactiveTable.tableHeaders.delayDays', uniqueDelayDays, true)}
                    </div>
                  </TableHead>

                  <TableHead className="group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 cursor-pointer flex-grow py-3 pr-2" onClick={() => requestSort('customerAccount')}>
                        {t('interactiveTable.tableHeaders.customerAccount')}
                        {renderSortIcon('customerAccount')}
                      </div>
                      {renderFilterPopover('customerAccount', 'interactiveTable.tableHeaders.customerAccount', uniqueCustomerAccounts)}
                    </div>
                  </TableHead>

                  <TableHead className="group text-right">
                     <div className="flex items-center justify-between">
                      <div className="flex items-center justify-end gap-1 cursor-pointer flex-grow py-3 pr-2" onClick={() => requestSort('netAmount')}>
                        {t('interactiveTable.tableHeaders.amount')}
                        {renderSortIcon('netAmount')}
                      </div>
                      {renderFilterPopover('netAmount', 'interactiveTable.tableHeaders.amount', uniqueNetAmounts, true)}
                    </div>
                  </TableHead>

                  <TableHead className="group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 cursor-pointer flex-grow py-3 pr-2" onClick={() => requestSort('transportMode')}>
                        {t('interactiveTable.tableHeaders.transportMode')}
                        {renderSortIcon('transportMode')}
                      </div>
                      {renderFilterPopover('transportMode', 'interactiveTable.tableHeaders.transportMode', uniqueTransportModes)}
                    </div>
                  </TableHead>

                  <TableHead className="group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 cursor-pointer flex-grow py-3 pr-2" onClick={() => requestSort('comments')}>
                        {t('interactiveTable.tableHeaders.comments')}
                        {renderSortIcon('comments')}
                      </div>
                       <Popover>
                        <PopoverTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-7 w-7 opacity-60 hover:opacity-100 data-[state=open]:opacity-100 data-[state=open]:bg-accent">
                            <FilterIcon className="h-4 w-4" />
                            <span className="sr-only">Filter {t('interactiveTable.tableHeaders.comments')}</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-2" align="start">
                          <Input
                            placeholder={t('interactiveTable.filterBy', { columnName: t('interactiveTable.tableHeaders.comments') })}
                            value={String(filters.comments || '')}
                            onChange={(e) => handleFilterChange('comments', e.target.value)}
                            className="h-8"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </TableHead>

                  <TableHead className="group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 cursor-pointer flex-grow py-3 pr-2" onClick={() => requestSort('resolutionAdmin')}>
                        {t('interactiveTable.tableHeaders.admin')}
                        {renderSortIcon('resolutionAdmin')}
                      </div>
                      {renderFilterPopover('resolutionAdmin', 'interactiveTable.tableHeaders.admin', uniqueResolutionAdmins)}
                    </div>
                  </TableHead>

                  <TableHead className="group text-right">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center justify-end gap-1 cursor-pointer flex-grow py-3 pr-2" onClick={() => requestSort('resolutionTimeDays')}>
                         {t('interactiveTable.tableHeaders.resolutionTimeDays')}
                         {renderSortIcon('resolutionTimeDays')}
                      </div>
                      {renderFilterPopover('resolutionTimeDays', 'interactiveTable.tableHeaders.resolutionTimeDays', uniqueResolutionTimeDays, true)}
                    </div>
                  </TableHead>

                  <TableHead className="group text-left"> {/* Changed from Actions to Estado Resolución for filter context */}
                     <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 cursor-pointer flex-grow py-3 pr-2" onClick={() => requestSort('resolutionStatus')}>
                        {t('interactiveTable.tableHeaders.actions')} {/* Display name is Actions */}
                        {renderSortIcon('resolutionStatus')}
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-7 w-7 opacity-60 hover:opacity-100 data-[state=open]:opacity-100 data-[state=open]:bg-accent">
                            <FilterIcon className="h-4 w-4" />
                             <span className="sr-only">Filter {t('interactiveTable.tableHeaders.actions')}</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-60 p-2" align="start">
                          <Select value={filters.resolutionStatus || ALL_FILTER_VALUE} onValueChange={(value) => handleFilterChange('resolutionStatus', value as TaskResolutionStatus)}>
                            <SelectTrigger className="h-8"><SelectValue placeholder={filterActionPlaceholder} /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value={ALL_FILTER_VALUE}>{t('interactiveTable.allStatuses')}</SelectItem>
                              {resolutionStatusOptions.map(opt => (<SelectItem key={opt} value={opt}>{getResolutionStatusDisplay(opt)}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTasks.map((task) => {
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
                            <SelectTrigger className="w-full text-sm h-8" autoFocus>
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
    

    

    