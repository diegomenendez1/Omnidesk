
export interface Task {
  id?: string; // Made optional
  name?: string; // Made optional
  status: "Missing Estimated Dates" | "Missing POD" | "Pending to Invoice Out of Time";
  assignee: string; // Desarrollador Logístico (Ejecutivo de Operaciones)

  // Campos para mapeo de CSV y seguimiento de órdenes
  taskReference?: string; // TO Ref. (Referencia Orden de Transporte)
  delayDays?: number | null; // Dias de atraso (Días Pendientes para Factura)
  customerAccount?: string; // Customer Account (Cuenta de Cliente)
  netAmount?: number | null; // Monto $ (Importe Neto Total Moneda Principal)
  transportMode?: string; // Transport Mode (Modo de Transporte)

  // Nuevos campos para seguimiento de administradores
  comments?: string; // Comentarios del administrador
  resolutionAdmin?: string; // Administrador asignado a la resolución
  resolutionStatus?: 'Pendiente' | 'SFP' | 'Resuelto'; // Estado de la resolución
  resolutionTimeDays?: number | null; // Días que tomó la resolución

  [key: string]: any;
}

// For AI Validation
export interface DataInconsistency {
  cell: string;
  description: string;
}

export interface ValidateDataConsistencyOutput {
  inconsistencies: DataInconsistency[];
  summary: string;
}

// For CSV Upload Mapping
export interface SystemColumnInfo {
  name: keyof Task | string;
  description: string;
  required?: boolean;
}
