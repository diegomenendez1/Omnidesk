// src/types/task.ts

/**
 * Define un tipo para el estado de la tarea para mejorar la seguridad del tipo.
 * (Defines a type for task status for better type safety)
 */
export type TaskStatus = 
  | 'pendiente'     // (Pending)
  | 'en-progreso'   // (In Progress)
  | 'en-revision'   // (In Review)
  | 'completada'    // (Completed)
  | 'archivada'     // (Archived)
  | 'backlog';      // (Backlog)

/**
 * Define un tipo para la prioridad de la tarea.
 * (Defines a type for task priority)
 */
export type TaskPriority = 
  | 'baja'          // (Low)
  | 'media'         // (Medium)
  | 'alta'          // (High)
  | 'critica';      // (Critical)

/**
 * Interfaz para comentarios individuales dentro de una tarea.
 * (Interface for individual comments within a task)
 */
export interface TaskComment {
  commentId: string;       // ID único para el comentario (Unique ID for the comment)
  userId: string;          // ID del usuario que publicó el comentario (ID of the user who posted the comment)
  userName: string;        // Nombre del usuario (para mostrar) (Name of the user (for display))
  text: string;            // Contenido del comentario (Content of the comment)
  createdAt: Date;         // Fecha y hora de creación del comentario (Timestamp of when the comment was created)
                           // En Firestore, esto sería un Timestamp: firebase.firestore.Timestamp
  updatedAt?: Date;        // Fecha y hora de la última actualización (opcional) (Timestamp of last update (optional))
                           // En Firestore, esto sería un Timestamp: firebase.firestore.Timestamp
}

/**
 * Interfaz principal para una Tarea/Incidencia.
 * Define la estructura de los documentos en la colección 'tasks' de Firestore.
 * (Main interface for a Task/Issue. Defines the structure of documents in the 'tasks' Firestore collection.)
 */
export interface Task {
  id: string;                    // ID único del documento Firestore para la tarea (Firestore document's unique ID for the task)
  
  referenceId?: string;          // Referencia única legible por humanos (ej. INC-001, TSK-1023) (Human-readable unique reference)
  
  title: string;                 // Título de la tarea o incidencia (Title of the task or issue)
  
  description?: string;          // Descripción detallada de la tarea (opcional) (Detailed description (optional))
  
  status: TaskStatus;            // Estado actual de la tarea (Current status of the task)
  
  priority?: TaskPriority;       // Prioridad de la tarea (opcional) (Task priority (optional))
  
  assigneeId?: string;           // ID del usuario administrador o asignado a la tarea (User ID of the admin or assigned user)
  
  reporterId: string;            // ID del usuario que creó o reportó la tarea (User ID of the reporter/creator)
  
  projectId?: string;            // ID del proyecto al que pertenece esta tarea (opcional) (Project ID (optional))
  
  createdAt: Date;               // Fecha y hora de creación de la tarea (Task creation timestamp)
                                 // En Firestore, esto sería un Timestamp: firebase.firestore.Timestamp
                                 
  updatedAt: Date;               // Fecha y hora de la última actualización de la tarea (Task last update timestamp)
                                 // En Firestore, esto sería un Timestamp: firebase.firestore.Timestamp
                                 
  dueDate?: Date;                // Fecha de vencimiento para la tarea (opcional) (Due date (optional))
                                 // En Firestore, esto sería un Timestamp: firebase.firestore.Timestamp
                                 
  completedAt?: Date;            // Fecha y hora de completitud de la tarea (opcional) (Task completion timestamp (optional))
                                 // En Firestore, esto sería un Timestamp: firebase.firestore.Timestamp

  progress?: number;             // Progreso de la tarea (ej. 0-100), útil si no se usan subtareas (Task progress (e.g., 0-100))
                                 // Podría ser calculado o manual. (Could be calculated or manual)

  tags?: string[];               // Etiquetas para categorizar o filtrar (ej. ['bug', 'feature', 'urgent']) (Tags for categorization)
  
  comments?: TaskComment[];      // Array de comentarios. Alternativamente, podría ser una subcolección en Firestore.
                                 // (Array of comments. Alternatively, could be a Firestore subcollection.)

  // Otros campos que la aplicación podría ya estar usando o necesitar:
  // (Other fields the app might already use or need):
  // attachments?: { name: string, url: string }[]; // Archivos adjuntos (Attachments)
  // historyLog?: { userId: string, timestamp: Date, action: string, changes: object }[]; // Historial de cambios (Change history)
}
