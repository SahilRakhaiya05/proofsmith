import { z } from "zod";
import { generateContent, geminiConfigured, MAKER_SYSTEM } from "@/lib/gemini";
import { createRun, listRuns, updateRun } from "@/lib/run-store";
import { publicAppUrl } from "@/lib/config";
import { e2bStatus } from "@/lib/e2b-client";
import { testspriteWhoami } from "@/lib/testsprite-client";
import { integrationFlags } from "@/lib/config";

export const runtime = "nodejs";

const BodySchema = z.object({
  issueNumber: z.number().int().positive().optional(),
  title: z.string().min(3),
  problem: z.string().min(10),
  repo: z.string().default("SahilRakhaiya05/proofsmith"),
  runId: z.string().optional(),
  failureBundle: z.string().optional(),
});

/**
 * One maker iteration of the loop:
 * plan with Gemini → record run evidence → report checker readiness (TestSprite/E2B/GitHub).
 * Does not fake TestSprite pass.
 */
export async function POST(request: Request) {
  const flags = integrationFlags();
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "invalid_body", issues: parsed.error.issues }, { status: 400 });
  }

  const appUrl = publicAppUrl(request);
  const input = parsed.data;
  const run =
    (input.runId ? listRuns().find((item) => item.id === input.runId) : null) ||
    createRun({
      issueNumber: input.issueNumber || Math.floor(Math.random() * 90) + 10,
      title: input.title,
      repo: input.repo,
      actor: "gemini-maker",
    });

  let planText = "";
  let model = process.env.GEMINI_MODEL || "gemini-2.5-pro";
  if (geminiConfigured()) {
    const gen = await generateContent({
      system: MAKER_SYSTEM,
      model,
      prompt: [
        `Title: ${input.title}`,
        `Problem:\n${input.problem}`,
        input.failureBundle ? `Previous checker failure:\n${input.failureBundle}` : "No failure bundle yet — first write step.",
        `Live app URL for checker: ${appUrl}`,
        "Produce the maker plan for this iteration only.",
      ].join("\n\n"),
    });
    planText = gen.text || JSON.stringify(gen.error);
    model = gen.model;
    if (gen.ok) {
      updateRun(run.id, {
        state: input.failureBundle ? "REPAIRING" : "BUILDING",
        agentId: "agent_maker",
        evidence: [
          ...run.evidence.filter((item) => item.kind !== "maker"),
          {
            kind: "maker",
            label: input.failureBundle ? "Fix from failure bundle" : "Write plan (Gemini)",
            status: "pass",
            detail: `model=${model}`,
          },
        ],
      });
    }
  } else {
    planText = "Gemini not configured — set GEMINI_API_KEY to enable maker agent.";
  }

  const [ts, e2b] = await Promise.all([
    flags.testSprite ? testspriteWhoami() : Promise.resolve({ ok: false, status: 0 }),
    e2bStatus(),
  ]);

  const next = updateRun(run.id, {}) || run;

  return Response.json(
    {
      ok: true,
      run: next,
      maker: {
        model,
        configured: geminiConfigured(),
        plan: planText,
      },
      checkers: {
        testsprite: {
          configured: flags.testSprite,
          ok: "ok" in ts ? ts.ok : false,
          nextCommand: `npx testsprite test create --plan-from .testsprite/plans/viewer-approval.plan.json --run --wait --target-url ${appUrl}`,
        },
        e2b: { configured: flags.e2b, ok: e2b.ok },
        githubOAuth: flags.githubOAuth,
      },
      appUrl,
      loopLine: `Maker (${model}) planned "${input.title}" for ${input.repo}; checkers TestSprite=${flags.testSprite ? "configured" : "missing"} E2B=${flags.e2b ? "configured" : "missing"}; bank only after live TestSprite pass on ${appUrl}.`,
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
