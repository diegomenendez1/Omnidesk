
"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { SystemColumn } from '@/app/upload-data/actions';
import { useLanguage } from '@/context/language-context';

interface ColumnMapperProps {
  csvHeaders: string[];
  systemColumns: SystemColumn[]; // Descriptions here should already be translated or be keys
  suggestedMappings: { csvColumn: string; systemColumn: string | null; confidence?: number }[];
  currentMappings: Record<string, string | null>;
  onMappingChange: (csvColumn: string, systemColumn: string | null) => void;
}

export function ColumnMapper({
  csvHeaders,
  systemColumns,
  currentMappings,
  onMappingChange,
}: ColumnMapperProps) {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('uploadData.columnMappingTitle')}</CardTitle>
        <CardDescription>
           {t('uploadData.columnMappingDescription', { fileName: csvHeaders.length > 0 ? "detectadas" : "" })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">{t('uploadData.csvColumn')}</TableHead>
                <TableHead className="text-left">{t('uploadData.mapToSystemColumn')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {csvHeaders.map((csvHeader) => (
                <TableRow key={csvHeader}>
                  <TableCell className="font-medium py-3 text-left">{csvHeader}</TableCell>
                  <TableCell className="py-2 text-left">
                    <Select
                      value={currentMappings[csvHeader] || "DO_NOT_IMPORT"}
                      onValueChange={(value) => onMappingChange(csvHeader, value === "DO_NOT_IMPORT" ? null : value)}
                    >
                      <SelectTrigger className="w-[280px] sm:w-[320px] md:w-[380px]">
                        <SelectValue placeholder={t('uploadData.mapToSystemColumn')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DO_NOT_IMPORT">{t('uploadData.doNotImport')}</SelectItem>
                        {systemColumns.map((sysCol) => (
                          <SelectItem key={sysCol.name} value={sysCol.name}>
                            {/* sysCol.description is now a translation key or already translated */}
                            {sysCol.description} 
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
