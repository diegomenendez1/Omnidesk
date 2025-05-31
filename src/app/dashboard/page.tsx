
"use client";

import { useEffect, useState, useCallback } from 'react';
import { MetricCard } from '@/components/dashboard/metric-card';
import { SampleStatsChart } from '@/components/dashboard/sample-stats-chart';
import { Users, Activity, CheckCircle2, Briefcase, ListChecks, TrendingUp } from 'lucide-react'; // Added TrendingUp
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/context/language-context';
import type { Task, TaskStatus, TaskResolutionStatus } from '@/types'; 
import { PROTECTED_RESOLUTION_STATUSES } from '@/types'; 
import { AdminWeeklyProgressChart, type AdminWeeklyChartDataPoint } from '@/components/dashboard/admin-weekly-progress-chart';
import { getWeeksInRange, parseWeekIdentifier } from '@/lib/utils'; // getWeekIdentifier not used directly here, but parseWeekIdentifier is
import { parseISO, isValid, startOfISOWeek, endOfISOWeek } from 'date-fns';


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

export default function DashboardPage() {
  const { t } = useLanguage();
  const [taskOverviewData, setTaskOverviewData] = useState<TaskOverviewData[]>([]);
  const [totalTasks, setTotalTasks] = useState<number>(0);
  const [tasksCompletedCount, setTasksCompletedCount] = useState<number>(0);
  const [adminWeeklyProgressData, setAdminWeeklyProgressData] = useState<AdminWeeklyChartDataPoint[]>([]);
  const [activeAdmins, setActiveAdmins] = useState<string[]>([]);


  const calculateAdminWeeklyProgress = useCallback((tasks: Task[]): { chartData: AdminWeeklyChartDataPoint[], admins: string[] } => {
    if (!tasks || tasks.length === 0) {
        console.log("AdminWeeklyProgress: No tasks provided to calculateAdminWeeklyProgress.");
        return { chartData: [], admins: [] };
    }

    const relevantTasks = tasks.filter(task => task.resolutionAdmin && task.createdAt);
    if (relevantTasks.length === 0) {
      console.log("AdminWeeklyProgress: No relevant tasks found (missing resolutionAdmin or createdAt).");
      return { chartData: [], admins: [] };
    }

    const admins = Array.from(new Set(relevantTasks.map(task => task.resolutionAdmin!))).sort();
    
    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    relevantTasks.forEach(task => {
      try {
        const createdAtDate = parseISO(task.createdAt!); // createdAt is guaranteed by filter
        if (isValid(createdAtDate)) {
          if (minDate === null || createdAtDate < minDate) minDate = createdAtDate;
          if (maxDate === null || createdAtDate > maxDate) maxDate = createdAtDate;
        } else {
           console.warn(`AdminWeeklyProgress: Invalid createdAt date for task ${task.id || task.taskReference}: ${task.createdAt}`);
        }

        if (task.resolvedAt) {
          const resolvedAtDate = parseISO(task.resolvedAt);
           if (isValid(resolvedAtDate)) {
             if (minDate === null || resolvedAtDate < minDate) minDate = resolvedAtDate;
             if (maxDate === null || resolvedAtDate > maxDate) maxDate = resolvedAtDate;
           } else {
             console.warn(`AdminWeeklyProgress: Invalid resolvedAt date for task ${task.id || task.taskReference}: ${task.resolvedAt}`);
           }
        }
      } catch (e) {
        console.warn(`AdminWeeklyProgress: Error parsing dates for task ${task.id || task.taskReference}:`, e);
      }
    });

     if (minDate === null || maxDate === null || minDate > maxDate) {
      console.log("AdminWeeklyProgress: No valid date range found from tasks. MinDate:", minDate, "MaxDate:", maxDate);
      return { chartData: [], admins: [] };
    }

    // Ensure maxDate includes today if it's in the past, to show current week's progress if applicable
    const today = new Date();
    if (maxDate < today) {
        maxDate = today;
    }
    // Also ensure minDate is not after maxDate if today was used to extend maxDate
    if (minDate > maxDate) {
        minDate = startOfISOWeek(maxDate); // Adjust minDate to be reasonable if maxDate was pulled forward
    }


    const weeks = getWeeksInRange(minDate, maxDate);
    if (weeks.length === 0) {
      console.log("AdminWeeklyProgress: No weeks in the calculated range after adjustments. MinDate:", minDate, "MaxDate:", maxDate);
      return { chartData: [], admins };
    }
    console.log(`AdminWeeklyProgress: Processing ${weeks.length} weeks from ${minDate.toISOString()} to ${maxDate.toISOString()}`);

    const weeklyData: AdminWeeklyChartDataPoint[] = weeks.map(weekId => {
      const { endOfWeek: currentEndOfWeek } = parseWeekIdentifier(weekId);
      const adminProgressMap: { [adminNameKey: string]: { resolved: number; totalAssigned: number; progressPercent: number; }} = {};
      
      let totalTeamProgressSum = 0;
      let contributingAdminsCount = 0;

      admins.forEach(admin => {
        const adminKey = admin.replace(/\s+/g, '') + 'Progress';
        let tasksAssignedToAdminUpToWeekCount = 0;
        let tasksResolvedByAdminUpToWeekCount = 0;

        relevantTasks.forEach(task => {
            if (task.resolutionAdmin !== admin) return;
            
            let createdAtDate;
            try {
                createdAtDate = parseISO(task.createdAt!);
                if (!isValid(createdAtDate)) {
                     // Already warned above, or skip if critical
                    return;
                }
            } catch { return; }

            if (createdAtDate <= currentEndOfWeek) {
                tasksAssignedToAdminUpToWeekCount++;

                if (PROTECTED_RESOLUTION_STATUSES.includes(task.resolutionStatus as TaskResolutionStatus) && task.resolvedAt) {
                    let resolvedAtDate;
                    try {
                        resolvedAtDate = parseISO(task.resolvedAt);
                        if (!isValid(resolvedAtDate)) {
                            // Already warned above
                            return;
                        }
                    } catch { return; }

                    if (resolvedAtDate <= currentEndOfWeek) {
                        tasksResolvedByAdminUpToWeekCount++;
                    }
                }
            }
        });
        
        const totalAssigned = tasksAssignedToAdminUpToWeekCount;
        const resolvedCount = tasksResolvedByAdminUpToWeekCount;
        const progressPercent = totalAssigned > 0 ? (resolvedCount / totalAssigned) * 100 : 0;

        adminProgressMap[adminKey] = {
            resolved: resolvedCount,
            totalAssigned: totalAssigned,
            progressPercent: progressPercent
        };

        if (totalAssigned > 0) {
            totalTeamProgressSum += progressPercent;
            contributingAdminsCount++;
        }
      });

      const teamAverage = contributingAdminsCount > 0 ? totalTeamProgressSum / contributingAdminsCount : 0;
      const goalLine = teamAverage < 50 ? 50 : teamAverage + 5;
      
      const weekDataObject: AdminWeeklyChartDataPoint = {
        week: weekId,
        teamAverage: parseFloat(teamAverage.toFixed(1)),
        goalLine: parseFloat(goalLine.toFixed(1)),
      };

      admins.forEach(admin => {
        const adminKey = admin.replace(/\s+/g, '') + 'Progress';
        weekDataObject[adminKey] = parseFloat(adminProgressMap[adminKey]?.progressPercent.toFixed(1) || "0.0");
      });

      return weekDataObject;
    });
    console.log("AdminWeeklyProgress: Generated chartData:", weeklyData);
    return { chartData: weeklyData, admins };
  }, []);


  const loadAndProcessTasks = useCallback(() => {
    console.log("Dashboard: Attempting to load tasks from localStorage key 'uploadedTasks'.");
    const storedTasksJson = localStorage.getItem('uploadedTasks');
    if (storedTasksJson) {
      try {
        const loadedTasks: Task[] = JSON.parse(storedTasksJson);
        console.log(`Dashboard: Successfully parsed ${loadedTasks.length} tasks from localStorage.`);
        if (loadedTasks && loadedTasks.length > 0) {
          setTotalTasks(loadedTasks.length);

          const statusCounts: Record<TaskStatus, number> = {
            "Missing Estimated Dates": 0,
            "Missing POD": 0,
            "Pending to Invoice Out of Time": 0,
          };

          let completedCount = 0;
          loadedTasks.forEach(task => {
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

          const { chartData: adminProgress, admins: currentAdmins } = calculateAdminWeeklyProgress(loadedTasks);
          setAdminWeeklyProgressData(adminProgress);
          setActiveAdmins(currentAdmins);

        } else {
          console.log("Dashboard: No tasks found in localStorage or tasks array is empty after parsing.");
          setTaskOverviewData([
              { name: t(STATUS_TRANSLATION_KEYS["Missing Estimated Dates"] as any), value: 0, fill: CHART_FILLS["Missing Estimated Dates"] },
              { name: t(STATUS_TRANSLATION_KEYS["Missing POD"] as any), value: 0, fill: CHART_FILLS["Missing POD"] },
              { name: t(STATUS_TRANSLATION_KEYS["Pending to Invoice Out of Time"] as any), value: 0, fill: CHART_FILLS["Pending to Invoice Out of Time"] },
          ]);
          setTotalTasks(0);
          setTasksCompletedCount(0);
          setAdminWeeklyProgressData([]);
          setActiveAdmins([]);
        }
      } catch (error) {
        console.error("Error processing tasks from localStorage for dashboard:", error);
        setTaskOverviewData([
            { name: t(STATUS_TRANSLATION_KEYS["Missing Estimated Dates"] as any), value: 0, fill: CHART_FILLS["Missing Estimated Dates"] },
            { name: t(STATUS_TRANSLATION_KEYS["Missing POD"] as any), value: 0, fill: CHART_FILLS["Missing POD"] },
            { name: t(STATUS_TRANSLATION_KEYS["Pending to Invoice Out of Time"] as any), value: 0, fill: CHART_FILLS["Pending to Invoice Out of Time"] },
        ]);
        setTotalTasks(0);
        setTasksCompletedCount(0);
        setAdminWeeklyProgressData([]);
        setActiveAdmins([]);
      }
    } else {
        console.log("Dashboard: 'uploadedTasks' not found in localStorage.");
        setTaskOverviewData([
            { name: t(STATUS_TRANSLATION_KEYS["Missing Estimated Dates"] as any), value: 0, fill: CHART_FILLS["Missing Estimated Dates"] },
            { name: t(STATUS_TRANSLATION_KEYS["Missing POD"] as any), value: 0, fill: CHART_FILLS["Missing POD"] },
            { name: t(STATUS_TRANSLATION_KEYS["Pending to Invoice Out of Time"] as any), value: 0, fill: CHART_FILLS["Pending to Invoice Out of Time"] },
        ]);
        setTotalTasks(0);
        setTasksCompletedCount(0);
        setAdminWeeklyProgressData([]);
        setActiveAdmins([]);
    }
  }, [t, calculateAdminWeeklyProgress]); 

  useEffect(() => {
    loadAndProcessTasks(); 

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'uploadedTasks') {
        console.log("Dashboard: Detected storage change for 'uploadedTasks'. Reloading data.");
        loadAndProcessTasks();
      }
    };

    const handleTasksUpdatedEvent = () => {
      console.log("Dashboard: Detected 'tasksUpdatedInStorage' event. Reloading data.");
      loadAndProcessTasks();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('tasksUpdatedInStorage', handleTasksUpdatedEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tasksUpdatedInStorage', handleTasksUpdatedEvent);
    };
  }, [loadAndProcessTasks]);


  const recentActivities = [
      { user: "Alice", actionKey: "dashboard.activityCompletedTask", taskName: "Design Homepage", timeKey: "dashboard.hoursAgo", timeArgs: { count: 2 }, avatar: "https://placehold.co/40x40.png?text=A" , dataAiHint: "female avatar"},
      { user: "Bob", actionKey: "dashboard.activityUpdatedStatus", taskName: "API Integration", status: t('dashboard.inProgress'), timeKey: "dashboard.hoursAgo", timeArgs: { count: 5 }, avatar: "https://placehold.co/40x40.png?text=B", dataAiHint: "male avatar" },
      { user: "Charlie", actionKey: "dashboard.activityAddedNewTask", taskName: "User Feedback Collection", timeKey: "dashboard.daysAgo", timeArgs: { count: 1 }, avatar: "https://placehold.co/40x40.png?text=C", dataAiHint: "person avatar" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title={t('dashboard.totalTasks')} value={totalTasks} icon={<ListChecks className="h-6 w-6 text-primary" />} description={t('dashboard.acrossAllProjects')} />
        <MetricCard title={t('dashboard.activeProjects')} value="15" icon={<Briefcase className="h-6 w-6 text-primary" />} description={t('dashboard.fromLastWeek')} />
        <MetricCard title={t('dashboard.tasksCompleted')} value={tasksCompletedCount} icon={<CheckCircle2 className="h-6 w-6 text-[hsl(var(--success))]" />} description={t('dashboard.thisMonth')} />
        <MetricCard title={t('dashboard.teamMembers')} value="12" icon={<Users className="h-6 w-6 text-primary" />} description={t('dashboard.activeUsers')} />
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              {t('dashboard.adminWeeklyProgress')}
            </CardTitle>
            <CardDescription>{t('dashboard.adminProgressDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
             {/* Conditional rendering for the chart or a "no data" message */}
            {adminWeeklyProgressData.length > 0 || activeAdmins.length > 0 ? (
              <AdminWeeklyProgressChart data={adminWeeklyProgressData} admins={activeAdmins} />
            ) : (
              <p className="text-center text-muted-foreground py-10">
                {totalTasks > 0 ? t('dashboard.adminWeeklyProgressChart.noData') : t('dashboard.adminWeeklyProgressChart.uploadDataPrompt')}
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


    

    