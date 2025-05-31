
// 1. Define Locale type
export type Locale = 'en' | 'es';

// 2. Define the main Translations interface
export interface Translations {
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
    overallAdminProgress: { // Renamed from adminWeeklyProgress
      title: string;
      description: string;
      yAxisLabel: string;
      teamAverageLabel: string;
      goalLineLabel: string;
      noData: string;
      uploadDataPrompt: string;
    };
    averageResolutionTimeChart: {
      title: string;
      description: string;
      yAxisLabel: string;
      teamAverageLabel: string;
      noData: string;
      noResolvedTasks: string;
      adminLabel: string; // For tooltips or specific admin references if needed
      avgDaysSuffix: string;
      uploadDataPrompt: string;
    };
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
      accumulatedBusinessDays: string;
      resolvedAt: string;
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
    tasksProcessedAndSavedWithSkipped: string;
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
      id: string;
      name: string;
      createdAt: string;
      resolvedAt: string;
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
    validationErrors: {
      title: string;
      description: string;
    };
    noValidTasksProcessed: string;
    allRowsInvalid: string;
    noDataInFile: string;
    goToTableButton: string;
    noEffectiveChanges: string;
    noEffectiveChangesDescription: string;
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
    errorSavingData: string;
    errorSavingDataDescription: string;
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
      apiKeyInvalid: string;
    };
  };
  // This structure must be present for each locale
  [key: string]: any;
}


// 3. Define and EXPORT the translations object
export const translations: Translations = {
  en: {
    appName: "OmniDeck",
    pageHeader: {
      searchPlaceholder: "Search...",
      notifications: "Toggle notifications",
      myAccount: "My Account",
      profile: "Profile",
      settings: "Settings",
      logout: "Log Out",
      dashboard: "Dashboard",
      interactiveTable: "Interactive Table",
      uploadData: "Upload Data",
      language: "Language",
      english: "English",
      spanish: "Spanish",
      login: "Login",
      admin: {
        userManagement: "User Management",
        addNewUser: "Add New User",
        nameLabel: "Name",
        emailLabel: "Email",
        passwordLabel: "Password",
        roleLabel: "Role",
        roleOwner: "Owner",
        roleAdmin: "Admin",
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
      projectPhoenixDescription: "This initiative aims to revamp our core platform, enhancing user experience and performance. Currently in development phase with major milestones approaching.",
      progress: "Progress",
      deadline: "Deadline",
      recentActivity: "Recent Activity",
      latestUpdates: "Latest updates from your team.",
      activityCompletedTask: "{user} completed task '{taskName}'",
      activityUpdatedStatus: "{user} updated status of '{taskName}' to {status}",
      activityAddedNewTask: "{user} added new task '{taskName}'",
      hoursAgo: "{count} hours ago",
      daysAgo: "{count} days ago",
      todo: "To Do",
      inProgress: "In Progress",
      completed: "Completed",
      blocked: "Blocked",
      overallAdminProgress: {
        title: "Overall Admin Progress",
        description: "Individual admin progress based on assigned vs. resolved tasks.",
        yAxisLabel: "Progress (%)",
        teamAverageLabel: "Team Average",
        goalLineLabel: "Minimum Goal",
        noData: "No data available for overall admin progress.",
        uploadDataPrompt: "Please upload data to see overall admin progress.",
      },
      averageResolutionTimeChart: {
        title: "Average Task Resolution Time",
        description: "Average business days administrators take to resolve tasks.",
        yAxisLabel: "Avg. Business Days to Resolve",
        teamAverageLabel: "Team Average",
        noData: "No data available to display resolution times.",
        noResolvedTasks: "No tasks have been resolved yet.",
        adminLabel: "{adminName}",
        avgDaysSuffix: "days",
        uploadDataPrompt: "Upload data to see resolution times.",
      },
    },
    interactiveTable: {
      title: "Task Overview",
      validateWithAI: "Validate Data with AI",
      validating: "Validating...",
      validationComplete: "Data Validation Complete",
      validationFailed: "Data Validation Failed",
      validationFailedDescription: "An unknown error occurred during data validation.",
      fieldUpdated: "Field updated",
      changeSavedFor: "Change saved for {field}",
      tableHeaders: {
        toRef: "TO Ref.",
        toStatus: "TO Status",
        logisticDeveloper: "Logistic Developer",
        delayDays: "Delay Days",
        customerAccount: "Customer Acc.",
        amount: "Amount $",
        transportMode: "Transport Mode",
        comments: "Comments",
        admin: "Admin",
        resolutionTimeDays: "Resolution Time (days)",
        history: "History",
        actions: "Actions",
        accumulatedBusinessDays: "Accumulated Days (Business)",
        resolvedAt: "Resolved At",
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
      description: "Upload a CSV file, map columns, and merge data with existing records.",
      fileAcceptedToastTitle: "CSV File Uploaded",
      fileAcceptedToastDescription: "Please review column mapping.",
      columnMappingTitle: "Column Mapping",
      columnMappingDescription: "Review and adjust how columns from your CSV file ({fileName}) map to system columns. 'TO Ref.' is crucial for matching.",
      csvColumn: "CSV Column",
      mapToSystemColumn: "Map to System Column",
      doNotImport: "Do not import this column",
      cancel: "Cancel",
      confirmAndProcess: "Confirm Mapping & Process Data",
      processing: "Processing...",
      noDataToProcess: "No data to process",
      incompleteMapping: "Incomplete Mapping",
      pleaseMapRequired: "Please map the following required system columns: {columns}",
      dataProcessed: "Data Processed Successfully",
      tasksProcessedAndSaved: "{count} total tasks after processing. Check preview.",
      tasksProcessedAndSavedWithSkipped: "{savedCount} total tasks after processing. Skipped {skippedCount} CSV rows due to errors or missing TO Reference.",
      errorSavingLocally: "Error saving data locally",
      errorSavingLocallyDescription: "Could not save data for the interactive table. Preview is still available on this page.",
      previewTitle: "Processed Data Preview (first 10 rows of final list)",
      uploadAnotherFile: "Upload Another File",
      redirectingToTable: " Redirecting to Interactive Table...",
      systemColumns: {
        status: "TO Status",
        assignee: "Logistic Developer",
        taskReference: "TO Ref.",
        delayDays: "Delay Days",
        customerAccount: "Customer Account",
        netAmount: "Net Amount $",
        transportMode: "Transport Mode",
        comments: "Comments",
        resolutionAdmin: "Resolution Admin",
        resolutionStatus: "Resolution Status",
        resolutionTimeDays: "Resolution Time (days)",
        id: "Internal ID",
        name: "Task Name",
        createdAt: "Creation Date (System)",
        resolvedAt: "Resolution Date (System/CSV)",
      },
      fileUploader: {
        dropzoneActive: "Drop the CSV file here ...",
        dropzoneInactive: "Drag 'n' drop a CSV file here, or <span class=\"text-primary\">click to select</span>.",
        processingFile: "Processing file...",
        previewFor: "Preview for: {fileName}",
        showingFirstNRows: "Showing first {count} data rows.",
        invalidFileToastTitle: "Invalid file",
        invalidFileToastDescription: "Please upload a .csv file.",
        emptyFileToastTitle: "Empty or invalid CSV file",
        emptyFileToastDescription: "Header is empty or no data rows found.",
        parseErrorToastTitle: "Error parsing CSV",
        parseErrorToastDescription: "Invalid CSV file format.",
      },
      aiErrorToastTitle: "Error fetching AI suggestions",
      aiErrorToastDescription: "Some columns could not be auto-mapped. Please review them manually.",
      backup: {
        dialogTitle: "Backup Confirmation",
        dialogDescription: "New data will be merged with existing records. It's recommended to backup current data before proceeding.",
        backupAndContinueButton: "Backup and Continue",
        continueWithoutBackupButton: "Continue without Backup",
        successTitle: "Backup Successful",
        successDescription: "Data backed up to {filename}.",
      },
      validationErrors: {
        title: "Validation Issues ({count} CSV rows)",
        description: "{count} CSV rows had validation errors or missing critical data (like TO Ref). Details for first {firstN}:\n{details}",
      },
      noValidTasksProcessed: "No Valid Tasks to Process",
      allRowsInvalid: "All rows in the CSV file were invalid or could not be processed. Please check errors and try again.",
      noDataInFile: "No data rows found in the uploaded CSV file.",
      goToTableButton: "Go to Interactive Table",
      noEffectiveChanges: "No Effective Changes Detected",
      noEffectiveChangesDescription: "The uploaded data did not result in any effective changes to the existing task list.",
    },
    dataValidationReport: {
      title: "AI Data Validation Report",
      inconsistenciesFound: "Inconsistencies Found",
      inconsistenciesFoundDescription: "The following potential issues were detected in your data. Please review them carefully.",
      noInconsistenciesFound: "No Inconsistencies Found",
      noInconsistenciesFoundDescription: "AI analysis completed successfully and found no inconsistencies in the current dataset.",
      cell: "Cell",
      description: "Description",
    },
    localStorage: {
      loadedData: "Data Loaded",
      loadedTasksDescription: "{count} tasks have been loaded from the last import.",
      errorLoadingData: "Error Loading Data",
      errorLoadingDataDescription: "Could not load saved tasks.",
      errorSavingData: "Error Saving Data",
      errorSavingDataDescription: "Could not save tasks to local storage.",
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
        userNotFound: "No account exists with that email.",
        wrongPassword: "Incorrect password.",
        generic: "An unexpected error occurred. Please try again later.",
        invalidEmail: "The email address is not validly formatted.",
        userDisabled: "This user account has been disabled.",
        emailInUse: "This email address is already in use by another account.",
        weakPassword: "Password should be at least 6 characters.",
        requiresRecentLogin: "This operation is sensitive and requires recent authentication. Please log in again.",
        passwordRequired: "Password is required.",
        networkError: "A network error occurred. Please check your connection and try again.",
        apiKeyInvalid: "The Firebase API key is invalid. Please check your Firebase project setup.",
      },
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
      overallAdminProgress: { // Renamed from adminWeeklyProgress and keys updated
        title: "Avance General por Administrador",
        description: "Avance individual de cada administrador basado en tareas asignadas vs. resueltas.",
        yAxisLabel: "Porcentaje de avance (%)",
        teamAverageLabel: "Promedio del Equipo",
        goalLineLabel: "Objetivo Mínimo",
        noData: "No hay datos disponibles para el avance general de administradores.",
        uploadDataPrompt: "Por favor, carga datos para ver el avance general de los administradores.",
      },
      averageResolutionTimeChart: {
        title: "Tiempo Promedio de Resolución de Tareas",
        description: "Promedio de días laborables que tardan los administradores en resolver tareas.",
        yAxisLabel: "Prom. Días Laborables para Resolver",
        teamAverageLabel: "Promedio del Equipo",
        noData: "No hay datos disponibles para mostrar tiempos de resolución.",
        noResolvedTasks: "Aún no se han resuelto tareas.",
        adminLabel: "{adminName}",
        avgDaysSuffix: "días",
        uploadDataPrompt: "Carga datos para ver los tiempos de resolución.",
      },
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
        accumulatedBusinessDays: "Días Acumulados (Hábiles)",
        resolvedAt: "Fecha Resolución",
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
      description: "Sube un archivo CSV, mapea las columnas y fusiona los datos con los registros existentes.",
      fileAcceptedToastTitle: "Archivo CSV Cargado",
      fileAcceptedToastDescription: "Por favor, revisa el mapeo de columnas.",
      columnMappingTitle: "Mapeo de Columnas",
      columnMappingDescription: "Revisa y ajusta cómo se asignan las columnas de tu archivo CSV ({fileName}) a las columnas del sistema. 'TO Ref.' es crucial para encontrar coincidencias.",
      csvColumn: "Columna CSV",
      mapToSystemColumn: "Mapear a Columna del Sistema",
      doNotImport: "No importar esta columna",
      cancel: "Cancelar",
      confirmAndProcess: "Confirmar Mapeo y Procesar Datos",
      processing: "Procesando...",
      noDataToProcess: "No hay datos para procesar",
      incompleteMapping: "Mapeo Incompleto",
      pleaseMapRequired: "Por favor, mapea las siguientes columnas requeridas del sistema: {columns}",
      dataProcessed: "Datos Procesados Correctamente",
      tasksProcessedAndSaved: "{count} tareas en total después del procesamiento. Revisa la vista previa.",
      tasksProcessedAndSavedWithSkipped: "{savedCount} tareas en total después del procesamiento. Se omitieron {skippedCount} filas CSV debido a errores o falta de TO Reference.",
      errorSavingLocally: "Error al guardar datos localmente",
      errorSavingLocallyDescription: "No se pudieron guardar los datos para la tabla interactiva. La vista previa sigue disponible en esta página.",
      previewTitle: "Vista Previa de Datos Procesados (primeras 10 filas de la lista final)",
      uploadAnotherFile: "Cargar Otro Archivo",
      redirectingToTable: " Redirigiendo a la Tabla Interactiva...",
      systemColumns: {
        status: "Estado TO",
        assignee: "Desarrollador Logístico",
        taskReference: "Ref. TO",
        delayDays: "Días de Atraso",
        customerAccount: "Cuenta Cliente",
        netAmount: "Monto Neto $",
        transportMode: "Modo Transporte",
        comments: "Comentarios",
        resolutionAdmin: "Administrador Resolución",
        resolutionStatus: "Estado Resolución",
        resolutionTimeDays: "Tiempo Resolución (días)",
        id: "ID Interno",
        name: "Nombre Tarea",
        createdAt: "Fecha Creación (Sistema)",
        resolvedAt: "Fecha Resolución (Sistema/CSV)",
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
        emptyFileToastDescription: "La cabecera está vacía o no se encontraron filas de datos.",
        parseErrorToastTitle: "Error al parsear CSV",
        parseErrorToastDescription: "Formato de archivo CSV no válido.",
      },
      aiErrorToastTitle: "Error al obtener sugerencias de IA",
      aiErrorToastDescription: "Algunas columnas no pudieron ser mapeadas automáticamente. Por favor, revísalas manualmente.",
      backup: {
        dialogTitle: "Confirmación de Respaldo",
        dialogDescription: "Se fusionarán nuevos datos con los registros existentes. Se recomienda respaldar los datos actuales antes de continuar.",
        backupAndContinueButton: "Respaldar y Continuar",
        continueWithoutBackupButton: "Continuar sin Respaldo",
        successTitle: "Respaldo Exitoso",
        successDescription: "Datos respaldados en {filename}.",
      },
      validationErrors: {
        title: "Problemas de Validación ({count} filas CSV)",
        description: "{count} filas CSV tuvieron errores de validación o datos críticos faltantes (como TO Ref). Detalles de las primeras {firstN}:\n{details}",
      },
      noValidTasksProcessed: "No Hay Tareas Válidas para Procesar",
      allRowsInvalid: "Todas las filas del archivo CSV fueron inválidas o no pudieron procesarse. Por favor, revisa los errores e inténtalo de nuevo.",
      noDataInFile: "No se encontraron filas de datos en el archivo CSV cargado.",
      goToTableButton: "Ir a Tabla Interactiva",
      noEffectiveChanges: "Sin Cambios Detectados",
      noEffectiveChangesDescription: "Los datos cargados no resultaron en cambios efectivos en la lista de tareas existente.",
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
      errorSavingData: "Error al Guardar Datos",
      errorSavingDataDescription: "No se pudieron guardar las tareas en el almacenamiento local.",
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
      hasAccount: "¿Ya tienes una cuenta?",
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
      },
    },
  },
};

// 4. Helper type for ensuring key validity, defined after Translations and translations
type PathImpl<T, K extends keyof T> = K extends string
  ? T[K] extends Record<string, any>
    ? T[K] extends Array<any> // Check if it's an array
      ? `${K}` // If array, path ends here
      : `${K}.${PathImpl<T[K], Exclude<keyof T[K], keyof any[]>> & string}` // If object, recurse
    : `${K}` // If primitive, path ends here
  : never;

type Path<T> = PathImpl<T, keyof T>;

// Use Translations['en'] to derive keys from a specific locale structure
export type TranslationKey = Path<Translations['en']>;

    