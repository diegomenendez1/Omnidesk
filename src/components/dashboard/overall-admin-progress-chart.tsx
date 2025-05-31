
"use client";

import * as React from "react"; // Added this line
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ReferenceLine, LabelList } from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
} from "@/components/ui/chart";
import { useLanguage } from "@/context/language-context";
// Removed type import for useMemo as React.useMemo will be used directly

export interface OverallAdminProgressDataPoint {
  adminName: string;
  progressPercent: number | null;
}

interface OverallAdminProgressChartProps {
  data: OverallAdminProgressDataPoint[];
  teamAveragePercent: number | null;
  goalPercent: number;
  allAdmins: string[];
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
  const numericX = Number(x);
  const numericY = Number(y);
  if (isNaN(numericX) || isNaN(numericY)) return null;

  return (
    <text x={numericX} y={numericY} dy={-4} fill="hsl(var(--foreground))" fontSize={12} textAnchor="middle">
      {`${value.toFixed(0)}${unit}`}
    </text>
  );
};

export function OverallAdminProgressChart({ data, teamAveragePercent, goalPercent, allAdmins }: OverallAdminProgressChartProps) {
  const { t } = useLanguage();

  const chartConfig = React.useMemo(() => { 
    const config: any = {
      progressPercent: {
        label: t('dashboard.overallAdminProgress.yAxisLabel'),
      },
      teamAverage: {
        label: t('dashboard.overallAdminProgress.teamAverageLabel'),
        color: "hsl(var(--primary))", 
      },
      goalLine: {
        label: t('dashboard.overallAdminProgress.goalLineLabel'),
        color: "hsl(var(--destructive))",
      },
    };
    allAdmins.forEach((admin, index) => {
        config[admin] = {
            label: admin,
            color: ADMIN_COLORS[index % ADMIN_COLORS.length]
        };
    });
    return config;
  }, [t, allAdmins]);

  const chartData = React.useMemo(() => { 
    return allAdmins.map(adminName => {
      const adminData = data.find(d => d.adminName === adminName);
      return {
        adminName,
        progressPercent: adminData ? adminData.progressPercent : null,
      };
    }).sort((a, b) => {
        if (a.progressPercent === null && b.progressPercent === null) return a.adminName.localeCompare(b.adminName);
        if (a.progressPercent === null) return 1;
        if (b.progressPercent === null) return -1;
        return b.progressPercent - a.progressPercent;
    });
  }, [allAdmins, data]);

  if (!chartData || chartData.length === 0) {
     if (allAdmins.length > 0 && data.every(d => d.progressPercent === null)) {
        // Render chart with empty state for admins
    } else if (allAdmins.length === 0) {
        return <p className="text-center text-muted-foreground py-10">{t('dashboard.overallAdminProgress.uploadDataPrompt')}</p>;
    }
  }

  const chartMargin = { top: 20, right: 30, left: 20, bottom: 50 };

  return (
    <ChartContainer config={chartConfig} className="min-h-[350px] w-full">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} margin={chartMargin}>
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
            // tickFormatter={(value) => `Sem. ${value.substring(value.indexOf('-W') + 2)}`}
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
                const adminName = item.payload.adminName;
                const adminConfig = chartConfig[adminName] || {};
                return (
                  <div className="flex items-center gap-2">
                    <span style={{color: adminConfig.color || item.color || item.payload.fill }}>●</span>
                    {adminName}: <span className="font-bold">{typeof value === 'number' ? `${value.toFixed(0)}%` : (value === null ? t('interactiveTable.notAvailable') : value)}</span>
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
            {chartData.map((entry) => (
              <Bar key={entry.adminName} dataKey="progressPercent" fill={chartConfig[entry.adminName]?.color || ADMIN_COLORS[allAdmins.indexOf(entry.adminName) % ADMIN_COLORS.length]} name={entry.adminName} />
            ))}
            <LabelList dataKey="progressPercent" content={<DataLabel />} />
          </Bar>
          {teamAveragePercent !== null && (
            <ReferenceLine
              y={teamAveragePercent}
              stroke="hsl(var(--primary))" // More visible color for team average
              strokeWidth={2}
              ifOverflow="extendDomain"
              label={{
                value: `${t('dashboard.overallAdminProgress.teamAverageLabel')}: ${teamAveragePercent.toFixed(0)}%`,
                position: "insideTopRight",
                fill: "hsl(var(--primary))", // Ensure label color matches line
                fontSize: 10,
                dy: -5, 
              }}
            />
          )}
          <ReferenceLine
            y={goalPercent}
            stroke="hsl(var(--destructive))" // Destructive color for goal
            strokeDasharray="5 5" // Dotted line for goal
            strokeWidth={2}
            ifOverflow="extendDomain"
            label={{
              value: `${t('dashboard.overallAdminProgress.goalLineLabel')}: ${goalPercent.toFixed(0)}%`,
              position: "insideTopLeft",
              fill: "hsl(var(--destructive))", // Ensure label color matches line
              fontSize: 10,
              dy: -5,
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
