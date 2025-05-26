
"use client";

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context'; // Import useLanguage

interface FileUploaderProps {
  onFileAccepted: (file: File, headers: string[], previewRows: string[][], allRows: string[][]) => void;
  isProcessing?: boolean;
}

const parseCSV = (csvText: string): { headers: string[]; rows: string[][] } => {
  const lines = csvText.trim().split(/\r\n|\n/);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  const rows = lines.slice(1).map(line => 
    line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
  );
  return { headers, rows };
};

export function FileUploader({ onFileAccepted, isProcessing }: FileUploaderProps) {
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage(); // Get the translation function

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          if (text) {
            try {
              const { headers, rows } = parseCSV(text);
              if (headers.length === 0) {
                toast({ title: t('uploadData.fileUploader.emptyFileToastTitle'), description: t('uploadData.fileUploader.emptyFileToastDescription'), variant: "destructive" });
                return;
              }
              setPreviewHeaders(headers);
              setPreviewRows(rows.slice(0, 5));
              onFileAccepted(file, headers, rows.slice(0,5), rows);
            } catch (error) {
               toast({ title: t('uploadData.fileUploader.parseErrorToastTitle'), description: (error instanceof Error ? error.message : t('uploadData.fileUploader.parseErrorToastDescription')), variant: "destructive" });
            }
          }
        };
        reader.readAsText(file);
      } else {
        toast({ title: t('uploadData.fileUploader.invalidFileToastTitle'), description: t('uploadData.fileUploader.invalidFileToastDescription'), variant: "destructive" });
      }
    }
  }, [onFileAccepted, toast, t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  });

  return (
    <div className="space-y-4">
      <Card 
        {...getRootProps()} 
        className={`border-2 border-dashed hover:border-primary transition-colors cursor-pointer 
                    ${isDragActive ? 'border-primary bg-primary/10' : 'border-border'}`}
      >
        <CardContent className="p-6 text-center">
          <input {...getInputProps()} />
          <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
          {isDragActive ? (
            <p className="mt-2 text-muted-foreground">{t('uploadData.fileUploader.dropzoneActive')}</p>
          ) : (
            <p className="mt-2 text-muted-foreground" dangerouslySetInnerHTML={{ __html: t('uploadData.fileUploader.dropzoneInactive') }}/>
          )}
        </CardContent>
      </Card>

      {isProcessing && (
        <div className="flex items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          {t('uploadData.fileUploader.processingFile')}
        </div>
      )}

      {fileName && !isProcessing && previewHeaders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('uploadData.fileUploader.previewFor', { fileName })}
            </CardTitle>
            <CardDescription>{t('uploadData.fileUploader.showingFirstNRows', { count: previewRows.length })}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {previewHeaders.map((header, index) => (
                      <TableHead key={index}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
