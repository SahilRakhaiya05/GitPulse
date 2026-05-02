export type TrendDirection = "up" | "down" | "flat";

export interface Trend {
  value: string;
  direction: TrendDirection;
}

export interface StatMetric {
  label: string;
  value: string | number;
  trend: Trend;
  sparkline: number[];
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
  secondary?: number;
}

export interface PullRequestSlice {
  name: string;
  value: number;
  color: string;
}

export interface IssueBreakdown {
  label: string;
  open: number;
  trend: number;
}

export interface LanguageUsage {
  name: string;
  value: number;
  color: string;
}

export interface CommitRow {
  sha: string;
  author: string;
  message: string;
  time: string;
}

export interface ContributorRow {
  login: string;
  commits: number;
  additions: number;
  deletions: number;
  prs?: number;
}

export interface ReleaseRow {
  name: string;
  version: string;
  published: string;
  status: string;
  downloads: string;
}

export interface PipelineStage {
  stage: string;
  status: "Passed" | "Failed" | "Running";
  duration: string;
  successRate: number;
}

export interface HealthMetric {
  metric: string;
  score: string | number;
  delta: string;
}

export interface DoraMetric {
  metric: string;
  value: string;
  delta: string;
}

export interface ActivityItem {
  type: "pr" | "issue" | "release" | "comment";
  title: string;
  meta: string;
  time: string;
  actor?: string;
}

export interface CoveragePackage {
  name: string;
  coverage: number;
  delta: string;
}

export interface GithubDashboardData {
  repo: {
    owner: string;
    name: string;
    visibility: string;
    url: string;
    defaultBranch: string;
  };
  stats: StatMetric[];
  commitsOverTime: TimeSeriesPoint[];
  pullRequests: PullRequestSlice[];
  issues: IssueBreakdown[];
  coverageOverTime: TimeSeriesPoint[];
  languages: LanguageUsage[];
  recentCommits: CommitRow[];
  contributors: ContributorRow[];
  releases: ReleaseRow[];
  pipeline: PipelineStage[];
  dependencyAlerts: HealthMetric[];
  dependencyUpdates: HealthMetric[];
  health: HealthMetric[];
  dora: DoraMetric[];
  deployments: HealthMetric[];
  activity: ActivityItem[];
  coveragePackages: CoveragePackage[];
  generatedAt: string;
  source: "github-graphql" | "github-rest" | "demo";
}
