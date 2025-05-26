
"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Added CardDescription
import type { SystemColumn } from '@/app/upload-data/actions';

interface ColumnMapperProps {
  csvHeaders: string[];
  systemColumns: SystemColumn[];
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asignación de Columnas</CardTitle>
        <CardDescription>
          Revisa y ajusta cómo se asignan las columnas de tu archivo CSV a las columnas del sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Columna CSV</TableHead>
                <TableHead className="text-left">Mapear a Columna del Sistema</TableHead>
                <TableHead className="text-left">Requerida</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {csvHeaders.map((csvHeader) => {
                const currentSystemColName = currentMappings[csvHeader];
                const systemColDef = systemColumns.find(sc => sc.name === currentSystemColName);
                return (
                  <TableRow key={csvHeader}>
                    <TableCell className="font-medium py-3 text-left">{csvHeader}</TableCell>
                    <TableCell className="py-2 text-left">
                      <Select
                        value={currentMappings[csvHeader] || "DO_NOT_IMPORT"}
                        onValueChange={(value) => onMappingChange(csvHeader, value === "DO_NOT_IMPORT" ? null : value)}
                      >
                        <SelectTrigger className="w-[280px] sm:w-[300px] md:w-[350px]">
                          <SelectValue placeholder="Seleccionar columna del sistema" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DO_NOT_IMPORT">No importar esta columna</SelectItem>
                          {systemColumns.map((sysCol) => (
                            <SelectItem key={sysCol.name} value={sysCol.name}>
                              {sysCol.description} ({sysCol.name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-3 text-left">
                        {systemColDef?.required ? 
                            <span className="text-destructive font-medium">Sí</span> : 
                            <span className="text-muted-foreground">No</span>
                        }
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

