
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
import { getWeekIdentifier, getWeeksInRange, parseWeekIdentifier } from '@/lib/utils';
import { startOfISOWeek, endOfISOWeek, parseISO, isValid } from 'date-fns';


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
    if (!tasks || tasks.length === 0) return { chartData: [], admins: [] };

    const relevantTasks = tasks.filter(task => task.resolutionAdmin && task.createdAt);
    if (relevantTasks.length === 0) return { chartData: [], admins: [] };

    const admins = Array.from(new Set(relevantTasks.map(task => task.resolutionAdmin!))).sort();
    
    let minDate = new Date();
    let maxDate = new Date(1970,0,1);

    relevantTasks.forEach(task => {
      try {
        const createdAt = parseISO(task.createdAt!);
        if (isValid(createdAt)) {
          if (createdAt < minDate) minDate = createdAt;
          if (createdAt > maxDate) maxDate = createdAt;
        }
        if (task.resolvedAt) {
          const resolvedAt = parseISO(task.resolvedAt);
           if (isValid(resolvedAt)) {
             if (resolvedAt > maxDate) maxDate = resolvedAt;
             if (resolvedAt < minDate) minDate = resolvedAt; // Case where resolvedAt might be before any createdAt
           }
        }
      } catch (e) {
        console.warn("Skipping task due to invalid date for progress calculation:", task, e);
      }
    });
     if (!isValid(minDate) || !isValid(maxDate) || minDate > maxDate) { // if only invalid dates or no tasks, or minDate is still initial future date
      minDate = new Date(); // default to today if no valid dates
      maxDate = new Date();
    }
    if (relevantTasks.length > 0 && maxDate < new Date()) { // Ensure maxDate includes today if it's in the past
        maxDate = new Date();
    }


    const weeks = getWeeksInRange(minDate, maxDate);
    if (weeks.length === 0) return { chartData: [], admins };

    const weeklyData: AdminWeeklyChartDataPoint[] = weeks.map(weekId => {
      const { endOfWeek: currentEndOfWeek } = parseWeekIdentifier(weekId);
      const adminProgressMap: { [adminName: string]: { resolved: number; totalAssigned: number; progressPercent: number; }} = {};
      
      let totalTeamProgressSum = 0;
      let contributingAdminsCount = 0;

      admins.forEach(admin => {
        const tasksAssignedToAdminUpToWeek = relevantTasks.filter(task => {
            if (task.resolutionAdmin !== admin) return false;
            try {
                const createdAt = parseISO(task.createdAt!);
                return isValid(createdAt) && createdAt <= currentEndOfWeek;
            } catch { return false; }
        });

        const tasksResolvedByAdminUpToWeek = tasksAssignedToAdminUpToWeek.filter(task => {
            if (!PROTECTED_RESOLUTION_STATUSES.includes(task.resolutionStatus as TaskResolutionStatus)) return false;
            if (!task.resolvedAt) return false;
            try {
                const resolvedAt = parseISO(task.resolvedAt);
                return isValid(resolvedAt) && resolvedAt <= currentEndOfWeek;
            } catch { return false; }
        });
        
        const totalAssigned = tasksAssignedToAdminUpToWeek.length;
        const resolvedCount = tasksResolvedByAdminUpToWeek.length;
        const progressPercent = totalAssigned > 0 ? (resolvedCount / totalAssigned) * 100 : 0;

        adminProgressMap[admin.replace(/\s+/g, '') + 'Progress'] = { // Store with sanitized key
            resolved: resolvedCount,
            totalAssigned: totalAssigned,
            progressPercent: progressPercent
        };

        if (totalAssigned > 0) { // Only include admins with assignments in team average
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
        // Use sanitized key for assignment
        weekDataObject[admin.replace(/\s+/g, '') + 'Progress'] = parseFloat(adminProgressMap[admin.replace(/\s+/g, '') + 'Progress'].progressPercent.toFixed(1));
      });

      return weekDataObject;
    });

    return { chartData: weeklyData, admins };
  }, []);


  const loadAndProcessTasks = useCallback(() => {
    const storedTasksJson = localStorage.getItem('uploadedTasks');
    if (storedTasksJson) {
      try {
        const loadedTasks: Task[] = JSON.parse(storedTasksJson);
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

          // Calculate and set admin weekly progress
          const { chartData: adminProgress, admins: currentAdmins } = calculateAdminWeeklyProgress(loadedTasks);
          setAdminWeeklyProgressData(adminProgress);
          setActiveAdmins(currentAdmins);

        } else {
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
        loadAndProcessTasks();
      }
    };

    const handleTasksUpdatedEvent = () => {
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

      <div className="grid gap-6 md:grid-cols-1"> {/* Changed to 1 col for now to give more space to new chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              {t('dashboard.adminWeeklyProgress')}
            </CardTitle>
            <CardDescription>{t('dashboard.adminProgressDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminWeeklyProgressChart data={adminWeeklyProgressData} admins={activeAdmins} />
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
