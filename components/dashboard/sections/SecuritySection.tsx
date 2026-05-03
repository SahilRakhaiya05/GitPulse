"use client";

import { AlertTriangle, CheckCircle2, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSectionData } from "@/hooks/useSectionData";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/section-utils";
import { SectionError, SectionLoader, StatBar } from "./shared";

interface DependabotAlert {
  number: number;
  state: string;
  created_at: string;
  updated_at: string;
  security_advisory: {
    summary: string;
    severity: "critical" | "high" | "medium" | "low";
    cvss: { score: number };
    cve_id: string | null;
    identifiers: Array<{ type: string; value: string }>;
  };
  security_vulnerability: {
    package: { name: string; ecosystem: string };
    vulnerable_version_range: string;
    first_patched_version: { identifier: string } | null;
  };
  html_url: string;
}

interface SecurityData {
  alerts: DependabotAlert[];
  advisories: unknown[];
}

const SEV_CONFIG = {
  critical: { cls: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-400/30", dot: "bg-red-500", badge: "text-red-600 dark:text-red-400" },
  high:     { cls: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-400/30", dot: "bg-orange-500", badge: "text-orange-600 dark:text-orange-400" },
  medium:   { cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-400/30", dot: "bg-amber-500", badge: "text-amber-600 dark:text-amber-400" },
  low:      { cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-400/30", dot: "bg-blue-500", badge: "text-blue-600 dark:text-blue-400" },
};

export function SecuritySection({ owner, repo }: { owner: string; repo: string }) {
  const { data, isLoading, error } = useSectionData<SecurityData>(owner, repo, "security");

  if (isLoading) return <SectionLoader />;

  // Security API often requires special auth — show helpful message if error
  const alerts = data?.alerts ?? [];
  const hasData = alerts.length > 0;

  const critical = alerts.filter((a) => a.security_advisory?.severity === "critical").length;
  const high     = alerts.filter((a) => a.security_advisory?.severity === "high").length;
  const medium   = alerts.filter((a) => a.security_advisory?.severity === "medium").length;
  const low      = alerts.filter((a) => a.security_advisory?.severity === "low").length;

  return (
    <div className="space-y-3">
      <StatBar stats={[
        { label: "Critical", value: critical, color: "text-red-500", icon: <ShieldAlert className="h-4 w-4" /> },
        { label: "High", value: high, color: "text-orange-500", icon: <ShieldAlert className="h-4 w-4" /> },
        { label: "Medium", value: medium, color: "text-amber-500", icon: <Shield className="h-4 w-4" /> },
        { label: "Low", value: low, color: "text-blue-500", icon: <ShieldCheck className="h-4 w-4" /> },
      ]} />

      {error && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div>
              <p className="font-semibold text-foreground">Security API requires elevated permissions</p>
              <p className="mt-1 text-xs text-muted-foreground">
                The Dependabot alerts API requires a GitHub token with <code className="rounded bg-muted px-1">security_events</code> scope and admin access. Demo data shown below.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dependency Vulnerabilities</CardTitle>
          {hasData && <span className="text-xs text-muted-foreground">{alerts.length} open alerts</span>}
        </CardHeader>
        <CardContent className="p-0">
          {!hasData ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <ShieldCheck className="h-10 w-10 text-emerald-500" />
              <div className="text-center">
                <p className="font-semibold text-foreground">No vulnerability alerts available</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Either no vulnerabilities were found or your token needs <code className="rounded bg-muted px-1">security_events</code> scope.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">#</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Package</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Severity</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Summary</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">CVE</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Fixed in</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Reported</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {alerts.map((alert) => {
                    const sev = alert.security_advisory?.severity ?? "low";
                    const cfg = SEV_CONFIG[sev] ?? SEV_CONFIG.low;
                    return (
                      <tr key={alert.number} className="transition-colors hover:bg-muted/30">
                        <td className="px-4 py-2.5">
                          <a href={alert.html_url} target="_blank" rel="noreferrer"
                            className="font-mono font-bold text-sky-500 hover:underline">#{alert.number}</a>
                        </td>
                        <td className="px-4 py-2.5">
                          <div>
                            <p className="font-bold text-foreground">{alert.security_vulnerability?.package.name}</p>
                            <p className="text-[10px] text-muted-foreground">{alert.security_vulnerability?.package.ecosystem}</p>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", cfg.cls)}>
                            <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                            {sev}
                          </span>
                        </td>
                        <td className="max-w-xs px-4 py-2.5">
                          <p className="line-clamp-2 text-muted-foreground">{alert.security_advisory?.summary}</p>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[10px] text-muted-foreground">
                          {alert.security_advisory?.cve_id ?? "–"}
                        </td>
                        <td className="px-4 py-2.5">
                          {alert.security_vulnerability?.first_patched_version ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              {alert.security_vulnerability.first_patched_version.identifier}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">–</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{timeAgo(alert.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
