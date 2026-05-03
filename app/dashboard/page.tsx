"use client";

import { useMemo, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { useTheme } from "next-themes";
import {
  AlertTriangle, CheckCircle2, GitCommitHorizontal,
  GitMerge, GitPullRequest, RadioTower, RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { Navbar } from "@/components/dashboard/Navbar";
import { Sidebar, type SectionKey } from "@/components/dashboard/Sidebar";
import { StatCard } from "@/components/dashboard/StatCard";
import { DataTable, TableCard, Td } from "@/components/dashboard/TableCard";
import { useGithubData } from "@/hooks/useGithubData";
import { cn, formatNumber } from "@/lib/utils";
import type { ActivityItem, CoveragePackage } from "@/types/github";

// Section components
import { PullRequestsSection } from "@/components/dashboard/sections/PullRequestsSection";
import { IssuesSection }       from "@/components/dashboard/sections/IssuesSection";
import { CommitsSection }      from "@/components/dashboard/sections/CommitsSection";
import { BranchesSection }     from "@/components/dashboard/sections/BranchesSection";
import { ReleasesSection }     from "@/components/dashboard/sections/ReleasesSection";
import { ActivitySection }     from "@/components/dashboard/sections/ActivitySection";
import { CodeSection }         from "@/components/dashboard/sections/CodeSection";
import { SecuritySection }     from "@/components/dashboard/sections/SecuritySection";
import { DeploymentsSection }  from "@/components/dashboard/sections/DeploymentsSection";
import { PackagesSection }     from "@/components/dashboard/sections/PackagesSection";

/* ─── Helpers ───────────────────────────────────────────────────── */

function LoadingGrid() {
  return (
    <div className="grid grid-cols-12 gap-2.5">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="col-span-6 h-20 sm:col-span-4 lg:col-span-3 2xl:col-span-2" />
      ))}
      {Array.from({ length: 9 }).map((_, i) => (
        <Skeleton key={`p-${i}`} className="col-span-12 h-64 lg:col-span-4" />
      ))}
    </div>
  );
}

function ActivityIcon({ type }: { type: ActivityItem["type"] }) {
  if (type === "pr")      return <GitPullRequest className="h-3 w-3 text-fuchsia-500" />;
  if (type === "issue")   return <AlertTriangle className="h-3 w-3 text-red-500" />;
  if (type === "release") return <RadioTower className="h-3 w-3 text-emerald-500" />;
  return <GitCommitHorizontal className="h-3 w-3 text-sky-500" />;
}

function Avatar({ login, size = 24 }: { login: string; size?: number }) {
  return (
    <img
      src={`https://github.com/${login}.png?size=${size * 2}`}
      alt={login}
      width={size}
      height={size}
      className="shrink-0 rounded-full ring-1 ring-border"
      onError={(e) => {
        (e.target as HTMLImageElement).src =
          `https://ui-avatars.com/api/?name=${encodeURIComponent(login)}&size=${size * 2}&background=6366f1&color=fff&bold=true&format=svg`;
      }}
    />
  );
}

const LABEL_COLORS: Record<string, string> = {
  bug: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-400/30",
  "feature-request": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-400/30",
  question: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-400/30",
  enhancement: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-400/30",
  documentation: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-400/30",
};

function IssueLabel({ label }: { label: string }) {
  const cls = LABEL_COLORS[label] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span className={cn("inline-flex max-w-[120px] items-center truncate rounded-full border px-2 py-0.5 text-[10px] font-semibold", cls)}>
      {label}
    </span>
  );
}

function MetricPanel({ title, items, className }: {
  title: string;
  items: Array<{ metric: string; score: string | number; delta: string }>;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2.5 pt-3">
        {items.map((item) => {
          const pos = item.delta.startsWith("+");
          const neg = item.delta.startsWith("-");
          return (
            <div key={item.metric} className="flex items-center justify-between gap-2 border-b pb-2.5 last:border-0 last:pb-0">
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">{item.metric}</p>
                <p className="mt-0.5 text-sm font-bold text-foreground">{item.score}</p>
              </div>
              <span className={cn("shrink-0 text-[11px] font-semibold", pos ? "text-emerald-500" : neg ? "text-red-500" : "text-muted-foreground")}>
                {(pos || neg) ? <CheckCircle2 className="mr-0.5 inline h-3 w-3" /> : null}
                {item.delta}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/* ─── Section titles ─────────────────────────────────────────────── */
const SECTION_TITLES: Record<SectionKey, string> = {
  overview:    "GitHub Enterprise Overview",
  activity:    "Repository Activity",
  pulls:       "Pull Requests",
  issues:      "Issues",
  code:        "Code & Languages",
  commits:     "Commit History",
  branches:    "Branches",
  releases:    "Releases",
  security:    "Security Overview",
  deployments: "Deployments & CI/CD",
  packages:    "Packages",
};

/* ─── Overview grid ─────────────────────────────────────────────── */
function OverviewSection({ owner, repo, data, isDark, tt, grid, axis, issueChart, mergedPRs }: {
  owner: string; repo: string;
  data: ReturnType<typeof useGithubData>["data"];
  isDark: boolean;
  tt: object; grid: string; axis: string;
  issueChart: Array<{ name: string; open: number }>;
  mergedPRs: number | undefined;
}) {
  if (!data) return null;
  return (
    <div className="grid grid-cols-12 gap-2.5">
      {/* Stat cards */}
      {data.stats.map((stat, i) => (
        <div key={stat.label} className="col-span-6 flex sm:col-span-4 lg:col-span-3 2xl:col-span-2">
          <StatCard stat={stat} index={i} />
        </div>
      ))}

      {/* Commits Over Time */}
      <ChartCard title="Commits Over Time" meta="30D" className="col-span-12 xl:col-span-5">
        <div className="h-48 min-h-0 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.commitsOverTime} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.30} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2f81f7" stopOpacity={0.20} />
                  <stop offset="95%" stopColor="#2f81f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={grid} vertical={false} />
              <XAxis dataKey="date" tick={{ fill: axis, fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fill: axis, fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tt} />
              <Area type="monotone" dataKey="value"     name="Commits" stroke="#22c55e" fill="url(#g1)" strokeWidth={2}   dot={false} />
              <Area type="monotone" dataKey="secondary" name="Authors" stroke="#2f81f7" fill="url(#g2)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />Commits</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-blue-500" />Authors</span>
        </div>
      </ChartCard>

      {/* PR Summary */}
      <ChartCard title="Pull Request Summary" className="col-span-12 sm:col-span-6 xl:col-span-3">
        <div className="flex h-44 min-h-0 items-center gap-2 overflow-hidden">
          <ResponsiveContainer width="46%" height="100%">
            <PieChart>
              <Pie data={data.pullRequests} dataKey="value" innerRadius={46} outerRadius={70} paddingAngle={2}>
                {data.pullRequests.map((e) => <Cell key={e.name} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={tt} />
            </PieChart>
          </ResponsiveContainer>
          <div className="min-w-0 flex-1 space-y-1.5 text-[11px]">
            {data.pullRequests.map((s) => (
              <div key={s.name} className="flex items-center justify-between gap-1.5">
                <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
                  <span className="truncate">{s.name}</span>
                </span>
                <span className="shrink-0 font-bold text-foreground">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-2 border-t pt-2.5">
          <div className="rounded-lg bg-muted/60 p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Avg. merge time</p>
            <p className="mt-0.5 text-xs font-bold text-foreground">{data.dora[1].value}</p>
          </div>
          <div className="rounded-lg bg-muted/60 p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Merged (30d)</p>
            <p className="mt-0.5 text-xs font-bold text-foreground">{mergedPRs ?? data.dora[0].value}</p>
          </div>
        </div>
      </ChartCard>

      {/* Issues Overview */}
      <Card className="col-span-12 sm:col-span-6 xl:col-span-4">
        <CardHeader>
          <CardTitle>Issues Overview</CardTitle>
          <span className="text-[11px] text-muted-foreground">{data.stats.find((s) => s.label === "Open Issues")?.value} open</span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">Label</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">Open</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">Δ 7D</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">Bar</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.issues.map((issue) => {
                  const max = Math.max(...data.issues.map((x) => x.open));
                  return (
                    <tr key={issue.label} className="transition-colors hover:bg-muted/30">
                      <td className="px-3 py-2"><IssueLabel label={issue.label} /></td>
                      <td className="px-3 py-2 text-right font-bold tabular-nums text-foreground">{issue.open}</td>
                      <td className={cn("px-3 py-2 text-right font-semibold tabular-nums", issue.trend > 0 ? "text-red-500" : "text-emerald-500")}>
                        {issue.trend > 0 ? "+" : ""}{issue.trend}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end">
                          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
                            <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${(issue.open / max) * 100}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Code Coverage */}
      <ChartCard title="Code Coverage Over Time" meta="30D" className="col-span-12 sm:col-span-6 xl:col-span-4">
        <div className="h-48 min-h-0 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.coverageOverTime} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={grid} vertical={false} />
              <XAxis dataKey="date" tick={{ fill: axis, fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
              <YAxis domain={[60, 95]} tick={{ fill: axis, fontSize: 10 }} tickLine={false} axisLine={false} unit="%" />
              <Tooltip contentStyle={tt} formatter={(v: number) => [`${v}%`, "Coverage"]} />
              <Line type="monotone" dataKey="value" stroke="#2f81f7" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Language Usage */}
      <ChartCard title="Language Usage" className="col-span-12 sm:col-span-6 xl:col-span-3">
        <div className="flex h-48 min-h-0 items-center gap-3 overflow-hidden">
          <ResponsiveContainer width="50%" height="100%">
            <PieChart>
              <Pie data={data.languages} dataKey="value" innerRadius={52} outerRadius={78} paddingAngle={2}>
                {data.languages.map((e) => <Cell key={e.name} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={tt} formatter={(v: number) => [`${v}%`, "Usage"]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-1.5 text-[11px]">
            {data.languages.map((lang) => (
              <div key={lang.name} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: lang.color }} />
                  {lang.name}
                </span>
                <span className="font-bold text-foreground">{lang.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </ChartCard>

      {/* Contributors */}
      <TableCard title="Contributors (30D)" className="col-span-12 xl:col-span-5">
        <DataTable headers={["Contributor", "Commits", "PRs", "+Lines", "-Lines"]}>
          {data.contributors.map((c) => (
            <tr key={c.login} className="transition-colors hover:bg-muted/30">
              <Td>
                <div className="flex items-center gap-2">
                  <Avatar login={c.login} size={24} />
                  <span className="font-semibold text-foreground">{c.login}</span>
                </div>
              </Td>
              <Td className="tabular-nums font-medium">{c.commits}</Td>
              <Td className="tabular-nums text-muted-foreground">{c.prs ?? "–"}</Td>
              <Td className="tabular-nums font-medium text-emerald-500">+{formatNumber(c.additions)}</Td>
              <Td className="tabular-nums font-medium text-red-500">-{formatNumber(c.deletions)}</Td>
            </tr>
          ))}
        </DataTable>
      </TableCard>

      {/* Issues bar chart */}
      <ChartCard title="Issues by Label" meta="Open" className="col-span-12 sm:col-span-5 xl:col-span-3">
        <div className="h-48 min-h-0 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={issueChart} layout="vertical" margin={{ left: 12, right: 8, top: 4, bottom: 4 }}>
              <CartesianGrid stroke={grid} horizontal={false} />
              <XAxis type="number" tick={{ fill: axis, fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: axis, fontSize: 10 }} tickLine={false} axisLine={false} width={80} />
              <Tooltip contentStyle={tt} />
              <Bar dataKey="open" fill="#2f81f7" radius={[0, 4, 4, 0]} maxBarSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Recent Commits */}
      <TableCard title="Recent Commits" className="col-span-12 sm:col-span-7 xl:col-span-5">
        <DataTable headers={["SHA", "Author", "Message", "When"]}>
          {data.recentCommits.map((c) => (
            <tr key={c.sha} className="transition-colors hover:bg-muted/30">
              <Td><code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono text-sky-500">{c.sha}</code></Td>
              <Td>
                <div className="flex items-center gap-1.5">
                  <Avatar login={c.author} size={18} />
                  <span className="text-[11px]">{c.author}</span>
                </div>
              </Td>
              <Td className="max-w-56 truncate text-foreground">{c.message}</Td>
              <Td className="tabular-nums text-[11px] text-muted-foreground">{c.time}</Td>
            </tr>
          ))}
        </DataTable>
      </TableCard>

      {/* Releases */}
      <TableCard title="Releases" className="col-span-12 sm:col-span-6 xl:col-span-4">
        <DataTable headers={["Version", "Published", "Status", "Downloads"]}>
          {data.releases.map((r, i) => (
            <tr key={r.version} className="transition-colors hover:bg-muted/30">
              <Td className="font-mono font-bold text-sky-500">{r.version}</Td>
              <Td className="text-[11px] text-muted-foreground">{r.published}</Td>
              <Td>
                <Badge className={i === 0 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : ""}>{r.status}</Badge>
              </Td>
              <Td className="tabular-nums text-muted-foreground">{r.downloads}</Td>
            </tr>
          ))}
        </DataTable>
      </TableCard>

      {/* CI/CD */}
      <TableCard title="CI / CD Pipeline" className="col-span-12 sm:col-span-6 xl:col-span-4">
        <DataTable headers={["Stage", "Status", "Duration", "Success"]}>
          {data.pipeline.map((stage) => {
            const ok = stage.status === "Passed";
            const fail = stage.status === "Failed";
            return (
              <tr key={stage.stage} className="transition-colors hover:bg-muted/30">
                <Td className="font-semibold text-foreground">{stage.stage}</Td>
                <Td>
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    ok ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : fail ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  )}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", ok ? "bg-emerald-500" : fail ? "bg-red-500" : "bg-amber-500")} />
                    {stage.status}
                  </span>
                </Td>
                <Td className="tabular-nums text-[11px] text-muted-foreground">{stage.duration}</Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    <span className="w-8 text-right tabular-nums text-[11px] font-semibold text-foreground">{stage.successRate}%</span>
                    <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
                      <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${stage.successRate}%` }} />
                    </div>
                  </div>
                </Td>
              </tr>
            );
          })}
        </DataTable>
      </TableCard>

      {/* Coverage by Package */}
      <Card className="col-span-12 sm:col-span-6 xl:col-span-4">
        <CardHeader>
          <CardTitle>Coverage by Package</CardTitle>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">30D avg</span>
        </CardHeader>
        <CardContent className="space-y-3.5 pt-3">
          {(data.coveragePackages ?? []).map((pkg: CoveragePackage) => {
            const col = pkg.coverage >= 80 ? "bg-emerald-500" : pkg.coverage >= 70 ? "bg-amber-500" : "bg-red-500";
            return (
              <div key={pkg.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">{pkg.name}</span>
                  <span className="flex items-center gap-1.5">
                    <span className="font-bold text-foreground">{pkg.coverage}%</span>
                    <span className={cn("text-[10px] font-semibold", pkg.delta.startsWith("+") ? "text-emerald-500" : "text-red-500")}>{pkg.delta}</span>
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-1.5 rounded-full transition-all", col)} style={{ width: `${pkg.coverage}%` }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Dep Alerts */}
      <Card className="col-span-12 sm:col-span-6 xl:col-span-2">
        <CardHeader><CardTitle>Dep. Alerts</CardTitle></CardHeader>
        <CardContent className="space-y-3 pt-3">
          {data.dependencyAlerts.map((a) => {
            const dot = a.metric === "Critical" ? "bg-red-500" : a.metric === "High" ? "bg-orange-500" : a.metric === "Moderate" ? "bg-amber-500" : "bg-slate-400";
            const dc  = a.delta.startsWith("+") ? "text-red-500" : a.delta === "-" ? "text-muted-foreground" : "text-emerald-500";
            return (
              <div key={a.metric} className="flex items-center justify-between border-b pb-2.5 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", dot)} />
                  <span className="text-xs text-muted-foreground">{a.metric}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-foreground">{a.score}</span>
                  <span className={cn("text-[10px] font-semibold", dc)}>{a.delta}</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <MetricPanel title="Dep. Updates"  items={data.dependencyUpdates} className="col-span-12 sm:col-span-6 xl:col-span-2" />

      {/* Activity Feed */}
      <Card className="col-span-12 xl:col-span-4">
        <CardHeader><CardTitle>Activity Feed</CardTitle></CardHeader>
        <CardContent className="space-y-3 pt-3">
          {data.activity.map((item) => (
            <div key={`${item.title}-${item.time}`} className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted">
                <ActivityIcon type={item.type} />
              </div>
              {item.actor ? <Avatar login={item.actor} size={20} /> : null}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">{item.title}</p>
                <p className="truncate text-[11px] text-muted-foreground">{item.meta}</p>
              </div>
              <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">{item.time}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <MetricPanel title="Repository Health Score" items={data.health}     className="col-span-12 sm:col-span-6 xl:col-span-4" />
      <MetricPanel title="DORA Metrics (30D)" items={data.dora.map((d) => ({ metric: d.metric, score: d.value, delta: d.delta }))} className="col-span-12 sm:col-span-6 xl:col-span-4" />
      <MetricPanel title="Deployments"       items={data.deployments}     className="col-span-12 sm:col-span-6 xl:col-span-4" />
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  const tt = {
    background: isDark ? "#0d1117" : "#fff",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.09)" : "#cbd5e1"}`,
    borderRadius: 8, color: isDark ? "#e2e8f0" : "#0f172a", fontSize: 11,
    boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.55)" : "0 4px 20px rgba(0,0,0,0.10)"
  };
  const grid = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";
  const axis = isDark ? "#475569" : "#64748b";

  const [collapsed, setCollapsed] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [repoSlug, setRepoSlug] = useState(() => {
    if (typeof window === "undefined") return "microsoft/vscode";
    const p = new URLSearchParams(window.location.search).get("repo");
    return p && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(p) ? p : "microsoft/vscode";
  });

  const [activeSection, setActiveSection] = useState<SectionKey>(() => {
    if (typeof window === "undefined") return "overview";
    return (new URLSearchParams(window.location.search).get("section") as SectionKey) ?? "overview";
  });

  const [repoInputError, setRepoInputError] = useState<string | null>(null);
  const [owner, repo] = repoSlug.split("/");
  const { data, isLoading, error, refetch, isFetching } = useGithubData({ owner, repo, autoRefresh });

  const issueChart = useMemo(() => data?.issues.map((i) => ({ name: i.label, open: i.open })) ?? [], [data?.issues]);
  const mergedPRs  = data?.pullRequests.find((p) => p.name === "Merged / Closed")?.value;

  function handleRepoChange(next: string) {
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(next)) {
      setRepoInputError("Enter a repository like owner/repo.");
      return;
    }
    setRepoInputError(null);
    setRepoSlug(next);
    pushUrl(next, activeSection);
  }

  function handleSectionChange(section: SectionKey) {
    setActiveSection(section);
    pushUrl(repoSlug, section);
  }

  function pushUrl(slug: string, section: SectionKey) {
    const url = new URL(window.location.href);
    url.searchParams.set("repo", slug);
    url.searchParams.set("section", section);
    window.history.pushState(null, "", url.toString());
  }

  const srcLabel = data?.source === "github-graphql" ? "GitHub GraphQL" : data?.source === "github-rest" ? "GitHub REST" : "Demo fallback";
  const srcCls = data?.source === "github-graphql"
    ? "border-emerald-500/30 bg-emerald-500/8 text-emerald-600 dark:text-emerald-400"
    : "border-amber-500/30 bg-amber-500/8 text-amber-600 dark:text-amber-400";

  // Pass counts to sidebar from overview data
  const sidebarCounts: Partial<Record<SectionKey, string | number>> = {
    pulls:  data?.stats.find((s) => s.label === "Open PRs")?.value ?? "",
    issues: data?.stats.find((s) => s.label === "Open Issues")?.value ?? "",
    releases: data?.releases.length ?? "",
  };

  return (
    <div className="enterprise-grid min-h-screen bg-background text-foreground">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        repoSlug={repoSlug}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        counts={sidebarCounts}
      />

      <main className={cn("min-h-screen transition-[padding] duration-200", collapsed ? "xl:pl-20" : "xl:pl-72")}>
        <Navbar repoSlug={repoSlug} autoRefresh={autoRefresh} onAutoRefreshChange={setAutoRefresh} onRepoChange={handleRepoChange} />

        <div className="px-3 py-3 xl:px-4 xl:py-4">
          {/* Header */}
          <div className="mb-3 flex flex-wrap items-start gap-2">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">{SECTION_TITLES[activeSection]}</h1>
              <p className="text-xs text-muted-foreground">
                {data?.repo.url ?? `https://github.com/${repoSlug}`} · {data?.repo.visibility ?? "Public"} · {data?.repo.defaultBranch ?? "main"}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Badge className={srcCls}>{srcLabel}</Badge>
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={cn("h-3 w-3", isFetching && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Error banners */}
          {error ? (
            <Card className="mb-3 border-red-500/30 bg-red-500/5">
              <CardContent className="flex items-center gap-3 p-3 text-sm text-red-600 dark:text-red-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />{(error as Error).message}
              </CardContent>
            </Card>
          ) : null}
          {repoInputError ? (
            <Card className="mb-3 border-amber-500/30 bg-amber-500/5">
              <CardContent className="flex items-center gap-3 p-3 text-sm text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />{repoInputError}
              </CardContent>
            </Card>
          ) : null}

          {/* Section content */}
          {activeSection === "overview" ? (
            isLoading || !data ? <LoadingGrid /> : (
              <OverviewSection
                owner={owner} repo={repo} data={data}
                isDark={isDark} tt={tt} grid={grid} axis={axis}
                issueChart={issueChart} mergedPRs={mergedPRs}
              />
            )
          ) : activeSection === "pulls"       ? <PullRequestsSection owner={owner} repo={repo} />
          : activeSection === "issues"        ? <IssuesSection       owner={owner} repo={repo} />
          : activeSection === "commits"       ? <CommitsSection      owner={owner} repo={repo} />
          : activeSection === "branches"      ? <BranchesSection     owner={owner} repo={repo} />
          : activeSection === "releases"      ? <ReleasesSection     owner={owner} repo={repo} />
          : activeSection === "activity"      ? <ActivitySection     owner={owner} repo={repo} />
          : activeSection === "code"          ? <CodeSection         owner={owner} repo={repo} />
          : activeSection === "security"      ? <SecuritySection     owner={owner} repo={repo} />
          : activeSection === "deployments"   ? <DeploymentsSection  owner={owner} repo={repo} />
          : activeSection === "packages"      ? <PackagesSection     owner={owner} repo={repo} />
          : null}

          <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-[11px] text-muted-foreground">
            <span>Data as of {data ? new Date(data.generatedAt).toLocaleString() : "loading…"}</span>
            <div className="flex items-center gap-1.5">
              <GitMerge className="h-3 w-3" />
              <span>{repoSlug} · {Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
