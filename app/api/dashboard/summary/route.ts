import { envChecklist, integrationFlags, publicAppUrl } from "@/lib/config";
import { listRuns } from "@/lib/run-store";
import { agents } from "@/lib/agents-catalog";
import { requireSession } from "@/lib/require-session";
import { listUserRepos, getAuthenticatedUser } from "@/lib/github-user";
import { testspriteWhoami, localPlans } from "@/lib/testsprite-client";
import { e2bStatus } from "@/lib/e2b-client";
import { geminiConfigured, resolveBestModel } from "@/lib/gemini";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const flags = integrationFlags();
  const auth = await requireSession(request);
  const runs = listRuns();

  let github: unknown = { authenticated: false };
  if (auth.ok) {
    const [user, repos] = await Promise.all([
      getAuthenticatedUser(auth.session),
      listUserRepos(auth.session, 8),
    ]);
    github = {
      authenticated: true,
      login: auth.session.user.login,
      avatarUrl: auth.session.user.avatar_url,
      profile: user.ok ? user.user : null,
      repos: repos.ok ? repos.repos : [],
    };
  }

  const [testsprite, e2b, gemini] = await Promise.all([
    flags.testSprite
      ? testspriteWhoami()
      : Promise.resolve({ ok: false, status: 0, body: null, baseUrl: null }),
    e2bStatus(),
    geminiConfigured()
      ? resolveBestModel()
      : Promise.resolve({ ok: false, model: null, models: [], source: "none" as const }),
  ]);

  return Response.json(
    {
      appUrl: publicAppUrl(request),
      integrations: flags,
      env: envChecklist().map(({ key, set, required }) => ({ key, set, required })),
      github,
      testsprite: {
        configured: flags.testSprite,
        ok: testsprite.ok,
        status: "status" in testsprite ? testsprite.status : 0,
        projectId: process.env.TESTSPRITE_PROJECT_ID || null,
        plans: localPlans(),
      },
      e2b: {
        configured: flags.e2b,
        ok: e2b.ok,
        endpoint: "endpoint" in e2b ? e2b.endpoint : null,
      },
      gemini: {
        configured: flags.gemini,
        ok: gemini.ok,
        bestModel: "model" in gemini ? gemini.model : null,
        modelCount: "models" in gemini ? gemini.models.length : 0,
        source: "source" in gemini ? gemini.source : "none",
      },
      agents: {
        total: agents.length,
        ready: agents.filter((a) => a.status === "ready").length,
        gated: agents.filter((a) => a.status === "gated").length,
      },
      loops: {
        total: runs.length,
        byState: runs.reduce<Record<string, number>>((acc, run) => {
          acc[run.state] = (acc[run.state] || 0) + 1;
          return acc;
        }, {}),
        recent: runs.slice(0, 5),
      },
      timestamp: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
