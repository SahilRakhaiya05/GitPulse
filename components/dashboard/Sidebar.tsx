"use client";

import {
  Activity,
  Box,
  Code2,
  GitBranch,
  GitCommitHorizontal,
  GitPullRequest,
  Github,
  LayoutDashboard,
  Package,
  Rocket,
  Shield,
  Tag,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type SectionKey =
  | "overview" | "activity" | "pulls" | "issues" | "code"
  | "commits" | "branches" | "releases" | "security" | "deployments" | "packages";

const navItems: Array<{ label: string; icon: React.ElementType; section: SectionKey; count?: string }> = [
  { label: "Overview",      icon: LayoutDashboard,     section: "overview" },
  { label: "Activity",      icon: Activity,            section: "activity" },
  { label: "Pull Requests", icon: GitPullRequest,       section: "pulls" },
  { label: "Issues",        icon: XCircle,             section: "issues" },
  { label: "Code",          icon: Code2,               section: "code" },
  { label: "Commits",       icon: GitCommitHorizontal, section: "commits" },
  { label: "Branches",      icon: GitBranch,           section: "branches" },
  { label: "Releases",      icon: Tag,                 section: "releases" },
  { label: "Security",      icon: Shield,              section: "security" },
  { label: "Deployments",   icon: Rocket,              section: "deployments" },
  { label: "Packages",      icon: Package,             section: "packages" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  repoSlug: string;
  activeSection: SectionKey;
  onSectionChange: (section: SectionKey) => void;
  counts?: Partial<Record<SectionKey, string | number>>;
}

export function Sidebar({ collapsed, onToggle, repoSlug, activeSection, onSectionChange, counts }: SidebarProps) {
  const [owner, name] = repoSlug.split("/");

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden flex-col border-r bg-background/95 backdrop-blur xl:flex",
        collapsed ? "w-20" : "w-72"
      )}
    >
      {/* Logo / brand */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
        <Github className="h-6 w-6 shrink-0 text-foreground" />
        {!collapsed && <span className="text-sm font-bold text-foreground">GitHub Enterprise</span>}
        <Button className="ml-auto shrink-0" variant="ghost" size="icon" onClick={onToggle} aria-label="Toggle sidebar">
          <Box className="h-4 w-4" />
        </Button>
      </div>

      {/* Repo info */}
      <div className="shrink-0 border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Github className="h-5 w-5 text-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-bold text-foreground">{owner} / {name}</p>
                <Badge className="shrink-0 text-[10px]">Public</Badge>
              </div>
              <p className="truncate text-xs text-muted-foreground">github.com/{repoSlug}</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.section;
            const count = counts?.[item.section];
            return (
              <button
                key={item.section}
                onClick={() => onSectionChange(item.section)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-primary/10 font-semibold text-primary dark:bg-primary/15"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  collapsed && "justify-center"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {count != null && (
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {count}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="shrink-0 space-y-2 border-t p-4 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Data freshness</span>
            <span className="font-semibold text-emerald-500">Live</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-1.5 w-11/12 rounded-full bg-emerald-500" />
          </div>
        </div>
      )}
    </aside>
  );
}
