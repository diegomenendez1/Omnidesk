
"use client";

import { Bar, BarChart, Line, ComposedChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
} from "@/components/ui/chart";
import { useLanguage } from "@/context/language-context";
import { useMemo } from "react";

export interface AdminWeeklyChartDataPoint {
  week: string; // "YYYY-Www"
  teamAverage: number;
  goalLine: number;
  [adminName: string]: number | string; // Progress percentage or week string
}

interface AdminWeeklyProgressChartProps {
  data: AdminWeeklyChartDataPoint[];
  admins: string[]; // List of admin names to generate bars for
}

// Generate somewhat distinct colors for admins
const ADMIN_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(200, 70%, 50%)",
  "hsl(280, 70%, 50%)",
  "hsl(50, 70%, 50%)",
];

export function AdminWeeklyProgressChart({ data, admins }: AdminWeeklyProgressChartProps) {
  const { t } = useLanguage();

  const chartConfig = useMemo(() => {
    const config: any = {
      teamAverage: {
        label: t('dashboard.adminWeeklyProgress.teamAverage'),
        color: "hsl(var(--foreground))",
      },
      goalLine: {
        label: t('dashboard.adminWeeklyProgress.goalLine'),
        color: "hsl(var(--destructive))",
      },
    };
    admins.forEach((admin, index) => {
      config[admin.replace(/\s+/g, '') + 'Progress'] = { // Sanitize admin name for key
        label: admin,
        color: ADMIN_COLORS[index % ADMIN_COLORS.length],
      };
    });
    return config;
  }, [admins, t]);

  if (!data || data.length === 0) {
    return <p className="text-center text-muted-foreground py-10">{t('dashboard.adminWeeklyProgress.noData')}</p>;
  }

  const chartMargin = { top: 5, right: 30, left: 0, bottom: 20 };

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={data} margin={chartMargin}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis 
            dataKey="week" 
            tickLine={false} 
            axisLine={false} 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12}
            tickFormatter={(value) => value.substring(5)} // Show only "Www"
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            content={<ChartTooltipContent 
                        formatter={(value, name, item) => {
                            const config = chartConfig[item.dataKey as string];
                            return (
                                <div className="flex items-center gap-2">
                                    {config?.label || name}: <span className="font-bold">{typeof value === 'number' ? `${value.toFixed(1)}%` : value}</span>
                                </div>
                            );
                        }} 
                     />} 
            cursor={{ fill: "hsl(var(--muted))" }}
          />
          <Legend content={<ChartLegendContent />} verticalAlign="top" height={40}/>

          {admins.map((admin, index) => (
            <Bar 
              key={admin} 
              dataKey={`${admin.replace(/\s+/g, '')}Progress`} // Use sanitized key
              name={admin} 
              fill={ADMIN_COLORS[index % ADMIN_COLORS.length]} 
              radius={[4, 4, 0, 0]}
              barSize={Math.max(10, 60 / admins.length)} // Adjust bar size
            />
          ))}

          <Line 
            type="monotone" 
            dataKey="teamAverage" 
            name={t('dashboard.adminWeeklyProgress.teamAverage')}
            stroke="hsl(var(--foreground))" 
            strokeWidth={2} 
            dot={{ r: 4 }} 
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="goalLine" 
            name={t('dashboard.adminWeeklyProgress.goalLine')}
            stroke="hsl(var(--destructive))" 
            strokeWidth={2} 
            strokeDasharray="5 5" 
            dot={{ r: 4 }} 
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

// Add new translation keys to your translations file:
// dashboard.adminWeeklyProgress.teamAverage = "Team Average"
// dashboard.adminWeeklyProgress.goalLine = "Goal Line"
// dashboard.adminWeeklyProgress.noData = "No data available for admin progress."
// in Spanish:
// dashboard.adminWeeklyProgress.teamAverage = "Promedio Equipo"
// dashboard.adminWeeklyProgress.goalLine = "Línea Objetivo"
// dashboard.adminWeeklyProgress.noData = "No hay datos disponibles para el progreso de administradores."

