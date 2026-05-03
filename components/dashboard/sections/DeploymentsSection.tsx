"use client";

import { CheckCircle2, Clock, GitBranch, Rocket, XCircle, Zap } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSectionData } from "@/hooks/useSectionData";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/section-utils";
import { SectionError, SectionLoader, StatBar } from "./shared";

interface GHDeployment {
  id: number;
  sha: string;
  ref: string;
  task: string;
  environment: string;
  creator: { login: string; avatar_url: string };
  created_at: string;
  updated_at: string;
  description: string | null;
}

interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  head_branch: string;
  head_sha: string;
  run_number: number;
  created_at: string;
  updated_at: string;
  html_url: string;
  actor: { login: string; avatar_url: string };
}

interface DeployData {
  deployments: GHDeployment[];
  runs: WorkflowRun[];
}

export function DeploymentsSection({ owner, repo }: { owner: string; repo: string }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
  const tt = {
    background: isDark ? "#0d1117" : "#fff",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.09)" : "#cbd5e1"}`,
    borderRadius: 8, color: isDark ? "#e2e8f0" : "#0f172a", fontSize: 11
  };

  const { data, isLoading, error } = useSectionData<DeployData>(owner, repo, "deployments");

  if (isLoading) return <SectionLoader />;
  if (error) return <SectionError message={(error as Error).message} />;

  const runs = data?.runs ?? [];
  const deployments = data?.deployments ?? [];
  const success = runs.filter((r) => r.conclusion === "success").length;
  const failed  = runs.filter((r) => r.conclusion === "failure").length;
  const inProg  = runs.filter((r) => r.status === "in_progress").length;

  const runsByDay = (() => {
    const counts: Record<string, { success: number; failure: number }> = {};
    for (const r of runs) {
      const day = r.created_at.slice(0, 10);
      if (!counts[day]) counts[day] = { success: 0, failure: 0 };
      if (r.conclusion === "success") counts[day].success++;
      else if (r.conclusion === "failure") counts[day].failure++;
    }
    return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date: new Date(date).toLocaleDateString("en", { month: "short", day: "numeric" }), ...v }));
  })();

  const axis = isDark ? "#475569" : "#64748b";
  const grid = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";

  return (
    <div className="space-y-3">
      <StatBar stats={[
        { label: "Total Runs", value: runs.length, color: "text-blue-500", icon: <Rocket className="h-4 w-4" /> },
        { label: "Successful", value: success, color: "text-emerald-500", icon: <CheckCircle2 className="h-4 w-4" /> },
        { label: "Failed", value: failed, color: "text-red-500", icon: <XCircle className="h-4 w-4" /> },
        { label: "In Progress", value: inProg, color: "text-amber-500", icon: <Zap className="h-4 w-4" /> },
      ]} />

      {runsByDay.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Workflow Run History</CardTitle></CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={runsByDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke={grid} vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: axis, fontSize: 10 }} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(runsByDay.length / 6) - 1)} />
                  <YAxis tick={{ fill: axis, fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tt} />
                  <Bar dataKey="success" name="Success" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={12} />
                  <Bar dataKey="failure" name="Failed" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow runs */}
      <Card>
        <CardHeader><CardTitle>Recent Workflow Runs</CardTitle></CardHeader>
        <CardContent className="p-0">
          {runs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No workflow runs found. GitHub Actions may not be configured.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">#</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Workflow</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Branch</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Triggered by</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Started</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {runs.map((run) => {
                    const ok = run.conclusion === "success";
                    const fail = run.conclusion === "failure";
                    const inP = run.status === "in_progress";
                    return (
                      <tr key={run.id} className="transition-colors hover:bg-muted/30">
                        <td className="px-4 py-2.5">
                          <a href={run.html_url} target="_blank" rel="noreferrer"
                            className="font-mono font-bold text-sky-500 hover:underline">#{run.run_number}</a>
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-foreground">{run.name}</td>
                        <td className="px-4 py-2.5">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <GitBranch className="h-3 w-3" />{run.head_branch}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <img src={run.actor.avatar_url} alt={run.actor.login} width={18} height={18} className="rounded-full ring-1 ring-border" />
                            <span className="text-muted-foreground">{run.actor.login}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                            ok   ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                            fail ? "bg-red-500/10 text-red-500" :
                            inP  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                                   "bg-muted text-muted-foreground"
                          )}>
                            {ok ? <CheckCircle2 className="h-3 w-3" /> : fail ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                            {run.conclusion ?? run.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{timeAgo(run.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Environments */}
      {deployments.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Deployment Environments</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Environment</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Ref</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Creator</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Deployed</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {deployments.map((d) => (
                    <tr key={d.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 font-semibold text-foreground">
                          <Rocket className="h-3 w-3 text-muted-foreground" />{d.environment}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sky-500">{d.ref}</code>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <img src={d.creator.avatar_url} alt={d.creator.login} width={18} height={18} className="rounded-full ring-1 ring-border" />
                          <span className="text-muted-foreground">{d.creator.login}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{timeAgo(d.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
