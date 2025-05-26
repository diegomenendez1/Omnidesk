
"use client";

import type { ValidateDataConsistencyOutput } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

interface DataValidationReportProps {
  result: ValidateDataConsistencyOutput;
}

export function DataValidationReport({ result }: DataValidationReportProps) {
  const { t } = useLanguage();
  const hasInconsistencies = result.inconsistencies && result.inconsistencies.length > 0;

  return (
    <Card className="mt-6 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {hasInconsistencies ? (
            <AlertCircle className="h-6 w-6 text-destructive" />
          ) : (
            <CheckCircle2 className="h-6 w-6 text-[hsl(var(--success))]" />
          )}
          {t('dataValidationReport.title')}
        </CardTitle>
        <CardDescription>{result.summary}</CardDescription> {/* Assuming summary is already translated or a key */}
      </CardHeader>
      <CardContent>
        {hasInconsistencies ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle>{t('dataValidationReport.inconsistenciesFound')}</AlertTitle>
              <AlertDescription>
                {t('dataValidationReport.inconsistenciesFoundDescription')}
              </AlertDescription>
            </Alert>
            <div className="max-h-96 overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">{t('dataValidationReport.cell')}</TableHead>
                    <TableHead>{t('dataValidationReport.description')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.inconsistencies.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.cell}</TableCell>
                      <TableCell>{item.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <Alert className="border-[hsl(var(--success))] bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]">
             <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))]" />
            <AlertTitle className="text-[hsl(var(--success))]">{t('dataValidationReport.noInconsistenciesFound')}</AlertTitle>
            <AlertDescription className="text-[hsl(var(--success))] opacity-90">
              {t('dataValidationReport.noInconsistenciesFoundDescription')}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
