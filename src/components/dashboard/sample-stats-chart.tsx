
"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import {
 ChartContainer,
 ChartTooltipContent,
} from "@/components/ui/chart";
import { Task } from "@/types";
import { calculateTaskStats } from "@/lib/utils"; // Assuming you have a utility function for calculations

interface ChartData {
  name: string;
  value: number;
  fill?: string;
}
interface SampleStatsChartProps {
 tasks: Task[];
}
interface CalculatedChartData {
  name: string;
  value: number;
}

const chartConfig = {
  value: {
    label: "Tasks",
    color: "hsl(var(--primary))",
  },
};

// Define margin object outside the component for stable reference
const barChartMargin = { top: 5, right: 20, left: -10, bottom: 5 };

export function SampleStatsChart({ tasks }: SampleStatsChartProps) {
  const chartData: CalculatedChartData[] = calculateTaskStats(tasks);

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={barChartMargin}>
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))", radius: 4 }}
            content={<ChartTooltipContent />}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
