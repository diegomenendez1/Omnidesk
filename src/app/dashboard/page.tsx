
"use client";
import { MetricCard } from '@/components/dashboard/metric-card';
import { SampleStatsChart } from '@/components/dashboard/sample-stats-chart';
import { Users, Activity, CheckCircle2, Briefcase, BarChart3, ListChecks, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/context/language-context';

export default function DashboardPage() {
  const { t } = useLanguage();

  const projectSummaryData = {
    totalProjects: 25,
    activeProjects: 15,
    completedProjects: 8,
    onHoldProjects: 2,
  };

  const taskOverviewData = [
    { name: t('dashboard.todo'), value: 120, fill: "hsl(var(--chart-1))" },
    { name: t('dashboard.inProgress'), value: 75, fill: "hsl(var(--chart-2))" },
    { name: t('dashboard.completed'), value: 350, fill: "hsl(var(--chart-3))" },
    { name: t('dashboard.blocked'), value: 30, fill: "hsl(var(--chart-4))" },
  ];
  
  const recentActivities = [
      { user: "Alice", actionKey: "dashboard.activityCompletedTask", taskName: "Design Homepage", timeKey: "dashboard.hoursAgo", timeArgs: { count: 2 }, avatar: "https://placehold.co/40x40.png?text=A" , dataAiHint: "female avatar"},
      { user: "Bob", actionKey: "dashboard.activityUpdatedStatus", taskName: "API Integration", status: t('dashboard.inProgress'), timeKey: "dashboard.hoursAgo", timeArgs: { count: 5 }, avatar: "https://placehold.co/40x40.png?text=B", dataAiHint: "male avatar" },
      { user: "Charlie", actionKey: "dashboard.activityAddedNewTask", taskName: "User Feedback Collection", timeKey: "dashboard.daysAgo", timeArgs: { count: 1 }, avatar: "https://placehold.co/40x40.png?text=C", dataAiHint: "person avatar" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title={t('dashboard.totalTasks')} value="575" icon={<ListChecks className="h-6 w-6 text-primary" />} description={t('dashboard.acrossAllProjects')} />
        <MetricCard title={t('dashboard.activeProjects')} value="15" icon={<Briefcase className="h-6 w-6 text-primary" />} description={t('dashboard.fromLastWeek')} />
        <MetricCard title={t('dashboard.tasksCompleted')} value="350" icon={<CheckCircle2 className="h-6 w-6 text-[hsl(var(--success))]" />} description={t('dashboard.thisMonth')} />
        <MetricCard title={t('dashboard.teamMembers')} value="12" icon={<Users className="h-6 w-6 text-primary" />} description={t('dashboard.activeUsers')} />
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
