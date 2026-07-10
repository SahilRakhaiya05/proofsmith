import { requireSession } from "@/lib/require-session";
import { listUserRepos } from "@/lib/github-user";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const result = await listUserRepos(auth.session);
  if (!result.ok) {
    return Response.json({ error: "github_repos_failed", status: result.status }, { status: result.status });
  }
  return Response.json({ repos: result.repos }, { headers: { "Cache-Control": "no-store" } });
}
