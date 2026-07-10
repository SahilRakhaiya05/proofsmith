/**
 * Minimal E2B HTTP client for sandbox lifecycle.
 * Uses team API key via X-API-KEY (E2B_API_KEY).
 * @see https://e2b.dev/docs
 */

const E2B_API = (process.env.E2B_API_URL || "https://api.e2b.dev").replace(/\/$/, "");

function apiKey() {
  const key = process.env.E2B_API_KEY;
  if (!key) throw new Error("E2B_API_KEY is not configured");
  return key;
}

function e2bHeaders() {
  return {
    accept: "application/json",
    "content-type": "application/json",
    "X-API-KEY": apiKey(),
  };
}

export async function e2bStatus() {
  if (!process.env.E2B_API_KEY) {
    return { configured: false, ok: false, message: "E2B_API_KEY not set" };
  }
  try {
    // List sandboxes as a connectivity probe
    const response = await fetch(`${E2B_API}/sandboxes?limit=5`, {
      headers: e2bHeaders(),
      cache: "no-store",
    });
    const text = await response.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = { raw: text.slice(0, 300) };
    }
    return {
      configured: true,
      ok: response.ok || response.status === 404,
      status: response.status,
      endpoint: E2B_API,
      body: response.ok ? body : undefined,
      error: response.ok ? undefined : body,
    };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      message: error instanceof Error ? error.message : "e2b_unreachable",
      endpoint: E2B_API,
    };
  }
}

export async function createSandbox(options?: {
  template?: string;
  timeoutMs?: number;
  metadata?: Record<string, string>;
}) {
  const payload = {
    templateID: options?.template || process.env.E2B_TEMPLATE_ID || "base",
    timeout: Math.floor((options?.timeoutMs || 300_000) / 1000),
    metadata: {
      product: "proofsmith",
      role: "maker-worktree",
      ...(options?.metadata || {}),
    },
  };

  const response = await fetch(`${E2B_API}/sandboxes`, {
    method: "POST",
    headers: e2bHeaders(),
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text.slice(0, 500) };
  }
  return { ok: response.ok, status: response.status, sandbox: body };
}

export async function killSandbox(sandboxId: string) {
  const response = await fetch(`${E2B_API}/sandboxes/${encodeURIComponent(sandboxId)}`, {
    method: "DELETE",
    headers: e2bHeaders(),
    cache: "no-store",
  });
  return { ok: response.ok || response.status === 204, status: response.status };
}
