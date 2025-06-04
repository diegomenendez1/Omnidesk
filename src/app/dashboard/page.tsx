
"use client";

import { useEffect, useState, useCallback } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { MetricCard } from '@/components/dashboard/metric-card';
import { SampleStatsChart } from '@/components/dashboard/sample-stats-chart';
import { Users, Activity, CheckCircle2, Briefcase, ListChecks, TrendingUp, Clock3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/context/language-context';
import type { Task, TaskStatus, TaskResolutionStatus } from '@/types'; 
import { PROTECTED_RESOLUTION_STATUSES } from '@/types'; 
// Renamed chart component and its data type
import { OverallAdminProgressChart, type OverallAdminProgressDataPoint } from '@/components/dashboard/overall-admin-progress-chart'; 
import { AverageResolutionTimeChart, type AdminResolutionTimeDataPoint } from '@/components/dashboard/average-resolution-time-chart';
import { calculateBusinessDays } from '@/lib/utils'; 
import { parseISO, isValid, fromUnixTime } from 'date-fns';
import { db } from '@/lib/firebase'; // Import Firestore instance
import { MigrationControls } from '@/components/migration/migration-controls'; // Import MigrationControls


interface TaskOverviewData {
  name: string;
  value: number;
  fill: string;
}

const CHART_FILLS: Record<TaskStatus, string> = {
  "Missing Estimated Dates": "hsl(var(--chart-1))",
  "Missing POD": "hsl(var(--chart-2))",
  "Pending to Invoice Out of Time": "hsl(var(--chart-3))",
};
const STATUS_TRANSLATION_KEYS: Record<TaskStatus, string> = {
  "Missing Estimated Dates": "interactiveTable.status.missingEstimates",
  "Missing POD": "interactiveTable.status.missingPOD",
  "Pending to Invoice Out of Time": "interactiveTable.status.pendingInvoice",
};

const GOAL_PERCENTAGE = 50; // Define a goal percentage for overall progress

export default function DashboardPage() {
  const { t } = useLanguage();
  const [taskOverviewData, setTaskOverviewData] = useState<TaskOverviewData[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]); // State to hold all tasks from Firestore
  const [totalTasks, setTotalTasks] = useState<number>(0);
  const [tasksCompletedCount, setTasksCompletedCount] = useState<number>(0);
  
  // State for the new Overall Admin Progress chart
  const [overallAdminProgressData, setOverallAdminProgressData] = useState<OverallAdminProgressDataPoint[]>([]);
  const [teamAverageProgress, setTeamAverageProgress] = useState<number | null>(null);
  const [adminsForProgressChart, setAdminsForProgressChart] = useState<string[]>([]);


  const [averageResolutionTimeData, setAverageResolutionTimeData] = useState<AdminResolutionTimeDataPoint[]>([]);
  const [teamAverageResolutionTime, setTeamAverageResolutionTime] = useState<number | null>(null);


  const calculateOverallAdminProgress = useCallback((tasks: Task[]): {
    chartData: OverallAdminProgressDataPoint[];
    teamAveragePercent: number | null;
    allAdmins: string[];
  } => {
    console.log("OverallAdminProgress: Starting calculation...");
    if (!tasks || tasks.length === 0) {
      console.log("OverallAdminProgress: No tasks provided.");
      return { chartData: [], teamAveragePercent: null, allAdmins: [] };
    }

    const adminStats: Record<string, { assigned: number; resolved: number }> = {};
    const allAdminsSet = new Set<string>();

    tasks.forEach(task => {
      if (task.resolutionAdmin) {
        allAdminsSet.add(task.resolutionAdmin);
        if (!adminStats[task.resolutionAdmin]) {
          adminStats[task.resolutionAdmin] = { assigned: 0, resolved: 0 };
        }
        adminStats[task.resolutionAdmin].assigned++;

        if (task.resolutionStatus && PROTECTED_RESOLUTION_STATUSES.includes(task.resolutionStatus as TaskResolutionStatus) && task.resolvedAt) {
          try {
            if (isValid(parseISO(task.resolvedAt))) {
               adminStats[task.resolutionAdmin].resolved++;
            }
          } catch {
            // Invalid resolvedAt date
          }
        }
      }
    });

    const allAdminsList = Array.from(allAdminsSet).sort();
    if (allAdminsList.length === 0) {
        console.log("OverallAdminProgress: No admins identified from tasks with resolutionAdmin.");
        return { chartData: [], teamAveragePercent: null, allAdmins: [] };
    }


    const chartData: OverallAdminProgressDataPoint[] = allAdminsList.map(adminName => {
      const stats = adminStats[adminName];
      if (!stats || stats.assigned === 0) { // If admin has no tasks or no assigned tasks
        return { adminName, progressPercent: null };
      }
      return {
        adminName,
        progressPercent: (stats.resolved / stats.assigned) * 100,
      };
    });
    
    // Sort by progressPercent descending, nulls (no progress) at the end
    chartData.sort((a, b) => {
        if (a.progressPercent === null && b.progressPercent === null) return a.adminName.localeCompare(b.adminName);
        if (a.progressPercent === null) return 1;
        if (b.progressPercent === null) return -1;
        return b.progressPercent - a.progressPercent; // Higher progress first
    });


    let totalTeamAssigned = 0;
    let totalTeamResolved = 0;
    Object.values(adminStats).forEach(stats => {
      totalTeamAssigned += stats.assigned;
      totalTeamResolved += stats.resolved;
    });

    const teamAveragePercent = totalTeamAssigned > 0 ? (totalTeamResolved / totalTeamAssigned) * 100 : null;

    console.log("OverallAdminProgress: Calculated chartData:", chartData);
    console.log("OverallAdminProgress: Calculated teamAveragePercent:", teamAveragePercent);
    console.log("OverallAdminProgress: All admins found:", allAdminsList);
    
    return { chartData, teamAveragePercent, allAdmins: allAdminsList };
  }, []);


  const calculateAverageResolutionTimeByAdmin = useCallback((tasks: Task[]): { adminAverages: AdminResolutionTimeDataPoint[]; teamAverage: number | null } => {
    console.log("AverageResolutionTime: Starting calculation...");
    if (!tasks || tasks.length === 0) {
      console.log("AverageResolutionTime: No tasks provided.");
      return { adminAverages: [], teamAverage: null };
    }

    const resolutionTimesByAdmin: Record<string, number[]> = {};
    let totalResolutionTimeAllTasks = 0;
    let totalResolvedTasksCount = 0;
    const allAdminsWithTasks = new Set<string>();

    tasks.forEach(task => {
      if (task.resolutionAdmin) {
        allAdminsWithTasks.add(task.resolutionAdmin);
      }

      if (
        task.resolutionStatus &&
        PROTECTED_RESOLUTION_STATUSES.includes(task.resolutionStatus as TaskResolutionStatus) &&
        task.createdAt &&
        task.resolvedAt
      ) {
        try {
          const createdAtDate = typeof task.createdAt === 'string' ? parseISO(task.createdAt) : fromUnixTime(task.createdAt.seconds);
          const resolvedAtDate = typeof task.resolvedAt === 'string' ? parseISO(task.resolvedAt) : fromUnixTime(task.resolvedAt.seconds);

          if (isValid(createdAtDate) && isValid(resolvedAtDate) && resolvedAtDate >= createdAtDate) {
            const businessDays = calculateBusinessDays(createdAtDate, resolvedAtDate);
            if (task.resolutionAdmin) {
              if (!resolutionTimesByAdmin[task.resolutionAdmin]) {
                resolutionTimesByAdmin[task.resolutionAdmin] = [];
              }
              resolutionTimesByAdmin[task.resolutionAdmin].push(businessDays);
            }
            totalResolutionTimeAllTasks += businessDays;
            totalResolvedTasksCount++;
          } else {
            console.warn(`AverageResolutionTime: Invalid or inconsistent dates for task ${task.id || task.taskReference}. createdAt: ${task.createdAt}, resolvedAt: ${task.resolvedAt}`);
          }
        } catch (e) {
          console.warn(`AverageResolutionTime: Error processing dates for task ${task.id || task.taskReference}:`, e);
        }
      }
    });

    const adminAverages: AdminResolutionTimeDataPoint[] = [];
    const sortedAdminList = Array.from(allAdminsWithTasks).sort();

    sortedAdminList.forEach(adminName => {
      const times = resolutionTimesByAdmin[adminName];
      if (times && times.length > 0) {
        const sum = times.reduce((acc, curr) => acc + curr, 0);
        adminAverages.push({ adminName: adminName, averageDays: sum / times.length });
      } else {
        adminAverages.push({ adminName: adminName, averageDays: null });
      }
    });
    
    adminAverages.sort((a, b) => {
        if (a.averageDays === null && b.averageDays === null) return a.adminName.localeCompare(b.adminName);
        if (a.averageDays === null) return 1; // Nulls (no resolved tasks or error) go to the end
        if (b.averageDays === null) return -1;
        return a.averageDays - b.averageDays; // Lower average days first
    });

    const teamAverage = totalResolvedTasksCount > 0 ? totalResolutionTimeAllTasks / totalResolvedTasksCount : null;

    console.log("AverageResolutionTime: Calculated admin averages:", adminAverages);
    console.log("AverageResolutionTime: Calculated team average:", teamAverage);
    return { adminAverages, teamAverage };
  }, []);


  useEffect(() => {
    const tasksCollectionRef = collection(db, 'tasks');
    const q = query(tasksCollectionRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("Dashboard: Firestore snapshot received.");
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id, // Include document ID
        ...doc.data()
      })) as Task[]; // Cast to Task array

      setAllTasks(tasksData); // Update the state with fetched tasks
      setTotalTasks(tasksData.length);

      const statusCounts: Record<TaskStatus, number> = {
        "Missing Estimated Dates": 0,
        "Missing POD": 0,
        "Pending to Invoice Out of Time": 0,
      };

      let completedCount = 0;
      tasksData.forEach(task => {
        if (task.status && statusCounts.hasOwnProperty(task.status)) {
          statusCounts[task.status]++;
        }
        if (task.resolutionStatus && PROTECTED_RESOLUTION_STATUSES.includes(task.resolutionStatus as TaskResolutionStatus)) {
          completedCount++;
        }
      });
      setTasksCompletedCount(completedCount);

      const overviewData = (Object.keys(statusCounts) as TaskStatus[]).map(statusKey => ({
        name: t(STATUS_TRANSLATION_KEYS[statusKey] as any),
        value: statusCounts[statusKey],
        fill: CHART_FILLS[statusKey] || "hsl(var(--chart-4))",
      }));
      setTaskOverviewData(overviewData);

      // Calculations are now triggered by changes in allTasks state
    }, (error) => {
      console.error("Dashboard: Error fetching tasks from Firestore:", error);
       setTaskOverviewData([
            { name: t(STATUS_TRANSLATION_KEYS["Missing POD"] as any), value: 0, fill: CHART_FILLS["Missing POD"] },
            { name: t(STATUS_TRANSLATION_KEYS["Pending to Invoice Out of Time"] as any), value: 0, fill: CHART_FILLS["Pending to Invoice Out of Time"] },
        ]);
        setTotalTasks(0);
        setTasksCompletedCount(0);
        setOverallAdminProgressData([]);
        setTeamAverageProgress(null);
        setAdminsForProgressChart([]);
        setAverageResolutionTimeData([]);
        setTeamAverageResolutionTime(null);
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, [t]); // Re-run effect if language changes

  // Recalculate metrics whenever the allTasks state changes

  const loadAndProcessTasks = useCallback(() => {
    console.log('Dashboard: loadAndProcessTasks placeholder triggered.');
    // Placeholder for actual reloading logic
  }, []);

  const handleStorageChange = useCallback(() => {
    console.log('Dashboard: storage event detected.');
    loadAndProcessTasks();
  }, [loadAndProcessTasks]);

  useEffect(() => {

    console.log("Dashboard: Recalculating metrics based on updated tasks data.");
    const { chartData: overallProgress, teamAveragePercent, allAdmins } =
      calculateOverallAdminProgress(allTasks);
    
    setOverallAdminProgressData(overallProgress);
    setTeamAverageProgress(teamAveragePercent);
    setAdminsForProgressChart(allAdmins);



    const { adminAverages, teamAverage } =
      calculateAverageResolutionTimeByAdmin(allTasks);
    setAverageResolutionTimeData(adminAverages);
    setTeamAverageResolutionTime(teamAverage);
  }, [allTasks]);



  const recentActivities = [
      { user: "Alice", actionKey: "dashboard.activityCompletedTask", taskName: "Design Homepage", timeKey: "dashboard.hoursAgo", timeArgs: { count: 2 }, avatar: "https://placehold.co/40x40.png?text=A" , dataAiHint: "female avatar"},
      { user: "Bob", actionKey: "dashboard.activityUpdatedStatus", taskName: "API Integration", status: t('dashboard.inProgress'), timeKey: "dashboard.hoursAgo", timeArgs: { count: 5 }, avatar: "https://placehold.co/40x40.png?text=B", dataAiHint: "male avatar" },
      { user: "Charlie", actionKey: "dashboard.activityAddedNewTask", taskName: "User Feedback Collection", timeKey: "dashboard.daysAgo", timeArgs: { count: 1 }, avatar: "https://placehold.co/40x40.png?text=C", dataAiHint: "person avatar" },
  ];

  return (
    <div className="space-y-6">
      <MigrationControls /> {/* Add MigrationControls here */}
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title={t('dashboard.totalTasks')} value={totalTasks} icon={<ListChecks className="h-6 w-6 text-primary" />} description={t('dashboard.acrossAllProjects')} />
        <MetricCard title={t('dashboard.activeProjects')} value="15" icon={<Briefcase className="h-6 w-6 text-primary" />} description={t('dashboard.fromLastWeek')} />
        <MetricCard title={t('dashboard.tasksCompleted')} value={tasksCompletedCount} icon={<CheckCircle2 className="h-6 w-6 text-[hsl(var(--success))]" />} description={t('dashboard.thisMonth')} />
        <MetricCard title={t('dashboard.teamMembers')} value="12" icon={<Users className="h-6 w-6 text-primary" />} description={t('dashboard.activeUsers')} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              {t('dashboard.overallAdminProgress.title')}
            </CardTitle>
            <CardDescription>{t('dashboard.overallAdminProgress.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {overallAdminProgressData.length > 0 || adminsForProgressChart.length > 0 ? (
              <OverallAdminProgressChart 
                data={overallAdminProgressData} 
                teamAveragePercent={teamAverageProgress}
                goalPercent={GOAL_PERCENTAGE} // Using a defined constant
                allAdmins={adminsForProgressChart} 
              />
            ) : (
              <p className="text-center text-muted-foreground py-10">
                {totalTasks > 0 ? t('dashboard.overallAdminProgress.noData') : t('dashboard.overallAdminProgress.uploadDataPrompt')}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock3 className="h-6 w-6 text-primary" />
                    {t('dashboard.averageResolutionTimeChart.title')}
                </CardTitle>
                <CardDescription>{t('dashboard.averageResolutionTimeChart.description')}</CardDescription>
            </CardHeader>
            <CardContent>
                {averageResolutionTimeData.length > 0 || teamAverageResolutionTime !== null ? (
                    <AverageResolutionTimeChart data={averageResolutionTimeData} teamAverageDays={teamAverageResolutionTime} />
                ) : (
                    <p className="text-center text-muted-foreground py-10">
                       {totalTasks > 0 ? t('dashboard.averageResolutionTimeChart.noResolvedTasks') : t('dashboard.averageResolutionTimeChart.uploadDataPrompt')}
                    </p>
                )}
            </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.taskProgressOverview')}</CardTitle>
            <CardDescription>{t('dashboard.taskDistributionByStatus')}</CardDescription>
          </CardHeader>
          <CardContent>
            <SampleStatsChart data={taskOverviewData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.projectSpotlight')}</CardTitle>
            <CardDescription>{t('dashboard.highlightingKeyProject')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Image 
              src="https://placehold.co/600x300.png" 
              alt="Project Spotlight Image" 
              width={600} 
              height={300} 
              className="rounded-lg object-cover"
              data-ai-hint="modern office"
            />
            <h3 className="text-lg font-semibold">{t('dashboard.projectPhoenixTitle')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.projectPhoenixDescription')}
            </p>
            <div className="flex justify-between items-center text-sm">
              <span>{t('dashboard.progress')}: <strong>65%</strong></span>
              <span className="text-primary">{t('dashboard.deadline')}: 2024-12-15</span>
            </div>
          </CardContent>
        </Card>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
           <CardDescription>{t('dashboard.latestUpdates')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {recentActivities.map((activity, index) => (
              <li key={index} className="flex items-center gap-3 p-3 rounded-md hover:bg-muted border border-transparent hover:border-border transition-colors">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={activity.avatar} data-ai-hint={activity.dataAiHint} />
                  <AvatarFallback>{activity.user.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm">
                    <span className="font-semibold">{activity.user}</span>{' '}
                    {t(activity.actionKey as any, { taskName: activity.taskName, status: activity.status })}.
                  </p>
                  <p className="text-xs text-muted-foreground">{t(activity.timeKey as any, activity.timeArgs)}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

    
    
    