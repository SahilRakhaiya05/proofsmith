/**
 * Google Gemini client for Proofsmith maker/reviewer agents.
 * Secrets stay in env — never returned to the browser.
 */

const GEMINI_BASE = (
  process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta"
).replace(/\/$/, "");

/** Preference order for coding / agent work (highest first). */
const MODEL_PREFERENCE = [
  "gemini-3.1-pro-preview",
  "gemini-3-pro-preview",
  "gemini-3.1-pro",
  "gemini-3-pro",
  "gemini-2.5-pro",
  "gemini-pro-latest",
  "gemini-2.5-flash",
  "gemini-3-flash-preview",
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

export function pickBestModel(models: GeminiModelInfo[]): string {
  const envOverride = process.env.GEMINI_MODEL?.trim();
  if (envOverride) return envOverride.replace(/^models\//, "");

  const generatable = models.filter((model) => {
    const methods = model.supportedGenerationMethods || [];
    return methods.length === 0 || methods.includes("generateContent");
  });

  for (const preferred of MODEL_PREFERENCE) {
    const hit = generatable.find(
      (model) => model.name === preferred || model.name.startsWith(`${preferred}-`),
    );
    if (hit) return hit.name;
  }

  // Prefer names containing "pro", then "flash"
  const pro = generatable.find((model) => /2\.5.*pro|pro/i.test(model.name) && !/tts|image|embed/i.test(model.name));
  if (pro) return pro.name;
  const flash = generatable.find((model) => /flash/i.test(model.name) && !/tts|image|embed/i.test(model.name));
  if (flash) return flash.name;

  return generatable[0]?.name || MODEL_PREFERENCE[0];
}

export async function resolveBestModel() {
  const listed = await listGeminiModels();
  if (!listed.ok || listed.models.length === 0) {
    return {
      ok: listed.ok,
      status: listed.status,
      model: process.env.GEMINI_MODEL || MODEL_PREFERENCE[0],
      models: listed.models,
      error: listed.error,
      source: "fallback" as const,
    };
  }
  const model = pickBestModel(listed.models);
  return {
    ok: true,
    status: listed.status,
    model,
    models: listed.models,
    source: "api" as const,
  };
}

export type GenerateResult = {
  ok: boolean;
  status: number;
  model: string;
  text: string;
  raw?: unknown;
  error?: unknown;
};

export async function generateContent(options: {
  prompt: string;
  system?: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}): Promise<GenerateResult> {
  const resolved = options.model || (await resolveBestModel()).model;
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
      return { ok: false, status: response.status, model, text: "", raw, error: raw };
    }
    const text = extractText(raw);
    return { ok: Boolean(text), status: response.status, model, text, raw };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      model,
      text: "",
      error: error instanceof Error ? error.message : "generate_failed",
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
