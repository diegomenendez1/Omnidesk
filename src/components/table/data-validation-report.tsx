"use client";

import type { ValidateDataConsistencyOutput } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface DataValidationReportProps {
  result: ValidateDataConsistencyOutput;
}

export function DataValidationReport({ result }: DataValidationReportProps) {
  const hasInconsistencies = result.inconsistencies && result.inconsistencies.length > 0;

  return (
    <Card className="mt-6 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {hasInconsistencies ? (
            <AlertCircle className="h-6 w-6 text-destructive" />
          ) : (
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          )}
          AI Data Validation Report
        </CardTitle>
        <CardDescription>{result.summary}</CardDescription>
      </CardHeader>
      <CardContent>
        {hasInconsistencies ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTitle>Inconsistencies Found</AlertTitle>
              <AlertDescription>
                The following potential issues were detected in your data. Please review them carefully.
              </AlertDescription>
            </Alert>
            <div className="max-h-96 overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Cell</TableHead>
                    <TableHead>Description</TableHead>
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
          <Alert variant="default" className="border-green-500 bg-green-50">
             <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-700">No Inconsistencies Found</AlertTitle>
            <AlertDescription className="text-green-600">
              The AI scan completed successfully and found no inconsistencies in the current dataset.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
