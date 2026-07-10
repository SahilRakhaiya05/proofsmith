import { requireSession } from "@/lib/require-session";
import { listRepoIssues, listPullRequests } from "@/lib/github-user";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const owner = url.searchParams.get("owner");
  const repo = url.searchParams.get("repo");
  if (!owner || !repo) {
    return Response.json({ error: "owner_and_repo_required" }, { status: 400 });
  }
  const [issues, pulls] = await Promise.all([
    listRepoIssues(auth.session, owner, repo),
    listPullRequests(auth.session, owner, repo),
  ]);
  return Response.json(
    {
      owner,
      repo,
      issues: issues.ok ? issues.issues : [],
      pulls: pulls.ok ? pulls.pulls : [],
      errors: {
        issues: issues.ok ? null : issues.status,
        pulls: pulls.ok ? null : pulls.status,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
