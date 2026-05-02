import type { GithubDashboardData } from "@/types/github";

export const demoDashboardData: GithubDashboardData = {
  repo: {
    owner: "microsoft",
    name: "vscode",
    visibility: "Public",
    url: "https://github.com/microsoft/vscode",
    defaultBranch: "main"
  },
  stats: [
    { label: "Stars", value: 132497, trend: { value: "+1,247 (0.95%)", direction: "up" }, sparkline: [64, 68, 66, 71, 70, 74, 78] },
    { label: "Forks", value: 24632, trend: { value: "+311 (1.28%)", direction: "up" }, sparkline: [25, 26, 28, 27, 31, 33, 36] },
    { label: "Watchers", value: 7143, trend: { value: "+87 (1.23%)", direction: "up" }, sparkline: [19, 21, 21, 23, 22, 24, 26] },
    { label: "Open Issues", value: 512, trend: { value: "-8 (1.54%)", direction: "down" }, sparkline: [74, 72, 70, 69, 68, 66, 64] },
    { label: "Open PRs", value: 86, trend: { value: "+5 (6.17%)", direction: "up" }, sparkline: [18, 21, 19, 24, 25, 29, 31] },
    { label: "Commits (30d)", value: 2341, trend: { value: "+132 (5.98%)", direction: "up" }, sparkline: [50, 54, 58, 57, 62, 68, 73] },
    { label: "Contributors", value: 312, trend: { value: "+40 (14.71%)", direction: "up" }, sparkline: [20, 24, 29, 31, 37, 41, 48] },
    { label: "Code Coverage", value: "78.4%", trend: { value: "+2.1pp", direction: "up" }, sparkline: [66, 68, 70, 72, 71, 75, 78] },
    { label: "Build Status", value: "Passing", trend: { value: "100%", direction: "up" }, sparkline: [95, 95, 96, 97, 98, 98, 100] },
    { label: "Deployments", value: 27, trend: { value: "+5 (22.7%)", direction: "up" }, sparkline: [6, 9, 8, 11, 14, 19, 27] }
  ],
  commitsOverTime: Array.from({ length: 30 }, (_, index) => ({
    date: `Day ${index + 1}`,
    value: 72 + Math.round(Math.sin(index / 2) * 27 + (index % 7) * 8),
    secondary: 18 + Math.round(Math.cos(index / 3) * 8 + (index % 4) * 4)
  })),
  pullRequests: [
    { name: "Draft", value: 12, color: "#60a5fa" },
    { name: "Review", value: 28, color: "#22c55e" },
    { name: "Changes Requested", value: 18, color: "#eab308" },
    { name: "Approved", value: 24, color: "#f97316" },
    { name: "Other", value: 4, color: "#94a3b8" }
  ],
  issues: [
    { label: "bug", open: 184, trend: 12 },
    { label: "feature-request", open: 132, trend: 4 },
    { label: "question", open: 98, trend: 3 },
    { label: "enhancement", open: 76, trend: 7 },
    { label: "documentation", open: 22, trend: 1 }
  ],
  coverageOverTime: Array.from({ length: 30 }, (_, index) => ({
    date: `Day ${index + 1}`,
    value: Math.round((67 + index * 0.55 + Math.sin(index / 2) * 4) * 10) / 10
  })),
  languages: [
    { name: "TypeScript", value: 74.6, color: "#2f81f7" },
    { name: "JavaScript", value: 12.8, color: "#f2cc60" },
    { name: "CSS", value: 5.1, color: "#8957e5" },
    { name: "HTML", value: 2.6, color: "#f97316" },
    { name: "Other", value: 4.9, color: "#8b949e" }
  ],
  recentCommits: [
    { sha: "a1b2c3d", author: "mjbvz", message: "Fix: handle undefined in editor", time: "2m ago" },
    { sha: "d4e5f6g", author: "hediet", message: "Refactor: suggest controller", time: "18m ago" },
    { sha: "h7i8j9k", author: "isidorn", message: "Feat: sticky scroll improvements", time: "1h ago" },
    { sha: "10m1n2o", author: "joaomoreno", message: "Fix: terminal link detection", time: "2h ago" },
    { sha: "p3q4r5s", author: "sbatten", message: "Docs: update extension guide", time: "3h ago" }
  ],
  contributors: [
    { login: "mjbvz", commits: 142, additions: 12341, deletions: 3456, prs: 28 },
    { login: "hediet", commits: 98, additions: 8712, deletions: 2104, prs: 16 },
    { login: "isidorn", commits: 87, additions: 6153, deletions: 1643, prs: 14 },
    { login: "joaomoreno", commits: 63, additions: 4332, deletions: 1231, prs: 10 },
    { login: "sbatten", commits: 58, additions: 3912, deletions: 1002, prs: 9 }
  ],
  releases: [
    { name: "1.85.1", version: "1.85.1", published: "Dec 18, 2023", status: "Latest", downloads: "2.1M" },
    { name: "1.85.0", version: "1.85.0", published: "Dec 11, 2023", status: "Stable", downloads: "3.4M" },
    { name: "1.84.2", version: "1.84.2", published: "Dec 4, 2023", status: "Stable", downloads: "2.8M" }
  ],
  pipeline: [
    { stage: "Lint", status: "Passed", duration: "2m 14s", successRate: 98.7 },
    { stage: "Unit Tests", status: "Passed", duration: "8m 45s", successRate: 97.3 },
    { stage: "Integration Tests", status: "Passed", duration: "12m 31s", successRate: 96.1 },
    { stage: "Build", status: "Passed", duration: "4m 22s", successRate: 99.2 },
    { stage: "Publish", status: "Passed", duration: "3m 11s", successRate: 98.9 }
  ],
  dependencyAlerts: [
    { metric: "Critical", score: 2, delta: "-" },
    { metric: "High", score: 7, delta: "+1" },
    { metric: "Moderate", score: 13, delta: "-2" },
    { metric: "Low", score: 5, delta: "-" }
  ],
  dependencyUpdates: [
    { metric: "Direct", score: "156 total / 23 outdated", delta: "+3" },
    { metric: "Transitive", score: "1,248 total / 189 outdated", delta: "+12" }
  ],
  health: [
    { metric: "Maintained", score: 92, delta: "+2" },
    { metric: "Documentation", score: 78, delta: "+1" },
    { metric: "Test Coverage", score: "78.4%", delta: "+2.1pp" },
    { metric: "Security", score: 85, delta: "+3" },
    { metric: "Performance", score: 88, delta: "+1" }
  ],
  dora: [
    { metric: "Deployment Frequency", value: "27", delta: "+5" },
    { metric: "Lead Time for Changes", value: "18h 42m", delta: "-12%" },
    { metric: "Change Failure Rate", value: "4.1%", delta: "-0.6pp" },
    { metric: "MTTR", value: "2h 31m", delta: "-8%" }
  ],
  deployments: [
    { metric: "Production", score: "12 deploys / 100%", delta: "+2" },
    { metric: "Staging", score: "9 deploys / 100%", delta: "-" },
    { metric: "Preview", score: "6 deploys / 83.3%", delta: "+1" }
  ],
  activity: [
    { type: "pr", title: "PR #195123 merged", meta: "Fix handle undefined in editor", time: "2m ago", actor: "mjbvz" },
    { type: "issue", title: "Issue #184512 opened", meta: "Terminal crashes on startup", time: "15m ago", actor: "hediet" },
    { type: "release", title: "Release 1.85.1 published", meta: "Stable channel", time: "1h ago", actor: "github-actions" },
    { type: "comment", title: "@mjbvz commented", meta: "Review on PR #195120", time: "2h ago", actor: "mjbvz" },
    { type: "pr", title: "PR #195119 opened", meta: "Sticky scroll improvements", time: "3h ago", actor: "isidorn" }
  ],
  coveragePackages: [
    { name: "vscode-core", coverage: 82.1, delta: "+1.4pp" },
    { name: "vscode-editor", coverage: 79.3, delta: "-0.9pp" },
    { name: "vscode-workbench", coverage: 76.8, delta: "+1.2pp" },
    { name: "vscode-extensions", coverage: 74.2, delta: "+0.3pp" },
    { name: "vscode-debug", coverage: 71.5, delta: "+0.7pp" }
  ],
  generatedAt: new Date().toISOString(),
  source: "demo"
};
