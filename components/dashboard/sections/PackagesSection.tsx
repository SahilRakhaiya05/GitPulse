"use client";

import { Box, Download, Info, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionLoader, StatBar } from "./shared";
import { useSectionData } from "@/hooks/useSectionData";

export function PackagesSection({ owner, repo }: { owner: string; repo: string }) {
  const { isLoading } = useSectionData(owner, repo, "packages");

  if (isLoading) return <SectionLoader />;

  return (
    <div className="space-y-3">
      <StatBar stats={[
        { label: "Packages", value: "–", color: "text-blue-500", icon: <Package className="h-4 w-4" /> },
        { label: "Total Downloads", value: "–", color: "text-emerald-500", icon: <Download className="h-4 w-4" /> },
        { label: "Container Images", value: "–", color: "text-purple-500", icon: <Box className="h-4 w-4" /> },
        { label: "npm Packages", value: "–", color: "text-red-500", icon: <Package className="h-4 w-4" /> },
      ]} />

      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="flex items-start gap-3 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
          <div>
            <p className="text-sm font-semibold text-foreground">GitHub Packages API requires organization-level access</p>
            <p className="mt-1 text-xs text-muted-foreground">
              To view packages, your token needs <code className="rounded bg-muted px-1">read:packages</code> scope and the repository must publish packages.
              Visit <a href={`https://github.com/${owner}/${repo}/packages`} target="_blank" rel="noreferrer"
                className="text-blue-500 underline">github.com/{owner}/{repo}/packages</a> to see published packages.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Common Package Ecosystems</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { name: "npm", icon: "📦", color: "bg-red-500/10 text-red-600 dark:text-red-400" },
              { name: "Docker / OCI", icon: "🐳", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
              { name: "Maven", icon: "☕", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
              { name: "NuGet", icon: "🔷", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
              { name: "PyPI", icon: "🐍", color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" },
              { name: "RubyGems", icon: "💎", color: "bg-red-500/10 text-red-600 dark:text-red-400" },
              { name: "Cargo", icon: "⚙️", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
              { name: "Go Modules", icon: "🐹", color: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
            ].map(({ name, icon, color }) => (
              <div key={name} className={`flex items-center gap-2 rounded-lg border p-3 ${color.split(" ")[0]}`}>
                <span className="text-lg">{icon}</span>
                <span className={`text-xs font-semibold ${color.split(" ").slice(1).join(" ")}`}>{name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
