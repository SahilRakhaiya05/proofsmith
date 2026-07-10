/**
 * Google Gemini client for Proofsmith maker/reviewer agents.
 * Model selection is server-side only — the browser never chooses or lists models.
 * Secrets stay in env — never returned to the browser.
 */

const GEMINI_BASE = (
  process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta"
).replace(/\/$/, "");

/**
 * Ranked preference for coding / agent work (highest first).
 * Tuned for Proofsmith maker/reviewer: deep reasoning + code, not TTS/image/embed.
 */
const MODEL_PREFERENCE = [
  "gemini-3.1-pro-preview",
  "gemini-3.1-pro",
  "gemini-3-pro-preview",
  "gemini-3-pro",
  "gemini-2.5-pro",
  "gemini-pro-latest",
  "gemini-2.5-flash",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-pro",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "gemini-pro",
];

export type GeminiModelInfo = {
  name: string;
  displayName?: string;
  description?: string;
  supportedGenerationMethods?: string[];
  inputTokenLimit?: number;
  outputTokenLimit?: number;
};

export function geminiApiKey(): string | null {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.MODEL_PROVIDER_API_KEY ||
    null
  );
}

export function geminiConfigured() {
  return Boolean(geminiApiKey());
}

function withKey(path: string) {
  const key = geminiApiKey();
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  const url = new URL(`${GEMINI_BASE}${path.startsWith("/") ? path : `/${path}`}`);
  url.searchParams.set("key", key);
  return url.toString();
}

function shortName(full: string) {
  return full.replace(/^models\//, "");
}

function isCodingModel(name: string) {
  return !/tts|image|embed|aqa|gecko|vision|robotics|computer-use/i.test(name);
}

export async function listGeminiModels(): Promise<{
  ok: boolean;
  status: number;
  models: GeminiModelInfo[];
  error?: unknown;
}> {
  try {
    const response = await fetch(withKey("/models"), { cache: "no-store" });
    const body = (await response.json()) as {
      models?: Array<Record<string, unknown>>;
      error?: unknown;
    };
    if (!response.ok) {
      return { ok: false, status: response.status, models: [], error: body.error || body };
    }
    const models = (body.models || [])
      .map((model) => ({
        name: shortName(String(model.name || "")),
        displayName: model.displayName ? String(model.displayName) : undefined,
        description: model.description ? String(model.description) : undefined,
        supportedGenerationMethods: Array.isArray(model.supportedGenerationMethods)
          ? (model.supportedGenerationMethods as string[])
          : undefined,
        inputTokenLimit: typeof model.inputTokenLimit === "number" ? model.inputTokenLimit : undefined,
        outputTokenLimit:
          typeof model.outputTokenLimit === "number" ? model.outputTokenLimit : undefined,
      }))
      .filter((model) => model.name);
    return { ok: true, status: response.status, models };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      models: [],
      error: error instanceof Error ? error.message : "list_models_failed",
    };
  }
}

/** Score a model for Proofsmith coding agents (higher = better). */
export function scoreModelForProofsmith(model: GeminiModelInfo): number {
  const name = model.name;
  if (!isCodingModel(name)) return -1000;

  const methods = model.supportedGenerationMethods || [];
  if (methods.length && !methods.includes("generateContent")) return -1000;

  let score = 0;
  const prefIndex = MODEL_PREFERENCE.findIndex(
    (preferred) => name === preferred || name.startsWith(`${preferred}-`),
  );
  if (prefIndex >= 0) score += 10_000 - prefIndex * 100;

  if (/3\.1.*pro/i.test(name)) score += 900;
  else if (/3.*pro/i.test(name)) score += 800;
  else if (/2\.5.*pro/i.test(name)) score += 700;
  else if (/pro/i.test(name)) score += 500;
  else if (/2\.5.*flash/i.test(name)) score += 400;
  else if (/flash/i.test(name)) score += 200;

  if (/preview/i.test(name) && /pro/i.test(name)) score += 50;
  if (/lite/i.test(name)) score -= 120;

  // Prefer large context for contracts + failure bundles
  if ((model.inputTokenLimit || 0) >= 1_000_000) score += 80;
  else if ((model.inputTokenLimit || 0) >= 200_000) score += 40;

  return score;
}

export function pickBestModel(models: GeminiModelInfo[]): string {
  const envOverride = process.env.GEMINI_MODEL?.trim();
  if (envOverride) return envOverride.replace(/^models\//, "");

  const ranked = models
    .map((model) => ({ model, score: scoreModelForProofsmith(model) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  if (ranked[0]) return ranked[0].model.name;

  for (const preferred of MODEL_PREFERENCE) {
    const hit = models.find(
      (model) =>
        isCodingModel(model.name) &&
        (model.name === preferred || model.name.startsWith(`${preferred}-`)),
    );
    if (hit) return hit.name;
  }

  return MODEL_PREFERENCE.find((name) => name.includes("2.5-pro")) || "gemini-2.5-pro";
}

export async function resolveBestModel() {
  const listed = await listGeminiModels();
  if (!listed.ok || listed.models.length === 0) {
    return {
      ok: listed.ok,
      status: listed.status,
      model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
      models: listed.models,
      error: listed.error,
      source: "fallback" as const,
      reason: listed.ok
        ? "empty model catalog — using stable fallback"
        : "listModels failed — using stable fallback",
    };
  }
  const model = pickBestModel(listed.models);
  const winner = listed.models.find((item) => item.name === model);
  return {
    ok: true,
    status: listed.status,
    model,
    models: listed.models,
    source: "api" as const,
    reason: process.env.GEMINI_MODEL
      ? "GEMINI_MODEL env override"
      : `auto-ranked for coding agents (score ${winner ? scoreModelForProofsmith(winner) : "n/a"})`,
  };
}

export type GenerateResult = {
  ok: boolean;
  status: number;
  model: string;
  text: string;
  raw?: unknown;
  error?: unknown;
  selection?: string;
};

export async function generateContent(options: {
  prompt: string;
  system?: string;
  /** Ignored unless ALLOW_CLIENT_MODEL=1 — server always auto-picks best. */
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}): Promise<GenerateResult> {
  const allowClient = process.env.ALLOW_CLIENT_MODEL === "1";
  const resolved = allowClient && options.model
    ? options.model
    : (await resolveBestModel()).model;
  const model = resolved.replace(/^models\//, "");
  const body = {
    systemInstruction: options.system
      ? { parts: [{ text: options.system }] }
      : undefined,
    contents: [
      {
        role: "user",
        parts: [{ text: options.prompt }],
      },
    ],
    generationConfig: {
      temperature: options.temperature ?? 0.35,
      maxOutputTokens: options.maxOutputTokens ?? 4096,
    },
  };

  try {
    const response = await fetch(withKey(`/models/${encodeURIComponent(model)}:generateContent`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const raw = await response.json();
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        model,
        text: "",
        raw,
        error: raw,
        selection: "server-auto",
      };
    }
    const text = extractText(raw);
    return {
      ok: Boolean(text),
      status: response.status,
      model,
      text,
      raw,
      selection: "server-auto",
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      model,
      text: "",
      error: error instanceof Error ? error.message : "generate_failed",
      selection: "server-auto",
    };
  }
}

function extractText(raw: unknown): string {
  const candidates = (raw as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })
    ?.candidates;
  if (!candidates?.length) return "";
  return (
    candidates[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim() || ""
  );
}

export const MAKER_SYSTEM = `You are the Proofsmith Maker agent.
You implement the smallest correct change for a falsifiable engineering contract.
Rules:
- Never claim TestSprite or production verification passed unless evidence is provided.
- Never approve merges — humans only.
- Prefer minimal diffs, clear acceptance criteria, and honest risk notes.
- Output structured markdown with sections: Plan, Changes, Checks, Risks, Next checker step.
- The independent checker is TestSprite CLI against the LIVE deployed URL, not localhost.`;

export const REVIEWER_SYSTEM = `You are the Proofsmith independent Reviewer agent.
You do not write production code. You review against the contract and security policy.
- Flag budget violations, secret leaks, authZ gaps, and unproven claims.
- Output: Verdict (approve|request-changes|block), Findings, Required tests, Human notes.
- You cannot merge.`;

export const TRIAGE_SYSTEM = `You are the Proofsmith Triage agent.
Classify the issue, estimate risk (low|medium|high|critical), extract acceptance criteria candidates,
and decide contract-ready vs needs-human. Output JSON-friendly markdown.`;
