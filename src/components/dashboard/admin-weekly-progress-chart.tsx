
"use client";

import { Bar, BarChart, Line, ComposedChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LabelList } from "recharts";
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

const DataLabel = ({ x, y, value }: { x?: number; y?: number; value?: number }) => {
  if (x === undefined || y === undefined || value === undefined || value === null) return null;
  return (
    <text x={x} y={y} dy={-4} fill="hsl(var(--foreground))" fontSize={10} textAnchor="middle">
      {`${Math.round(value)}%`}
    </text>
  );
};


export function AdminWeeklyProgressChart({ data, admins }: AdminWeeklyProgressChartProps) {
  const { t } = useLanguage();

  const chartConfig = useMemo(() => {
    const config: any = {
      teamAverage: {
        label: t('dashboard.adminWeeklyProgressChart.teamAverage'), // Ensured key is specific
        color: "hsl(var(--foreground))",
      },
      goalLine: {
        label: t('dashboard.adminWeeklyProgressChart.goalLine'), // Ensured key is specific
        color: "hsl(var(--destructive))",
      },
    };
    admins.forEach((admin, index) => {
      const sanitizedAdminName = admin.replace(/\s+/g, '') + 'Progress';
      config[sanitizedAdminName] = { 
        label: admin, // Admin names directly from data
        color: ADMIN_COLORS[index % ADMIN_COLORS.length],
      };
    });
    return config;
  }, [admins, t]);

  if (!data || data.length === 0) {
    // This message is shown if the 'data' prop itself is empty.
    // The dashboard page might show a more general "upload data" prompt if no tasks exist at all.
    return <p className="text-center text-muted-foreground py-10">{t('dashboard.adminWeeklyProgressChart.noDataForChart')}</p>;
  }

  const chartMargin = { top: 20, right: 30, left: 20, bottom: 20 };

  return (
    <ChartContainer config={chartConfig} className="min-h-[350px] w-full">
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={data} margin={chartMargin}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis 
            dataKey="week" 
            tickLine={false} 
            axisLine={false} 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12}
            tickFormatter={(value) => t('dashboard.adminWeeklyProgressChart.weekLabel', { week: value.substring(5).replace('W','') })}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            label={{ value: t('dashboard.adminWeeklyProgressChart.yAxisLabel'), angle: -90, position: 'insideLeft', offset: -5, style: {textAnchor: 'middle', fontSize: '12px', fill: 'hsl(var(--muted-foreground))'} }}
          />
          <Tooltip
            content={<ChartTooltipContent 
                        formatter={(value, name, item) => {
                            const configKey = item.dataKey as string;
                            const currentConfig = chartConfig[configKey];
                            return (
                                <div className="flex items-center gap-2">
                                    <span style={{color: currentConfig?.color || item.color}}>●</span>
                                    {currentConfig?.label || name}: <span className="font-bold">{typeof value === 'number' ? `${value.toFixed(1)}%` : value}</span>
                                </div>
                            );
                        }} 
                     />} 
            cursor={{ fill: "hsl(var(--muted))" }}
          />
          <Legend content={<ChartLegendContent />} verticalAlign="top" wrapperStyle={{paddingBottom: '10px'}} />

          {admins.map((admin, index) => {
            const dataKey = `${admin.replace(/\s+/g, '')}Progress`;
            return (
              <Bar 
                key={admin} 
                dataKey={dataKey}
                name={admin} // This name appears in default legend and tooltip
                fill={ADMIN_COLORS[index % ADMIN_COLORS.length]} 
                radius={[4, 4, 0, 0]}
                barSize={Math.max(10, 60 / admins.length)}
              >
                <LabelList dataKey={dataKey} content={<DataLabel />} />
              </Bar>
            );
          })}

          <Line 
            type="monotone" 
            dataKey="teamAverage" 
            name={t('dashboard.adminWeeklyProgressChart.teamAverage')} // Name for legend/tooltip
            stroke="hsl(var(--foreground))" 
            strokeWidth={2} 
            dot={{ r: 4, fill: 'hsl(var(--foreground))' }} 
            activeDot={{ r: 6, fill: 'hsl(var(--foreground))' }}
          >
             <LabelList dataKey="teamAverage" content={<DataLabel />} />
          </Line>
          <Line 
            type="monotone" 
            dataKey="goalLine" 
            name={t('dashboard.adminWeeklyProgressChart.goalLine')} // Name for legend/tooltip
            stroke="hsl(var(--destructive))" 
            strokeWidth={2} 
            strokeDasharray="5 5" 
            dot={{ r: 4, fill: 'hsl(var(--destructive))' }} 
            activeDot={{ r: 6, fill: 'hsl(var(--destructive))' }}
          >
            <LabelList dataKey="goalLine" content={<DataLabel />} />
          </Line>
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
