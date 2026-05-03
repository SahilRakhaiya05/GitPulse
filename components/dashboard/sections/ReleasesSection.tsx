"use client";

import { Download, Package, Tag, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSectionData } from "@/hooks/useSectionData";
import { timeAgo } from "@/lib/section-utils";
import { SectionError, SectionLoader, StatBar } from "./shared";

interface GHAsset {
  name: string;
  download_count: number;
  size: number;
  browser_download_url: string;
  content_type: string;
}

interface GHRelease {
  id: number;
  tag_name: string;
  name: string | null;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  published_at: string | null;
  created_at: string;
  author: { login: string; avatar_url: string };
  assets: GHAsset[];
  html_url: string;
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export function ReleasesSection({ owner, repo }: { owner: string; repo: string }) {
  const { data, isLoading, error } = useSectionData<GHRelease[]>(owner, repo, "releases");

  if (isLoading) return <SectionLoader />;
  if (error) return <SectionError message={(error as Error).message} />;

  const releases = data ?? [];
  const totalDownloads = releases.flatMap((r) => r.assets).reduce((s, a) => s + a.download_count, 0);
  const preReleases = releases.filter((r) => r.prerelease).length;
  const stable = releases.filter((r) => !r.prerelease && !r.draft).length;

  return (
    <div className="space-y-3">
      <StatBar stats={[
        { label: "Total Releases", value: releases.length, color: "text-emerald-500", icon: <Tag className="h-4 w-4" /> },
        { label: "Stable", value: stable, color: "text-blue-500", icon: <Package className="h-4 w-4" /> },
        { label: "Pre-release", value: preReleases, color: "text-amber-500", icon: <Zap className="h-4 w-4" /> },
        { label: "Total Downloads", value: totalDownloads > 1000 ? `${(totalDownloads / 1000).toFixed(1)}K` : totalDownloads, color: "text-purple-500", icon: <Download className="h-4 w-4" /> },
      ]} />

      <div className="space-y-2.5">
        {releases.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No releases found</CardContent></Card>
        ) : releases.map((r, idx) => (
          <Card key={r.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
                <a href={r.html_url} target="_blank" rel="noreferrer"
                  className="font-mono text-sm font-bold text-sky-500 hover:underline">{r.tag_name}</a>
                {r.name && r.name !== r.tag_name && (
                  <span className="text-sm font-semibold text-foreground">{r.name}</span>
                )}
                <div className="flex gap-1">
                  {idx === 0 && !r.draft && !r.prerelease && (
                    <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Latest</Badge>
                  )}
                  {r.prerelease && <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">Pre-release</Badge>}
                  {r.draft && <Badge className="border-slate-400/30 bg-slate-400/10 text-muted-foreground">Draft</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <img src={r.author.avatar_url} alt={r.author.login} width={16} height={16} className="rounded-full" />
                <span>{r.author.login}</span>
                <span>·</span>
                <span>{timeAgo(r.published_at ?? r.created_at)}</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {r.body && (
                <p className="mb-3 line-clamp-3 text-xs text-muted-foreground">{r.body.replace(/#{1,6}\s/g, "").replace(/\r?\n/g, " ")}</p>
              )}
              {r.assets.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-muted-foreground">Assets ({r.assets.length})</p>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {r.assets.map((a) => (
                      <a key={a.name} href={a.browser_download_url} target="_blank" rel="noreferrer"
                        className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-xs transition-colors hover:bg-muted">
                        <div className="flex items-center gap-2 min-w-0">
                          <Download className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate font-medium text-foreground">{a.name}</span>
                        </div>
                        <div className="ml-2 flex shrink-0 items-center gap-2 text-muted-foreground">
                          <span>{formatBytes(a.size)}</span>
                          <span className="font-semibold text-foreground">{a.download_count.toLocaleString()}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
