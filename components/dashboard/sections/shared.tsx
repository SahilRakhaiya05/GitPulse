"use client";

import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function SectionLoader() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

export function SectionError({ message }: { message: string }) {
  return (
    <Card className="border-red-500/30 bg-red-500/5">
      <CardContent className="flex items-center gap-3 p-4 text-sm text-red-600 dark:text-red-400">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        {message}
      </CardContent>
    </Card>
  );
}

export function StatBar({ stats }: {
  stats: Array<{ label: string; value: number | string; color: string; icon?: ReactNode }>
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="flex items-center gap-3 p-4">
            {s.icon ? <span className={cn("shrink-0", s.color)}>{s.icon}</span> : null}
            <div>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
              <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function EmptyState({ message = "No data available" }: { message?: string }) {
  return (
    <p className="py-12 text-center text-sm text-muted-foreground">{message}</p>
  );
}
