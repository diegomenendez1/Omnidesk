
export type Locale = 'en' | 'es';

// Helper type for ensuring key validity
type PathImpl<T, K extends keyof T> = K extends string
  ? T[K] extends Record<string, any>
    ? T[K] extends Array<any> 
      ? `${K}` 
      : `${K}.${PathImpl<T[K], Exclude<keyof T[K], keyof any[]>> & string}`
    : `${K}`
  : never;

type Path<T> = PathImpl<T, keyof T>;

// Example base for TranslationKey type generation (assuming 'en' has all keys)
type TranslationNamespaces = Translations['en'];
export type TranslationKey = Path<TranslationNamespaces>;


export interface Translations {
  [key: string]: any; // Allow any structure for now
  en: {
    appName: string;
    pageHeader: {
      searchPlaceholder: string;
      notifications: string;
      myAccount: string;
      profile: string;
      settings: string;
      logout: string; 
      dashboard: string;
      interactiveTable: string;
      uploadData: string;
      language: string;
      english: string;
      spanish: string;
      login: string; 
      admin: {
        userManagement: string;
        addNewUser: string;
        nameLabel: string;
        emailLabel: string;
        passwordLabel: string;
        roleLabel: string;
        roleOwner: string;
        roleAdmin: string;
        roleUser: string;
        addUserButton: string;
        userAddedSuccessfully: string;
        errorAddingUser: string;
      };
      theme: { 
        toggle: string;
        title: string;
        light: string;
        dark: string;
        system: string;
      };
    };
    sidebar: {
      dashboard: string;
      interactiveTable: string;
      uploadData: string;
      adminUser: string;
      adminEmail: string;
      userManagement: string; 
    };
    dashboard: {
      totalTasks: string;
      activeProjects: string;
      tasksCompleted: string;
      teamMembers: string;
      acrossAllProjects: string;
      fromLastWeek: string;
      thisMonth: string;
      activeUsers: string;
      taskProgressOverview: string;
      taskDistributionByStatus: string;
      projectSpotlight: string;
      highlightingKeyProject: string;
      projectPhoenixTitle: string;
      projectPhoenixDescription: string;
      progress: string;
      deadline: string;
      recentActivity: string;
      latestUpdates: string;
      activityCompletedTask: string;
      activityUpdatedStatus: string;
      activityAddedNewTask: string;
      hoursAgo: string;
      daysAgo: string;
      todo: string;
      inProgress: string;
      completed: string;
      blocked: string;
    };
    interactiveTable: {
      title: string;
      validateWithAI: string;
      validating: string;
      validationComplete: string;
      validationFailed: string;
      validationFailedDescription: string;
      fieldUpdated: string;
      changeSavedFor: string;
      tableHeaders: {
        toRef: string;
        toStatus: string;
        logisticDeveloper: string;
        delayDays: string;
        customerAccount: string;
        amount: string;
        transportMode: string;
        comments: string;
        admin: string;
        resolutionTimeDays: string;
        history: string; 
        actions: string; 
      };
      status: { 
        missingEstimates: string;
        missingPOD: string;
        pendingInvoice: string;
      };
      resolutionStatus: { 
        pendiente: string;
        sfp: string;
        resuelto: string;
      };
      notAvailable: string;
      selectStatus: string;
      filterBy: string;
      allStatuses: string;
      filterAllOption: string; 
      filterActionPlaceholder: string;
      viewHistoryTooltip: string; 
      viewingHistory: string; 
      historyFeaturePlaceholder: string; 
    };
    uploadData: {
      title: string;
      description: string;
      fileAcceptedToastTitle: string;
      fileAcceptedToastDescription: string;
      columnMappingTitle: string;
      columnMappingDescription: string;
      csvColumn: string;
      mapToSystemColumn: string;
      doNotImport: string;
      cancel: string;
      confirmAndProcess: string;
      processing: string;
      noDataToProcess: string;
      incompleteMapping: string;
      pleaseMapRequired: string;
      dataProcessed: string;
      tasksProcessedAndSaved: string;
      errorSavingLocally: string;
      errorSavingLocallyDescription: string;
      previewTitle: string;
      uploadAnotherFile: string;
      redirectingToTable: string;
      systemColumns: {
        status: string;
        assignee: string;
        taskReference: string;
        delayDays: string;
        customerAccount: string;
        netAmount: string;
        transportMode: string;
        comments: string;
        resolutionAdmin: string;
        resolutionStatus: string;
        resolutionTimeDays: string;
      };
      fileUploader: {
        dropzoneActive: string;
        dropzoneInactive: string;
        processingFile: string;
        previewFor: string;
        showingFirstNRows: string;
        invalidFileToastTitle: string;
        invalidFileToastDescription: string;
        emptyFileToastTitle: string;
        emptyFileToastDescription: string;
        parseErrorToastTitle: string;
        parseErrorToastDescription: string;
      };
      aiErrorToastTitle: string;
      aiErrorToastDescription: string;
      backup: {
        dialogTitle: string;
        dialogDescription: string;
        backupAndContinueButton: string;
        continueWithoutBackupButton: string;
        successTitle: string;
        successDescription: string;
      };
    };
    dataValidationReport: {
      title: string;
      inconsistenciesFound: string;
      inconsistenciesFoundDescription: string;
      noInconsistenciesFound: string;
      noInconsistenciesFoundDescription: string;
      cell: string;
      description: string;
    };
    localStorage: {
      loadedData: string;
      loadedTasksDescription: string;
      errorLoadingData: string;
      errorLoadingDataDescription: string;
    };
    loginPage: { 
      titleLogin: string;
      descriptionLogin: string;
      titleRegister: string;
      descriptionRegister: string;
      emailLabel: string;
      passwordLabel: string;
      loginButton: string;
      registerButton: string;
      noAccount: string;
      hasAccount: string;
      registerLink: string;
      loginLink: string;
      error: {
        invalidCredentials: string; 
        userNotFound: string; 
        wrongPassword: string; 
        generic: string; 
        invalidEmail: string; 
        userDisabled: string; 
        emailInUse: string; 
        weakPassword: string; 
        requiresRecentLogin: string; 
        passwordRequired: string;
        networkError: string;
        apiKeyInvalid: string; // New key for invalid API key
      }
    };
  };
  es: {
    appName: string;
    pageHeader: {
      searchPlaceholder: string;
      notifications: string;
      myAccount: string;
      profile: string;
      settings: string;
      logout: string; 
      dashboard: string;
      interactiveTable: string;
      uploadData: string;
      language: string;
      english: string;
      spanish: string;
      login: string;
      admin: { 
        userManagement: string;
        addNewUser: string;
        nameLabel: string;
        emailLabel: string;
        passwordLabel: string;
        roleLabel: string;
        roleOwner: string;
        roleAdmin: string;
        roleUser: string;
        addUserButton: string;
        userAddedSuccessfully: string;
        errorAddingUser: string;
      }; 
      theme: { 
        toggle: string;
        title: string;
        light: string;
        dark: string;
        system: string;
      };
    };
    sidebar: {
      dashboard: string;
      interactiveTable: string;
      uploadData: string;
      adminUser: string;
      adminEmail: string;
      userManagement: string;
    };
    dashboard: {
      totalTasks: string;
      activeProjects: string;
      tasksCompleted: string;
      teamMembers: string;
      acrossAllProjects: string;
      fromLastWeek: string;
      thisMonth: string;
      activeUsers: string;
      taskProgressOverview: string;
      taskDistributionByStatus: string;
      projectSpotlight: string;
      highlightingKeyProject: string;
      projectPhoenixTitle: string;
      projectPhoenixDescription: string;
      progress: string;
      deadline: string;
      recentActivity: string;
      latestUpdates: string;
      activityCompletedTask: string;
      activityUpdatedStatus: string;
      activityAddedNewTask: string;
      hoursAgo: string;
      daysAgo: string;
      todo: string;
      inProgress: string;
      completed: string;
      blocked: string;
    };
    interactiveTable: {
      title: string;
      validateWithAI: string;
      validating: string;
      validationComplete: string;
      validationFailed: string;
      validationFailedDescription: string;
      fieldUpdated: string;
      changeSavedFor: string;
      tableHeaders: {
        toRef: string;
        toStatus: string;
        logisticDeveloper: string;
        delayDays: string;
        customerAccount: string;
        amount: string;
        transportMode: string;
        comments: string;
        admin: string;
        resolutionTimeDays: string;
        history: string; 
        actions: string;
      };
      status: {
        missingEstimates: string;
        missingPOD: string;
        pendingInvoice: string;
      };
      resolutionStatus: {
        pendiente: string;
        sfp: string;
        resuelto: string;
      };
      notAvailable: string;
      selectStatus: string;
      filterBy: string;
      allStatuses: string;
      filterAllOption: string;
      filterActionPlaceholder: string;
      viewHistoryTooltip: string; 
      viewingHistory: string; 
      historyFeaturePlaceholder: string; 
    };
    uploadData: {
      title: string;
      description: string;
      fileAcceptedToastTitle: string;
      fileAcceptedToastDescription: string;
      columnMappingTitle: string;
      columnMappingDescription: string;
      csvColumn: string;
      mapToSystemColumn: string;
      doNotImport: string;
      cancel: string;
      confirmAndProcess: string;
      processing: string;
      noDataToProcess: string;
      incompleteMapping: string;
      pleaseMapRequired: string;
      dataProcessed: string;
      tasksProcessedAndSaved: string;
      errorSavingLocally: string;
      errorSavingLocallyDescription: string;
      previewTitle: string;
      uploadAnotherFile: string;
      redirectingToTable: string;
      systemColumns: {
        status: string;
        assignee: string;
        taskReference: string;
        delayDays: string;
        customerAccount: string;
        netAmount: string;
        transportMode: string;
        comments: string;
        resolutionAdmin: string;
        resolutionStatus: string;
        resolutionTimeDays: string;
      };
      fileUploader: {
        dropzoneActive: string;
        dropzoneInactive: string;
        processingFile: string;
        previewFor: string;
        showingFirstNRows: string;
        invalidFileToastTitle: string;
        invalidFileToastDescription: string;
        emptyFileToastTitle: string;
        emptyFileToastDescription: string;
        parseErrorToastTitle: string;
        parseErrorToastDescription: string;
      };
      aiErrorToastTitle: string;
      aiErrorToastDescription: string;
      backup: {
        dialogTitle: string;
        dialogDescription: string;
        backupAndContinueButton: string;
        continueWithoutBackupButton: string;
        successTitle: string;
        successDescription: string;
      };
    };
    dataValidationReport: {
      title: string;
      inconsistenciesFound: string;
      inconsistenciesFoundDescription: string;
      noInconsistenciesFound: string;
      noInconsistenciesFoundDescription: string;
      cell: string;
      description: string;
    };
    localStorage: {
      loadedData: string;
      loadedTasksDescription: string;
      errorLoadingData: string;
      errorLoadingDataDescription: string;
    };
    loginPage: { 
      titleLogin: string;
      descriptionLogin: string;
      titleRegister: string;
      descriptionRegister: string;
      emailLabel: string;
      passwordLabel: string;
      loginButton: string;
      registerButton: string;
      noAccount: string;
      hasAccount: string;
      registerLink: string;
      loginLink: string;
      error: {
        invalidCredentials: string; 
        userNotFound: string; 
        wrongPassword: string; 
        generic: string; 
        invalidEmail: string; 
        userDisabled: string; 
        emailInUse: string; 
        weakPassword: string; 
        requiresRecentLogin: string; 
        passwordRequired: string;
        networkError: string;
        apiKeyInvalid: string; // New key for invalid API key
      }
    };
  }
}


export const translations: Translations = {
  en: {
    appName: "OmniDeck",
    pageHeader: {
      searchPlaceholder: "Search...",
      notifications: "Toggle notifications",
      myAccount: "My Account",
      profile: "Profile",
      settings: "Settings",
      logout: "Logout",
      dashboard: "Dashboard",
      interactiveTable: "Interactive Table",
      uploadData: "Upload Data",
      language: "Language",
      english: "English",
      spanish: "Español",
      login: "Login",
      admin: {
        userManagement: "User Management",
        addNewUser: "Add New User",
        nameLabel: "Name",
        emailLabel: "Email",
        passwordLabel: "Password",
        roleLabel: "Role",
        roleOwner: "Owner",
        roleAdmin: "Administrator",
        roleUser: "User",
        addUserButton: "Add User",
        userAddedSuccessfully: "User added successfully!",
        errorAddingUser: "Error adding user.",
      },
      theme: { 
        toggle: "Toggle theme",
        title: "Theme",
        light: "Light",
        dark: "Dark",
        system: "System",
      },
    },
    sidebar: {
      dashboard: "Dashboard",
      interactiveTable: "Interactive Table",
      uploadData: "Upload Data",
      adminUser: "Admin User",
      adminEmail: "admin@omnideck.com",
      userManagement: "User Management",
    },
    dashboard: {
      totalTasks: "Total Tasks",
      activeProjects: "Active Projects",
      tasksCompleted: "Tasks Completed",
      teamMembers: "Team Members",
      acrossAllProjects: "Across all projects",
      fromLastWeek: "+2 from last week",
      thisMonth: "This month",
      activeUsers: "Active users",
      taskProgressOverview: "Task Progress Overview",
      taskDistributionByStatus: "A quick look at task distribution by status.",
      projectSpotlight: "Project Spotlight",
      highlightingKeyProject: "Highlighting a key ongoing project.",
      projectPhoenixTitle: "Project Phoenix",
      projectPhoenixDescription: "This initiative aims to revamp our core platform, enhancing user experience and performance. Currently in the development phase with major milestones approaching.",
      progress: "Progress",
      deadline: "Deadline",
      recentActivity: "Recent Activity",
      latestUpdates: "Latest updates from your team.",
      activityCompletedTask: "{user} completed task '{taskName}'",
      activityUpdatedStatus: "{user} updated status of '{taskName}' to {status}",
      activityAddedNewTask: "{user} added a new task '{taskName}'",
      hoursAgo: "{count} hours ago",
      daysAgo: "{count} days ago",
      todo: "To Do",
      inProgress: "In Progress",
      completed: "Completed",
      blocked: "Blocked",
    },
    interactiveTable: {
      title: "Tasks Overview",
      validateWithAI: "Validate Data with AI",
      validating: "Validating...",
      validationComplete: "Data Validation Complete",
      validationFailed: "Data Validation Failed",
      validationFailedDescription: "An unknown error occurred during data validation.",
      fieldUpdated: "Field updated",
      changeSavedFor: "Saved change for {field}",
      tableHeaders: {
        toRef: "TO Ref.",
        toStatus: "TO Status",
        logisticDeveloper: "Logistic Developer",
        delayDays: "Delay Days",
        customerAccount: "Customer Acc.",
        amount: "Amount $",
        transportMode: "Transport Mode",
        comments: "Comments",
        admin: "Administrator",
        resolutionTimeDays: "Resolution Time (days)",
        history: "History", 
        actions: "Actions", 
      },
      status: { 
        missingEstimates: "Missing Estimated Dates",
        missingPOD: "Missing POD",
        pendingInvoice: "Pending to Invoice Out of Time",
      },
      resolutionStatus: { 
        pendiente: "Pending",
        sfp: "SFP",
        resuelto: "Resolved",
      },
      notAvailable: "N/A",
      selectStatus: "Select status",
      filterBy: "Filter by {columnName}",
      allStatuses: "All Statuses",
      filterAllOption: "All", 
      filterActionPlaceholder: "Filter...",
      viewHistoryTooltip: "View history",
      viewingHistory: "Viewing history for task {taskId}",
      historyFeaturePlaceholder: "History feature is not yet implemented.",
    },
    uploadData: {
      title: "Upload Data from CSV",
      description: "Upload a CSV file, map columns, and update your data.",
      fileAcceptedToastTitle: "CSV File Uploaded",
      fileAcceptedToastDescription: "Please review the column mapping.",
      columnMappingTitle: "Column Mapping",
      columnMappingDescription: "Review and adjust how your CSV columns ({fileName}) map to system columns.",
      csvColumn: "CSV Column",
      mapToSystemColumn: "Map to System Column",
      doNotImport: "Do not import this column",
      cancel: "Cancel",
      confirmAndProcess: "Confirm Mapping & Process Data",
      processing: "Processing...",
      noDataToProcess: "No data to process",
      incompleteMapping: "Incomplete Mapping",
      pleaseMapRequired: "Please map the following required system columns: {columns}",
      dataProcessed: "Data Processed",
      tasksProcessedAndSaved: "{count} tasks processed and saved to local storage.",
      errorSavingLocally: "Error saving data locally",
      errorSavingLocallyDescription: "Could not save data for the interactive table. Preview is still available on this page.",
      previewTitle: "Preview of Processed Data (first 10 rows)",
      uploadAnotherFile: "Upload another file",
      redirectingToTable: " Redirecting to Interactive Table...",
      systemColumns: {
        status: "TO Status",
        assignee: "Logistic Developer",
        taskReference: "TO Ref.",
        delayDays: "Delay Days",
        customerAccount: "Customer Acc.",
        netAmount: "Amount $",
        transportMode: "Transport Mode",
        comments: "Comments",
        resolutionAdmin: "Administrator",
        resolutionStatus: "Estado de Resolución", // Corrected key for consistency, was "Estado Resolución"
        resolutionTimeDays: "Tiempo Resolución (días)",
      },
      fileUploader: {
        dropzoneActive: "Drop CSV file here...",
        dropzoneInactive: "Drag & drop a CSV file here, or <span class=\"text-primary\">click to select</span>.",
        processingFile: "Processing file...",
        previewFor: "Preview for: {fileName}",
        showingFirstNRows: "Showing the first {count} rows of data.",
        invalidFileToastTitle: "Invalid File",
        invalidFileToastDescription: "Please upload a .csv file.",
        emptyFileToastTitle: "CSV file empty or invalid",
        emptyFileToastDescription: "The header is empty.",
        parseErrorToastTitle: "Error parsing CSV",
        parseErrorToastDescription: "Invalid CSV file format.",
      },
      aiErrorToastTitle: "Error getting AI suggestions",
      aiErrorToastDescription: "Some columns could not be mapped automatically. Please review them manually.",
      backup: {
        dialogTitle: "Backup Confirmation",
        dialogDescription: "Existing data will be overwritten. Do you want to back up the current data before continuing?",
        backupAndContinueButton: "Backup and Continue",
        continueWithoutBackupButton: "Continue without Backup",
        successTitle: "Backup Successful",
        successDescription: "Data backed up to {filename}.",
      },
    },
    dataValidationReport: {
      title: "AI Data Validation Report",
      inconsistenciesFound: "Inconsistencies Found",
      inconsistenciesFoundDescription: "The following potential issues were detected in your data. Please review them carefully.",
      noInconsistenciesFound: "No Inconsistencies Found",
      noInconsistenciesFoundDescription: "The AI scan completed successfully and found no inconsistencies in the current dataset.",
      cell: "Cell",
      description: "Description",
    },
    localStorage: {
      loadedData: "Data Loaded",
      loadedTasksDescription: "{count} tasks have been loaded from the last import.",
      errorLoadingData: "Error Loading Data",
      errorLoadingDataDescription: "Could not load saved tasks.",
    },
    loginPage: { 
      titleLogin: "Login",
      descriptionLogin: "Enter your credentials to access your account.",
      titleRegister: "Register",
      descriptionRegister: "Create a new account to get started.",
      emailLabel: "Email",
      passwordLabel: "Password",
      loginButton: "Login",
      registerButton: "Register",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
      registerLink: "Register here",
      loginLink: "Login here",
      error: {
        invalidCredentials: "Invalid email or password. Please check and try again.",
        userNotFound: "No account found with that email.", 
        wrongPassword: "Incorrect password.", 
        generic: "An unexpected error occurred. Please try again later.",
        invalidEmail: "The email address is badly formatted.",
        userDisabled: "This user account has been disabled.",
        emailInUse: "This email address is already in use by another account.",
        weakPassword: "Password should be at least 6 characters.",
        requiresRecentLogin: "This operation is sensitive and requires recent authentication. Please log in again.",
        passwordRequired: "Password is required.",
        networkError: "A network error occurred. Please check your connection and try again.",
        apiKeyInvalid: "Firebase API Key is not valid. Please check your Firebase project configuration.",
      }
    },
  },
  es: {
    appName: "OmniDeck",
    pageHeader: {
      searchPlaceholder: "Buscar...",
      notifications: "Alternar notificaciones",
      myAccount: "Mi Cuenta",
      profile: "Perfil",
      settings: "Configuración",
      logout: "Cerrar Sesión",
      dashboard: "Panel de Control",
      interactiveTable: "Tabla Interactiva",
      uploadData: "Cargar Datos",
      language: "Idioma",
      english: "Inglés",
      spanish: "Español",
      login: "Iniciar Sesión",
      admin: {
        userManagement: "Gestión de Usuarios",
        addNewUser: "Añadir Nuevo Usuario",
        nameLabel: "Nombre",
        emailLabel: "Correo Electrónico",
        passwordLabel: "Contraseña",
        roleLabel: "Rol",
        roleOwner: "Propietario",
        roleAdmin: "Administrador",
        roleUser: "Usuario",
        addUserButton: "Añadir Usuario",
        userAddedSuccessfully: "¡Usuario añadido con éxito!",
        errorAddingUser: "Error al añadir usuario.",
      },
      theme: { 
        toggle: "Alternar tema",
        title: "Tema",
        light: "Claro",
        dark: "Oscuro",
        system: "Sistema",
      },
    },
    sidebar: {
      dashboard: "Panel de Control",
      interactiveTable: "Tabla Interactiva",
      uploadData: "Cargar Datos",
      adminUser: "Usuario Admin",
      adminEmail: "admin@omnideck.com",
      userManagement: "Gestión de Usuarios",
    },
    dashboard: {
      totalTasks: "Tareas Totales",
      activeProjects: "Proyectos Activos",
      tasksCompleted: "Tareas Completadas",
      teamMembers: "Miembros del Equipo",
      acrossAllProjects: "En todos los proyectos",
      fromLastWeek: "+2 desde la semana pasada",
      thisMonth: "Este mes",
      activeUsers: "Usuarios activos",
      taskProgressOverview: "Resumen de Progreso de Tareas",
      taskDistributionByStatus: "Un vistazo rápido a la distribución de tareas por estado.",
      projectSpotlight: "Proyecto Destacado",
      highlightingKeyProject: "Destacando un proyecto clave en curso.",
      projectPhoenixTitle: "Proyecto Phoenix",
      projectPhoenixDescription: "Esta iniciativa busca renovar nuestra plataforma principal, mejorando la experiencia de usuario y el rendimiento. Actualmente en fase de desarrollo con hitos importantes acercándose.",
      progress: "Progreso",
      deadline: "Fecha Límite",
      recentActivity: "Actividad Reciente",
      latestUpdates: "Últimas actualizaciones de tu equipo.",
      activityCompletedTask: "{user} completó la tarea '{taskName}'",
      activityUpdatedStatus: "{user} actualizó el estado de '{taskName}' a {status}",
      activityAddedNewTask: "{user} añadió una nueva tarea '{taskName}'",
      hoursAgo: "hace {count} horas",
      daysAgo: "hace {count} días",
      todo: "Por Hacer",
      inProgress: "En Progreso",
      completed: "Completado",
      blocked: "Bloqueado",
    },
    interactiveTable: {
      title: "Resumen de Tareas",
      validateWithAI: "Validar Datos con IA",
      validating: "Validando...",
      validationComplete: "Validación de Datos Completa",
      validationFailed: "Falló la Validación de Datos",
      validationFailedDescription: "Ocurrió un error desconocido durante la validación de datos.",
      fieldUpdated: "Campo actualizado",
      changeSavedFor: "Cambio guardado para {field}",
      tableHeaders: {
        toRef: "TO Ref.",
        toStatus: "TO Status",
        logisticDeveloper: "Desarrollador Logístico",
        delayDays: "Días de atraso",
        customerAccount: "Customer Acc.",
        amount: "Monto $",
        transportMode: "Modo de Transporte",
        comments: "Comentarios",
        admin: "Administrador",
        resolutionTimeDays: "Tiempo Resolución (días)",
        history: "Historial", 
        actions: "Acciones",
      },
      status: {
        missingEstimates: "Fechas Estimadas Faltantes",
        missingPOD: "POD Faltante",
        pendingInvoice: "Pendiente de Facturar Fuera de Tiempo",
      },
      resolutionStatus: {
        pendiente: "Pendiente",
        sfp: "SFP",
        resuelto: "Resuelto",
      },
      notAvailable: "N/D",
      selectStatus: "Seleccionar estado",
      filterBy: "Filtrar por {columnName}",
      allStatuses: "Todos los Estados",
      filterAllOption: "Todos",
      filterActionPlaceholder: "Filtrar...",
      viewHistoryTooltip: "Ver historial",
      viewingHistory: "Viendo historial para tarea {taskId}",
      historyFeaturePlaceholder: "La función de historial aún no está implementada.",
    },
    uploadData: {
      title: "Cargar Datos desde CSV",
      description: "Sube un archivo CSV, mapea las columnas y actualiza tus datos.",
      fileAcceptedToastTitle: "Archivo CSV Cargado",
      fileAcceptedToastDescription: "Por favor, revisa el mapeo de columnas.",
      columnMappingTitle: "Mapeo de Columnas",
      columnMappingDescription: "Revisa y ajusta cómo se asignan las columnas de tu archivo CSV ({fileName}) a las columnas del sistema.",
      csvColumn: "Columna CSV",
      mapToSystemColumn: "Mapear a Columna del Sistema",
      doNotImport: "No importar esta columna",
      cancel: "Cancelar",
      confirmAndProcess: "Confirmar Mapeo y Procesar Datos",
      processing: "Procesando...",
      noDataToProcess: "No hay datos para procesar",
      incompleteMapping: "Mapeo Incompleto",
      pleaseMapRequired: "Por favor, mapea las siguientes columnas requeridas del sistema: {columns}",
      dataProcessed: "Datos Procesados",
      tasksProcessedAndSaved: "{count} tareas procesadas y guardadas en el almacenamiento local.",
      errorSavingLocally: "Error al guardar datos localmente",
      errorSavingLocallyDescription: "No se pudieron guardar los datos para la tabla interactiva. La vista previa sigue disponible en esta página.",
      previewTitle: "Vista Previa de Datos Procesados (primeras 10 filas)",
      uploadAnotherFile: "Cargar otro archivo",
      redirectingToTable: " Redirigiendo a la Tabla Interactiva...",
      systemColumns: {
        status: "TO Status",
        assignee: "Desarrollador Logístico",
        taskReference: "TO Ref.",
        delayDays: "Dias de atraso",
        customerAccount: "Customer Acc.",
        netAmount: "Monto $",
        transportMode: "Transport Mode",
        comments: "Comentarios",
        resolutionAdmin: "Administrador",
        resolutionStatus: "Estado de Resolución", // Corrected key for consistency
        resolutionTimeDays: "Tiempo Resolución (días)",
      },
      fileUploader: {
        dropzoneActive: "Suelta el archivo CSV aquí...",
        dropzoneInactive: "Arrastra y suelta un archivo CSV aquí, o <span class=\"text-primary\">haz clic para seleccionar</span>.",
        processingFile: "Procesando archivo...",
        previewFor: "Vista previa de: {fileName}",
        showingFirstNRows: "Mostrando las primeras {count} filas de datos.",
        invalidFileToastTitle: "Archivo no válido",
        invalidFileToastDescription: "Por favor, sube un archivo .csv.",
        emptyFileToastTitle: "Archivo CSV vacío o inválido",
        emptyFileToastDescription: "La cabecera está vacía.",
        parseErrorToastTitle: "Error al parsear CSV",
        parseErrorToastDescription: "Formato de archivo CSV no válido.",
      },
      aiErrorToastTitle: "Error al obtener sugerencias de IA",
      aiErrorToastDescription: "Algunas columnas no pudieron ser mapeadas automáticamente. Por favor, revísalas manualmente.",
      backup: {
        dialogTitle: "Confirmación de Respaldo",
        dialogDescription: "Los datos existentes serán sobrescritos. ¿Desea hacer un respaldo de los datos actuales antes de continuar?",
        backupAndContinueButton: "Respaldar y Continuar",
        continueWithoutBackupButton: "Continuar sin Respaldo",
        successTitle: "Respaldo Exitoso",
        successDescription: "Datos respaldados en {filename}.",
      },
    },
    dataValidationReport: {
      title: "Reporte de Validación de Datos IA",
      inconsistenciesFound: "Inconsistencias Encontradas",
      inconsistenciesFoundDescription: "Se detectaron los siguientes problemas potenciales en tus datos. Por favor, revísalos cuidadosamente.",
      noInconsistenciesFound: "No se Encontraron Inconsistencias",
      noInconsistenciesFoundDescription: "El análisis de IA se completó con éxito y no encontró inconsistencias en el conjunto de datos actual.",
      cell: "Celda",
      description: "Descripción",
    },
    localStorage: {
      loadedData: "Datos Cargados",
      loadedTasksDescription: "Se han cargado {count} tareas desde la última importación.",
      errorLoadingData: "Error al Cargar Datos",
      errorLoadingDataDescription: "No se pudieron cargar las tareas guardadas.",
    },
    loginPage: { 
      titleLogin: "Iniciar Sesión",
      descriptionLogin: "Ingresa tus credenciales para acceder a tu cuenta.",
      titleRegister: "Registrarse",
      descriptionRegister: "Crea una nueva cuenta para comenzar.",
      emailLabel: "Correo Electrónico",
      passwordLabel: "Contraseña",
      loginButton: "Iniciar Sesión",
      registerButton: "Registrarse",
      noAccount: "¿No tienes una cuenta?",
      hasAccount: "Ya tienes una cuenta?",
      registerLink: "Regístrate aquí",
      loginLink: "Inicia sesión aquí",
      error: {
        invalidCredentials: "Correo o contraseña inválidos. Por favor verifica e inténtalo de nuevo.",
        userNotFound: "No existe una cuenta con ese correo.", 
        wrongPassword: "Contraseña incorrecta.", 
        generic: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo más tarde.",
        invalidEmail: "La dirección de correo electrónico no tiene un formato válido.",
        userDisabled: "Esta cuenta de usuario ha sido deshabilitada.",
        emailInUse: "Esta dirección de correo electrónico ya está en uso por otra cuenta.",
        weakPassword: "La contraseña debe tener al menos 6 caracteres.",
        requiresRecentLogin: "Esta operación es sensible y requiere autenticación reciente. Por favor, inicia sesión de nuevo.",
        passwordRequired: "La contraseña es requerida.",
        networkError: "Ocurrió un error de red. Por favor, verifica tu conexión e inténtalo de nuevo.",
        apiKeyInvalid: "La clave API de Firebase no es válida. Por favor, revisa la configuración de tu proyecto Firebase.",
      }
    },
  }
};
