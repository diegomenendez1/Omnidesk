
"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { SystemColumn } from '@/app/upload-data/actions'; // Using the extended type

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
  // suggestedMappings is used to pre-fill, currentMappings holds the live state
  currentMappings,
  onMappingChange,
}: ColumnMapperProps) {

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asignación de Columnas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Columna CSV</TableHead>
                <TableHead>Mapear a Columna del Sistema</TableHead>
                <TableHead>Requerida</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {csvHeaders.map((csvHeader) => {
                const currentSystemCol = currentMappings[csvHeader];
                const systemColDef = systemColumns.find(sc => sc.name === currentSystemCol);
                return (
                  <TableRow key={csvHeader}>
                    <TableCell className="font-medium py-3">{csvHeader}</TableCell>
                    <TableCell className="py-2">
                      <Select
                        value={currentMappings[csvHeader] || "DO_NOT_IMPORT"}
                        onValueChange={(value) => onMappingChange(csvHeader, value === "DO_NOT_IMPORT" ? null : value)}
                      >
                        <SelectTrigger className="w-[250px]">
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
                    <TableCell className="py-3">
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
