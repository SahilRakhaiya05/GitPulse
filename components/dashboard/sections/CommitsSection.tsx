"use client";

import { useMemo } from "react";
import { GitCommitHorizontal, Shield, Users } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSectionData } from "@/hooks/useSectionData";
import { shortSha, timeAgo } from "@/lib/section-utils";
import { SectionError, SectionLoader, StatBar } from "./shared";

interface GHCommit {
  sha: string;
  commit: {
    message: string;
    author: { name: string; date: string; email: string };
    verification: { verified: boolean };
  };
  author?: { login: string; avatar_url: string } | null;
  html_url: string;
}

export function CommitsSection({ owner, repo }: { owner: string; repo: string }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
  const tt = {
    background: isDark ? "#0d1117" : "#fff",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.09)" : "#cbd5e1"}`,
    borderRadius: 8, color: isDark ? "#e2e8f0" : "#0f172a", fontSize: 11
  };

  const { data, isLoading, error } = useSectionData<GHCommit[]>(owner, repo, "commits");

  const dailyActivity = useMemo(() => {
    if (!data) return [];
    const counts: Record<string, number> = {};
    for (const c of data) {
      const day = c.commit.author.date.slice(0, 10);
      counts[day] = (counts[day] ?? 0) + 1;
    }
    return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)).map(([date, commits]) => ({
      date: new Date(date).toLocaleDateString("en", { month: "short", day: "numeric" }),
      commits
    }));
  }, [data]);

  if (isLoading) return <SectionLoader />;
  if (error) return <SectionError message={(error as Error).message} />;

  const verified = data?.filter((c) => c.commit.verification.verified).length ?? 0;
  const authors = new Set(data?.map((c) => c.author?.login ?? c.commit.author.name)).size;

  return (
    <div className="space-y-3">
      <StatBar stats={[
        { label: "Commits (90d)", value: data?.length ?? 0, color: "text-emerald-500", icon: <GitCommitHorizontal className="h-4 w-4" /> },
        { label: "Unique Authors", value: authors, color: "text-blue-500", icon: <Users className="h-4 w-4" /> },
        { label: "Verified", value: verified, color: "text-purple-500", icon: <Shield className="h-4 w-4" /> },
        { label: "Unverified", value: (data?.length ?? 0) - verified, color: "text-muted-foreground", icon: <Shield className="h-4 w-4" /> },
      ]} />

      {dailyActivity.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Commit Activity (90D)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyActivity} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)"} vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: isDark ? "#475569" : "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} interval={Math.floor(dailyActivity.length / 6)} />
                  <YAxis tick={{ fill: isDark ? "#475569" : "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tt} />
                  <Area type="monotone" dataKey="commits" stroke="#22c55e" fill="url(#cg)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Recent Commits</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">SHA</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Message</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Author</th>
                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Verified</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(data ?? []).map((c) => (
                  <tr key={c.sha} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-2.5">
                      <a href={c.html_url} target="_blank" rel="noreferrer"
                        className="font-mono font-bold text-sky-500 hover:underline">{shortSha(c.sha)}</a>
                    </td>
                    <td className="max-w-sm px-4 py-2.5">
                      <p className="line-clamp-1 font-semibold text-foreground">{c.commit.message.split("\n")[0]}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {c.author ? (
                          <img src={c.author.avatar_url} alt={c.author.login} width={20} height={20} className="rounded-full ring-1 ring-border" />
                        ) : null}
                        <span className="text-muted-foreground">{c.author?.login ?? c.commit.author.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {c.commit.verification.verified
                        ? <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">✓ Verified</span>
                        : <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">–</span>
                      }
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{timeAgo(c.commit.author.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
