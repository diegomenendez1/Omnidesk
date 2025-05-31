
"use client";

import type { TaskHistoryEntry, TaskHistoryChangeDetail } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import { enUS, es } from 'date-fns/locale'; // Import date-fns locales
import { useLanguage } from '@/context/language-context';
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TaskHistoryDialogProps {
  history: TaskHistoryEntry[] | undefined;
  taskReference: string | undefined;
  triggerButton?: React.ReactNode; // Allow custom trigger
}

function formatHistoryValue(value: any, field: string, t: Function): string {
  if (value === null || value === undefined || value === "") {
    return t('interactiveTable.notAvailable');
  }
  if (field === 'resolvedAt' || field === 'createdAt' || field === 'timestamp') { // Added 'timestamp' for consistency if ever needed
    try {
      // Date formatting is now handled directly in the table cell for timestamp
      // For oldValue/newValue, specific date formatting might still be needed if they are date strings
      if (value instanceof Date || !isNaN(new Date(value).getTime())) {
        return format(new Date(value), 'PPpp', { locale: t('localeObject') === 'es' ? es : enUS }); // Placeholder, main formatting in cell
      }
      return String(value);
    } catch {
      return String(value);
    }
  }
  if (field === 'resolutionStatus') {
    const keyMap: Record<string, string> = {
      "Pendiente": "interactiveTable.resolutionStatus.pendiente",
      "SFP": "interactiveTable.resolutionStatus.sfp",
      "Resuelto": "interactiveTable.resolutionStatus.resuelto",
    };
    return t(keyMap[value] || value);
  }
  if (field === 'status') {
     const keyMap: Record<string, string> = {
      "Missing Estimated Dates": "interactiveTable.status.missingEstimates",
      "Missing POD": "interactiveTable.status.missingPOD",
      "Pending to Invoice Out of Time": "interactiveTable.status.pendingInvoice",
    };
    return t(keyMap[value] || value);
  }
  // Could add more specific formatters here, e.g., for netAmount (currency)
  return String(value);
}


export function TaskHistoryDialog({ history, taskReference, triggerButton }: TaskHistoryDialogProps) {
  const { t, language } = useLanguage();

  const dateFnsLocale = language === 'es' ? es : enUS;

  const sortedHistory = history ? [...history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) : [];

  return (
    <Dialog>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="ghost" size="icon" title={t('interactiveTable.viewHistoryTooltip')}>
            <History className="h-4 w-4" />
            <span className="sr-only">{t('interactiveTable.viewHistoryTooltip')}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl min-h-[60vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('history.dialogTitle', { taskRef: taskReference || 'N/A' })}</DialogTitle>
          <DialogDescription>
            {t('history.dialogDescription')}
          </DialogDescription>
        </DialogHeader>
        {sortedHistory.length > 0 ? (
          <ScrollArea className="flex-grow border rounded-md mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">{t('history.timestamp')}</TableHead>
                  <TableHead className="w-[150px]">{t('history.user')}</TableHead>
                  <TableHead>{t('history.fieldChanged')}</TableHead>
                  <TableHead>{t('history.oldValue')}</TableHead>
                  <TableHead>{t('history.newValue')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedHistory.map((entry) =>
                  entry.changes.map((change, changeIndex) => (
                    <TableRow key={`${entry.id}-${changeIndex}`}>
                      <TableCell className="text-xs">
                        {format(new Date(entry.timestamp), 'PPpp', { locale: dateFnsLocale })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{entry.userName || entry.userId || t('history.systemUser')}</Badge>
                      </TableCell>
                      <TableCell>{change.fieldLabel || change.field}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{formatHistoryValue(change.oldValue, change.field, t)}</TableCell>
                      <TableCell className="font-medium">{formatHistoryValue(change.newValue, change.field, t)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <div className="flex-grow flex items-center justify-center text-muted-foreground mt-4">
            <p>{t('history.noHistory')}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
