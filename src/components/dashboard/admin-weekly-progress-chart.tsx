
"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ReferenceLine, LabelList } from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
} from "@/components/ui/chart";
import { useLanguage } from "@/context/language-context";
import { useMemo } from "react";

// Renamed interface for clarity as it's now overall progress, not weekly
export interface OverallAdminProgressDataPoint {
  adminName: string;
  progressPercent: number | null; // Progress percentage for this admin
  // Optional: could add totalAssigned and totalResolved for richer tooltips
  // totalAssigned: number;
  // totalResolved: number;
}

interface OverallAdminProgressChartProps {
  data: OverallAdminProgressDataPoint[]; // Array of progress data per admin
  teamAveragePercent: number | null;
  goalPercent: number;
  allAdmins: string[]; // List of all admin names to ensure everyone is considered
}

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

const DataLabel = ({ x, y, value, unit = "%" }: { x?: number; y?: number; value?: number | null; unit?: string }) => {
  if (x === undefined || y === undefined || value === undefined || value === null) return null;
  return (
    <text x={x} y={y} dy={-4} fill="hsl(var(--foreground))" fontSize={12} textAnchor="middle">
      {`${value.toFixed(0)}${unit}`}
    </text>
  );
};

// Renamed component
export function OverallAdminProgressChart({ data, teamAveragePercent, goalPercent, allAdmins }: OverallAdminProgressChartProps) {
  const { t } = useLanguage();

  const chartConfig = useMemo(() => {
    const config: any = {
      progressPercent: { // General key for the bars
        label: t('dashboard.overallAdminProgress.yAxisLabel'), // "Progress (%)"
      },
      teamAverage: {
        label: t('dashboard.overallAdminProgress.teamAverageLabel'),
        color: "hsl(var(--foreground))", // Example: distinct color for team average line
      },
      goalLine: {
        label: t('dashboard.overallAdminProgress.goalLineLabel'),
        color: "hsl(var(--destructive))", // Example: distinct color for goal line
      },
    };
    // Add individual admin configurations for legend/tooltip if needed, though bars are differentiated by color and X-axis
    allAdmins.forEach((admin, index) => {
        config[admin] = { // Use adminName directly as key if data structure allows, or map it
            label: admin,
            color: ADMIN_COLORS[index % ADMIN_COLORS.length]
        };
    });
    return config;
  }, [t, allAdmins]);

  if (!data || data.length === 0) {
    return <p className="text-center text-muted-foreground py-10">{t('dashboard.overallAdminProgress.noData')}</p>;
  }

  const chartMargin = { top: 20, right: 30, left: 20, bottom: 50 }; // Increased bottom margin for legend

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
            interval={0} // Show all admin names
            angle={-30} // Angle labels if many admins
            textAnchor="end" // Adjust anchor for angled labels
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            label={{ value: t('dashboard.overallAdminProgress.yAxisLabel'), angle: -90, position: 'insideLeft', offset: -5, style: { textAnchor: 'middle', fontSize: '12px', fill: 'hsl(var(--muted-foreground))' } }}
          />
          <Tooltip
            content={<ChartTooltipContent
              formatter={(value, name, item) => {
                // name here will be 'progressPercent' if Bar dataKey is 'progressPercent'
                // item.payload.adminName will give the specific admin
                const adminName = item.payload.adminName;
                const adminConfig = chartConfig[adminName] || {};

                return (
                  <div className="flex items-center gap-2">
                    <span style={{color: adminConfig.color || item.color || item.payload.fill }}>●</span>
                    {adminName}: <span className="font-bold">{typeof value === 'number' ? `${value.toFixed(0)}%` : value}</span>
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

          <Bar dataKey="progressPercent" nameKey="adminName" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Bar key={entry.adminName} dataKey="progressPercent" fill={ADMIN_COLORS[allAdmins.indexOf(entry.adminName) % ADMIN_COLORS.length]} name={entry.adminName} />
            ))}
            <LabelList dataKey="progressPercent" content={<DataLabel />} />
          </Bar>
          
          {teamAveragePercent !== null && (
            <ReferenceLine
              y={teamAveragePercent}
              stroke="hsl(var(--foreground))" // Solid line for team average
              strokeWidth={2}
              ifOverflow="extendDomain"
              label={{
                value: `${t('dashboard.overallAdminProgress.teamAverageLabel')}: ${teamAveragePercent.toFixed(0)}%`,
                position: "insideTopRight",
                fill: "hsl(var(--foreground))",
                fontSize: 10,
                dy: -5
              }}
            />
          )}
          
          <ReferenceLine
            y={goalPercent}
            stroke="hsl(var(--destructive))" // Dashed line for goal
            strokeDasharray="5 5"
            strokeWidth={2}
            ifOverflow="extendDomain"
            label={{
              value: `${t('dashboard.overallAdminProgress.goalLineLabel')}: ${goalPercent.toFixed(0)}%`,
              position: "insideTopLeft", // Adjusted position
              fill: "hsl(var(--destructive))",
              fontSize: 10,
              dy: -5
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

    