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

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(20_000),
});

const BodySchema = z.object({
  role: z.enum(["triage", "maker", "reviewer"]).default("maker"),
  agentId: z.string().optional(),
  /** Single-turn prompt (legacy). Prefer `messages` for chat UI. */
  prompt: z.string().min(1).max(20_000).optional(),
  /** Multi-turn history. */
  messages: z.array(MessageSchema).max(40).optional(),
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
  /** Ignored — model is always chosen server-side. */
  model: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
});

function systemFor(role: "triage" | "maker" | "reviewer") {
  if (role === "triage") return TRIAGE_SYSTEM;
  if (role === "reviewer") return REVIEWER_SYSTEM;
  return MAKER_SYSTEM;
}

function buildPromptFromMessages(
  messages: z.infer<typeof MessageSchema>[],
  fallbackPrompt?: string,
) {
  if (messages.length) {
    return messages
      .map((m) => {
        const tag = m.role === "user" ? "User" : m.role === "assistant" ? "Assistant" : "System";
        return `${tag}:\n${m.content}`;
      })
      .join("\n\n");
  }
  return fallbackPrompt || "";
}

export async function POST(request: Request) {
  if (!geminiConfigured()) {
    return Response.json(
      {
        error: "gemini_not_configured",
        message: "Set GEMINI_API_KEY in .env.local or Vercel env, then restart/redeploy.",
      },
      { status: 503 },
    );
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

  // Client-supplied `model` is intentionally ignored.
  const { role, prompt, messages, context, temperature, agentId } = parsed.data;
  const chatPrompt = buildPromptFromMessages(messages || [], prompt);
  if (chatPrompt.length < 4) {
    return Response.json({ error: "empty_prompt" }, { status: 400 });
  }

  const agent = agentId ? getAgent(agentId) : null;
  const resolved = await resolveBestModel();

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
    "--- Conversation ---",
    chatPrompt,
  ]
    .filter(Boolean)
    .join("\n\n");

  const result = await generateContent({
    prompt: fullPrompt,
    system: systemFor(role),
    temperature,
  });

  return Response.json(
    {
      ok: result.ok,
      role,
      agentId: agent?.id || null,
      model: result.model,
      selection: "server-auto",
      selectionReason: resolved.reason,
      text: result.text,
      status: result.status,
      error: result.ok ? undefined : result.error,
      canApproveMerge: false,
      checkerNext: "Run TestSprite CLI against the live APP_URL and bank the verdict in LOOP.md",
      turn: messages?.filter((m) => m.role === "user").length || (prompt ? 1 : 0),
    },
    {
      status: result.ok ? 200 : result.status || 502,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
