import { NextResponse } from "next/server";
import { fetchGithubDashboardData } from "@/lib/github";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner") ?? "microsoft";
  const repo = searchParams.get("repo") ?? "vscode";

  try {
    if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) {
      return NextResponse.json({ message: "Use a valid GitHub repository in owner/repo format." }, { status: 400 });
    }

    const data = await fetchGithubDashboardData(owner, repo);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected GitHub API error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
