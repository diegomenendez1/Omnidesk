
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

const DataLabel = ({ x, y, value, unitSuffixKey }: { x?: number; y?: number; value?: number | null; unitSuffixKey?: string }) => {
  const { t } = useLanguage();
  if (x === undefined || y === undefined || value === undefined || value === null) return null;
  const unit = unitSuffixKey ? ` ${t(unitSuffixKey as any)}` : "";
  return (
    <text x={x} y={y} dy={-4} fill="hsl(var(--foreground))" fontSize={12} textAnchor="middle">
      {`${value.toFixed(2)}${unit}`}
    </text>
  );
};

export function AverageResolutionTimeChart({ data, teamAverageDays }: AverageResolutionTimeChartProps) {
  const { t } = useLanguage();

  const chartConfig = useMemo(() => {
    const config: any = {
      averageDays: { // General key for bars
        label: t('dashboard.averageResolutionTimeChart.yAxisLabel'),
      },
      teamAverage: {
        label: t('dashboard.averageResolutionTimeChart.teamAverageLabel'),
        color: "hsl(var(--foreground))", // Solid distinct color for team average line
      },
    };
     data.forEach((item, index) => {
        if (item.adminName) {
            config[item.adminName] = {
                label: item.adminName,
                color: ADMIN_COLORS[index % ADMIN_COLORS.length]
            };
        }
    });
    return config;
  }, [t, data]);

  const validData = data.filter(d => d.averageDays !== null);
  if (validData.length === 0) {
    // This condition is if NO admin has resolved tasks.
    // If some admins have data and others don't, those without data just won't have a bar.
    return <p className="text-center text-muted-foreground py-10">{t('dashboard.averageResolutionTimeChart.noResolvedTasks')}</p>;
  }


  const chartMargin = { top: 20, right: 30, left: 20, bottom: 50 }; // Increased bottom for legend

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
            interval={0}
            angle={-30}
            textAnchor="end"
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            label={{ value: t('dashboard.averageResolutionTimeChart.yAxisLabel'), angle: -90, position: 'insideLeft', offset: -10, style: { textAnchor: 'middle', fontSize: '12px', fill: 'hsl(var(--muted-foreground))' } }}
            domain={[0, 'dataMax + 5']} 
          />
          <Tooltip
            content={<ChartTooltipContent
              formatter={(value, name, item) => {
                // 'name' will be 'averageDays' from the Bar's dataKey
                // 'item.payload.adminName' is the specific admin for this bar
                const adminName = item.payload.adminName;
                const adminConfig = chartConfig[adminName] || {};
                return (
                  <div className="flex items-center gap-2">
                    <span style={{color: adminConfig.color || item.color || item.payload.fill}}>●</span>
                     {adminName}: <span className="font-bold">{typeof value === 'number' ? `${value.toFixed(2)} ${t('dashboard.averageResolutionTimeChart.avgDaysSuffix')}` : t('interactiveTable.notAvailable')}</span>
                  </div>
                );
              }}
            />}
            cursor={{ fill: "hsl(var(--muted))" }}
          />
          <Legend 
            content={<ChartLegendContent />} 
            verticalAlign="bottom" 
            wrapperStyle={{paddingTop: '20px'}} 
          />
          
          <Bar dataKey="averageDays" nameKey="adminName" radius={[4, 4, 0, 0]}>
             {data.map((entry, index) => (
                 // Each Bar needs a unique fill, name is for legend
                <Bar key={entry.adminName} dataKey="averageDays" fill={ADMIN_COLORS[index % ADMIN_COLORS.length]} name={entry.adminName} />
            ))}
            <LabelList dataKey="averageDays" content={<DataLabel unitSuffixKey="dashboard.averageResolutionTimeChart.avgDaysSuffix" />} />
          </Bar>

          {teamAverageDays !== null && (
            <ReferenceLine
              y={teamAverageDays}
              stroke="hsl(var(--primary))" // Prominent color for team average
              strokeWidth={2}
              ifOverflow="extendDomain"
              label={{
                value: `${t('dashboard.averageResolutionTimeChart.teamAverageLabel')}: ${teamAverageDays.toFixed(2)} ${t('dashboard.averageResolutionTimeChart.avgDaysSuffix')}`,
                position: "insideTopRight",
                fill: "hsl(var(--primary))",
                fontSize: 10,
                dy: -5, 
              }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

    