import { buildSecurityScorecard } from "@/lib/security-scorecard";
import { integrationFlags, publicAppUrl } from "@/lib/config";
import { geminiConfigured, resolveBestModel } from "@/lib/gemini";
import { testspriteWhoami, localPlans } from "@/lib/testsprite-client";
import { e2bStatus } from "@/lib/e2b-client";
import { listRuns } from "@/lib/run-store";

export const runtime = "nodejs";

/**
 * One-click pre-launch: security scorecard + integration probes.
 * Never returns secret values.
 */
export async function POST(request: Request) {
  return runLaunch(request);
}

export async function GET(request: Request) {
  return runLaunch(request);
}

async function runLaunch(request: Request) {
  const flags = integrationFlags();
  const appUrl = publicAppUrl(request);
  const scorecard = buildSecurityScorecard(request);

  const [gemini, testsprite, e2b] = await Promise.all([
    geminiConfigured()
      ? resolveBestModel()
      : Promise.resolve({ ok: false, model: null, reason: "not configured", source: "none" as const }),
    flags.testSprite
      ? testspriteWhoami()
      : Promise.resolve({ ok: false, status: 0 }),
    e2bStatus(),
  ]);

  const steps = [
    {
      id: "security",
      title: "Security scorecard",
      ok: scorecard.readyToLaunch,
      detail: `${scorecard.grade} · ${scorecard.score}/100`,
    },
    {
      id: "gemini",
      title: "Maker AI (server-auto model)",
      ok: Boolean(gemini.ok || gemini.model),
      detail: gemini.model
        ? `ready · model selected server-side`
        : "GEMINI_API_KEY missing",
    },
    {
      id: "testsprite",
      title: "TestSprite checker",
      ok: flags.testSprite && ("ok" in testsprite ? testsprite.ok : false),
      detail: flags.testSprite
        ? `probe ${"ok" in testsprite && testsprite.ok ? "ok" : "failed"} · ${localPlans().length} local plans`
        : "TESTSPRITE_API_KEY missing",
    },
    {
      id: "e2b",
      title: "E2B sandboxes",
      ok: flags.e2b && e2b.ok,
      detail: flags.e2b ? (e2b.ok ? "reachable" : "configured but probe failed") : "optional",
    },
    {
      id: "github",
      title: "GitHub OAuth",
      ok: flags.githubOAuth,
      detail: flags.githubOAuth ? "configured" : "set CLIENT_ID/SECRET/SESSION_SECRET",
    },
    {
      id: "loops",
      title: "Loop ledger",
      ok: listRuns().length > 0,
      detail: `${listRuns().length} runs in memory store`,
    },
  ];

  const allCritical =
    scorecard.readyToLaunch &&
    flags.testSprite &&
    geminiConfigured() &&
    flags.githubOAuth;

  return Response.json(
    {
      product: "Proofsmith",
      appUrl,
      launchedAt: new Date().toISOString(),
      ready: allCritical,
      scorecard: {
        score: scorecard.score,
        grade: scorecard.grade,
        readyToLaunch: scorecard.readyToLaunch,
        summary: scorecard.summary,
      },
      steps,
      next: allCritical
        ? {
            open: ["/dashboard", "/ai", "/security", "/submit"],
            checker: `npx testsprite test create --plan-from .testsprite/plans/viewer-approval.plan.json --run --wait --target-url ${appUrl}`,
            human: "Connect GitHub on /dashboard, run one maker plan on /ai, then bank TestSprite on the live URL into LOOP.md",
          }
        : {
            open: ["/settings", "/security", "/integrations"],
            human: scorecard.summary,
          },
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
