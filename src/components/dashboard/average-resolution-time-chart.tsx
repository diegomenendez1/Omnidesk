
"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ReferenceLine, LabelList } from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
} from "@/components/ui/chart";
import { useLanguage } from "@/context/language-context";
import { useMemo } from "react";

export interface AdminResolutionTimeDataPoint {
  adminName: string;
  averageDays: number | null; // Can be null if admin has no resolved tasks
}

interface AverageResolutionTimeChartProps {
  data: AdminResolutionTimeDataPoint[];
  teamAverageDays: number | null;
}

const ADMIN_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-1) / 0.7)",
  "hsl(var(--chart-2) / 0.7)",
  "hsl(var(--chart-3) / 0.7)",
];

const DataLabel = ({ x, y, value, unit }: { x?: number; y?: number; value?: number | null; unit?: string }) => {
  if (x === undefined || y === undefined || value === undefined || value === null) return null;
  return (
    <text x={x} y={y} dy={-4} fill="hsl(var(--foreground))" fontSize={10} textAnchor="middle">
      {`${value.toFixed(1)}${unit || ''}`}
    </text>
  );
};

export function AverageResolutionTimeChart({ data, teamAverageDays }: AverageResolutionTimeChartProps) {
  const { t } = useLanguage();

  const chartConfig = useMemo(() => {
    const config: any = {
      teamAverage: {
        label: t('dashboard.averageResolutionTimeChart.teamAverageLabel'),
        color: "hsl(var(--foreground))",
      },
    };
    // Admins will be dynamically added if needed or can rely on default Bar naming
    return config;
  }, [t]);

  if (!data || data.length === 0) {
    return <p className="text-center text-muted-foreground py-10">{t('dashboard.averageResolutionTimeChart.noData')}</p>;
  }
  
  const validData = data.filter(d => d.averageDays !== null);
  if (validData.length === 0 && teamAverageDays === null) {
    return <p className="text-center text-muted-foreground py-10">{t('dashboard.averageResolutionTimeChart.noResolvedTasks')}</p>;
  }


  const chartMargin = { top: 20, right: 30, left: 20, bottom: 20 };

  return (
    <ChartContainer config={chartConfig} className="min-h-[350px] w-full">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} margin={chartMargin}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="adminName"
            tickLine={false}
            axisLine={false}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            label={{ value: t('dashboard.averageResolutionTimeChart.yAxisLabel'), angle: -90, position: 'insideLeft', offset: -5, style: { textAnchor: 'middle', fontSize: '12px', fill: 'hsl(var(--muted-foreground))' } }}
            domain={[0, 'dataMax + 5']} // Add some padding to Y axis
          />
          <Tooltip
            content={<ChartTooltipContent
              formatter={(value, name, item) => {
                const adminName = item.payload.adminName;
                return (
                  <div className="flex items-center gap-2">
                    <span style={{color: item.fill || ADMIN_COLORS[data.findIndex(d => d.adminName === adminName) % ADMIN_COLORS.length]}}>●</span>
                     {t('dashboard.averageResolutionTimeChart.adminLabel', {adminName})}: <span className="font-bold">{typeof value === 'number' ? `${value.toFixed(1)} ${t('dashboard.averageResolutionTimeChart.avgDaysSuffix')}` : t('interactiveTable.notAvailable')}</span>
                  </div>
                );
              }}
            />}
            cursor={{ fill: "hsl(var(--muted))" }}
          />
          <Legend content={<ChartLegendContent />} verticalAlign="top" wrapperStyle={{paddingBottom: '10px'}} />
          
          {data.map((entry, index) => (
             <Bar
                key={entry.adminName}
                dataKey="averageDays"
                name={entry.adminName}
                fill={ADMIN_COLORS[index % ADMIN_COLORS.length]}
                radius={[4, 4, 0, 0]}
                barSize={Math.max(20, 100 / data.length)}
              >
              {/* We only want to render the bar for this specific admin in this iteration */}
              {/* To achieve this, the 'data' prop of BarChart should be an array of these single-admin objects */}
              {/* Or, more simply, ensure 'dataKey' correctly points to the value for the current admin. */}
              {/* The current structure of 'data' as AdminResolutionTimeDataPoint[] is fine. */}
              {/* Recharts Bar will pick the 'averageDays' from the object where adminName matches. */}
              <LabelList dataKey="averageDays" content={<DataLabel unit={` ${t('dashboard.averageResolutionTimeChart.avgDaysSuffix')}`} />} />

            </Bar>
          ))}

          {teamAverageDays !== null && (
            <ReferenceLine
              y={teamAverageDays}
              label={{
                value: `${t('dashboard.averageResolutionTimeChart.teamAverageLabel')}: ${teamAverageDays.toFixed(1)} ${t('dashboard.averageResolutionTimeChart.avgDaysSuffix')}`,
                position: "insideTopRight",
                fill: "hsl(var(--foreground))",
                fontSize: 10,
                dy: -5, 
              }}
              stroke="hsl(var(--foreground))"
              strokeDasharray="3 3"
              strokeWidth={2}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

    