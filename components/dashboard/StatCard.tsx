"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCompact } from "@/lib/utils";
import type { StatMetric } from "@/types/github";

export function StatCard({ stat, index }: { stat: StatMetric; index: number }) {
  const positive = stat.trend.direction === "up";
  const flat = stat.trend.direction === "flat";
  const Icon = flat ? Minus : positive ? ArrowUpRight : ArrowDownRight;
  const chartData = stat.sparkline.map((value, itemIndex) => ({ itemIndex, value }));

  return (
    <Card className="animate-fade-up h-full w-full overflow-hidden" style={{ animationDelay: `${index * 35}ms` }}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{stat.label}</p>
            <div className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">{formatCompact(stat.value)}</div>
          </div>
          <div className="h-10 w-20 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={flat ? "#64748b" : positive ? "#22c55e" : "#ef4444"}
                  strokeWidth={1.8}
                  dot={false}
                  isAnimationActive
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className={cn("mt-3 flex items-center gap-1 text-xs font-medium", flat ? "text-muted-foreground" : positive ? "text-emerald-500" : "text-red-500")}>
          <Icon className="h-3.5 w-3.5" />
          <span>{stat.trend.value}</span>
        </div>
      </CardContent>
    </Card>
  );
}
