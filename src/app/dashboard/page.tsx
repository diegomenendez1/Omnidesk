import { MetricCard } from '@/components/dashboard/metric-card';
import { SampleStatsChart } from '@/components/dashboard/sample-stats-chart';
import { Users, Activity, CheckCircle2, Briefcase, BarChart3, ListChecks, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function DashboardPage() {
  const projectSummaryData = {
    totalProjects: 25,
    activeProjects: 15,
    completedProjects: 8,
    onHoldProjects: 2,
  };

  const taskOverviewData = [
    { name: 'To Do', value: 120, fill: "hsl(var(--chart-1))" },
    { name: 'In Progress', value: 75, fill: "hsl(var(--chart-2))" },
    { name: 'Completed', value: 350, fill: "hsl(var(--chart-3))" },
    { name: 'Blocked', value: 30, fill: "hsl(var(--chart-4))" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Tasks" value="575" icon={<ListChecks className="h-6 w-6 text-primary" />} description="Across all projects" />
        <MetricCard title="Active Projects" value="15" icon={<Briefcase className="h-6 w-6 text-primary" />} description="+2 from last week" />
        <MetricCard title="Tasks Completed" value="350" icon={<CheckCircle2 className="h-6 w-6 text-[hsl(var(--success))]" />} description="This month" />
        <MetricCard title="Team Members" value="12" icon={<Users className="h-6 w-6 text-primary" />} description="Active users" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Task Progress Overview</CardTitle>
            <CardDescription>A quick look at task distribution by status.</CardDescription>
          </CardHeader>
          <CardContent>
            <SampleStatsChart data={taskOverviewData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Project Spotlight</CardTitle>
            <CardDescription>Highlighting a key ongoing project.</CardDescription>
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
            <h3 className="text-lg font-semibold">Project Phoenix</h3>
            <p className="text-sm text-muted-foreground">
              This initiative aims to revamp our core platform, enhancing user experience and performance. Currently in the development phase with major milestones approaching.
            </p>
            <div className="flex justify-between items-center text-sm">
              <span>Progress: <strong>65%</strong></span>
              <span className="text-primary">Deadline: 2024-12-15</span>
            </div>
          </CardContent>
        </Card>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
           <CardDescription>Latest updates from your team.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {[
              { user: "Alice", action: "completed task 'Design Homepage'", time: "2 hours ago", avatar: "https://placehold.co/40x40.png?text=A" , dataAiHint: "female avatar"},
              { user: "Bob", action: "updated status of 'API Integration' to In Progress", time: "5 hours ago", avatar: "https://placehold.co/40x40.png?text=B", dataAiHint: "male avatar" },
              { user: "Charlie", action: "added a new task 'User Feedback Collection'", time: "1 day ago", avatar: "https://placehold.co/40x40.png?text=C", dataAiHint: "person avatar" },
            ].map((activity, index) => (
              <li key={index} className="flex items-center gap-3 p-3 rounded-md hover:bg-muted border border-transparent hover:border-border transition-colors">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={activity.avatar} data-ai-hint={activity.dataAiHint} />
                  <AvatarFallback>{activity.user.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm"><span className="font-semibold">{activity.user}</span> {activity.action}.</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
