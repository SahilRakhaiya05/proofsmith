import { z } from "zod";
import {
  MAKER_SYSTEM,
  REVIEWER_SYSTEM,
  TRIAGE_SYSTEM,
  generateContent,
  geminiConfigured,
  resolveBestModel,
} from "@/lib/gemini";
import { getAgent } from "@/lib/agents-catalog";

export const runtime = "nodejs";

const BodySchema = z.object({
  role: z.enum(["triage", "maker", "reviewer"]).default("maker"),
  agentId: z.string().optional(),
  prompt: z.string().min(8).max(20_000),
  context: z
    .object({
      issueTitle: z.string().optional(),
      issueBody: z.string().optional(),
      contract: z.string().optional(),
      failureBundle: z.string().optional(),
      repo: z.string().optional(),
      commitSha: z.string().optional(),
      appUrl: z.string().optional(),
    })
    .optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
});

function systemFor(role: "triage" | "maker" | "reviewer") {
  if (role === "triage") return TRIAGE_SYSTEM;
  if (role === "reviewer") return REVIEWER_SYSTEM;
  return MAKER_SYSTEM;
}

export async function POST(request: Request) {
  if (!geminiConfigured()) {
    return Response.json({ error: "gemini_not_configured" }, { status: 503 });
  }

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

  const { role, prompt, context, model, temperature, agentId } = parsed.data;
  const agent = agentId ? getAgent(agentId) : null;
  const resolved = model || (await resolveBestModel()).model;

  const contextBlock = context
    ? [
        context.repo ? `Repo: ${context.repo}` : null,
        context.commitSha ? `Commit: ${context.commitSha}` : null,
        context.appUrl ? `Live app URL: ${context.appUrl}` : null,
        context.issueTitle ? `Issue title: ${context.issueTitle}` : null,
        context.issueBody ? `Issue body:\n${context.issueBody}` : null,
        context.contract ? `Contract:\n${context.contract}` : null,
        context.failureBundle ? `Checker failure bundle:\n${context.failureBundle}` : null,
      ]
        .filter(Boolean)
        .join("\n\n")
    : "";

  const fullPrompt = [
    agent ? `Acting as catalog agent ${agent.id} (${agent.name} / ${agent.role}).` : null,
    contextBlock || null,
    "---",
    prompt,
  ]
    .filter(Boolean)
    .join("\n\n");

  const result = await generateContent({
    prompt: fullPrompt,
    system: systemFor(role),
    model: resolved,
    temperature,
  });

  return Response.json(
    {
      ok: result.ok,
      role,
      agentId: agent?.id || null,
      model: result.model,
      text: result.text,
      status: result.status,
      error: result.ok ? undefined : result.error,
      canApproveMerge: false,
      checkerNext: "Run TestSprite CLI against the live APP_URL and bank the verdict in LOOP.md",
    },
    {
      status: result.ok ? 200 : result.status || 502,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
