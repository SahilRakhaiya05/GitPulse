"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useTheme } from "next-themes";
import { Code2, Database, FileCode2, Globe, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSectionData } from "@/hooks/useSectionData";
import { timeAgo } from "@/lib/section-utils";
import { SectionError, SectionLoader, StatBar } from "./shared";

interface CodeData {
  languages: Record<string, number>;
  topics: string[];
  meta: {
    size: number;
    stargazers_count: number;
    forks_count: number;
    open_issues_count: number;
    default_branch: string;
    license: { name: string } | null;
    created_at: string;
    pushed_at: string;
    description: string | null;
    subscribers_count?: number;
    network_count?: number;
  };
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#2f81f7", JavaScript: "#f2cc60", Python: "#3572A5",
  Go: "#00ADD8", Rust: "#dea584", Java: "#b07219", "C#": "#178600",
  "C++": "#f34b7d", C: "#555555", Ruby: "#701516", PHP: "#4F5D95",
  Swift: "#F05138", Kotlin: "#A97BFF", Shell: "#89e051",
  HTML: "#e34c26", CSS: "#563d7c", Dart: "#00B4AB",
  Vue: "#41b883", Svelte: "#ff3e00", Scala: "#c22d40",
};

function formatSize(kb: number): string {
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function CodeSection({ owner, repo }: { owner: string; repo: string }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
  const tt = {
    background: isDark ? "#0d1117" : "#fff",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.09)" : "#cbd5e1"}`,
    borderRadius: 8, color: isDark ? "#e2e8f0" : "#0f172a", fontSize: 11
  };

  const { data, isLoading, error } = useSectionData<CodeData>(owner, repo, "code");

  if (isLoading) return <SectionLoader />;
  if (error) return <SectionError message={(error as Error).message} />;

  const meta = data?.meta;
  const langs = data?.languages ?? {};
  const totalBytes = Object.values(langs).reduce((s, v) => s + v, 0);
  const langList = Object.entries(langs)
    .sort(([, a], [, b]) => b - a)
    .map(([name, bytes], i) => ({
      name,
      bytes,
      pct: ((bytes / Math.max(totalBytes, 1)) * 100).toFixed(1),
      color: LANG_COLORS[name] ?? ["#8957e5","#e879f9","#0ea5e9","#f97316","#84cc16"][i % 5]
    }));

  return (
    <div className="space-y-3">
      <StatBar stats={[
        { label: "Repository Size", value: formatSize(meta?.size ?? 0), color: "text-blue-500", icon: <Database className="h-4 w-4" /> },
        { label: "Languages", value: langList.length, color: "text-emerald-500", icon: <Code2 className="h-4 w-4" /> },
        { label: "Topics", value: data?.topics.length ?? 0, color: "text-purple-500", icon: <Tag className="h-4 w-4" /> },
        { label: "License", value: meta?.license?.name ?? "None", color: "text-muted-foreground", icon: <FileCode2 className="h-4 w-4" /> },
      ]} />

      <div className="grid grid-cols-12 gap-2.5">
        {/* Language pie */}
        <Card className="col-span-12 md:col-span-5">
          <CardHeader><CardTitle>Language Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-48 w-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={langList} dataKey="bytes" innerRadius={56} outerRadius={88} paddingAngle={2}>
                      {langList.map((l) => <Cell key={l.name} fill={l.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tt} formatter={(v: number) => [formatSize(v), "Size"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {langList.map((l) => (
                  <div key={l.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-semibold text-foreground">
                        <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                        {l.name}
                      </span>
                      <span className="tabular-nums text-muted-foreground">{l.pct}%</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-1 rounded-full" style={{ width: `${l.pct}%`, background: l.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Repo info */}
        <Card className="col-span-12 md:col-span-7">
          <CardHeader><CardTitle>Repository Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {meta?.description && (
              <p className="text-sm text-muted-foreground">{meta.description}</p>
            )}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { label: "Default Branch", value: meta?.default_branch ?? "–" },
                { label: "License", value: meta?.license?.name ?? "None" },
                { label: "Stars", value: (meta?.stargazers_count ?? 0).toLocaleString() },
                { label: "Forks", value: (meta?.forks_count ?? 0).toLocaleString() },
                { label: "Watchers", value: (meta?.subscribers_count ?? 0).toLocaleString() },
                { label: "Open Issues", value: (meta?.open_issues_count ?? 0).toLocaleString() },
                { label: "Created", value: timeAgo(meta?.created_at) },
                { label: "Last Push", value: timeAgo(meta?.pushed_at) },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg border bg-muted/40 p-3">
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className="mt-0.5 font-bold text-foreground">{value}</p>
                </div>
              ))}
            </div>
            {data?.topics && data.topics.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-semibold text-muted-foreground">Topics</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.topics.map((t) => (
                    <span key={t} className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Language bytes table */}
        <Card className="col-span-12">
          <CardHeader><CardTitle>Language Details</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Language</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Size</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Share</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {langList.map((l) => (
                  <tr key={l.name} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-2 font-semibold text-foreground">
                        <span className="h-3 w-3 rounded-full" style={{ background: l.color }} />
                        {l.name}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{formatSize(Math.round(l.bytes / 1024))}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-bold text-foreground">{l.pct}%</td>
                    <td className="px-4 py-2.5">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-1.5 rounded-full" style={{ width: `${l.pct}%`, background: l.color }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
