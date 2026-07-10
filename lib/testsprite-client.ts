import { testspriteBaseUrl } from "@/lib/config";

export type TestSpriteProject = {
  id: string;
  name?: string;
  targetUrl?: string;
  [key: string]: unknown;
};

export type TestSpriteTest = {
  id: string;
  name?: string;
  type?: string;
  status?: string;
  [key: string]: unknown;
};

export type TestSpriteWhoami = {
  ok: boolean;
  status: number;
  body: unknown;
  baseUrl: string;
};

function headers(apiKey: string) {
  return {
    accept: "application/json",
    "content-type": "application/json",
    "x-api-key": apiKey,
    "user-agent": "proofsmith/0.1 (testsprite-facade)",
  };
}

async function tsFetch(path: string, init?: RequestInit) {
  const apiKey = process.env.TESTSPRITE_API_KEY;
  if (!apiKey) throw new Error("TESTSPRITE_API_KEY is not configured");
  const base = testspriteBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const response = await fetch(url, {
    ...init,
    headers: { ...headers(apiKey), ...(init?.headers || {}) },
    cache: "no-store",
  });
  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text.slice(0, 500) };
  }
  return { response, body, base };
}

export async function testspriteWhoami(): Promise<TestSpriteWhoami> {
  try {
    // Prefer a lightweight list call as auth probe (CLI facade may not expose /whoami).
    const { response, body, base } = await tsFetch("/projects?limit=1");
    return { ok: response.ok, status: response.status, body, baseUrl: base };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      body: { error: error instanceof Error ? error.message : "request_failed" },
      baseUrl: testspriteBaseUrl(),
    };
  }
}

export async function listProjects() {
  const { response, body } = await tsFetch("/projects?limit=50");
  if (!response.ok) {
    return { ok: false as const, status: response.status, projects: [] as TestSpriteProject[], error: body };
  }
  const items = Array.isArray(body)
    ? body
    : Array.isArray((body as { items?: unknown })?.items)
      ? (body as { items: TestSpriteProject[] }).items
      : Array.isArray((body as { data?: unknown })?.data)
        ? (body as { data: TestSpriteProject[] }).data
        : [];
  return { ok: true as const, status: response.status, projects: items as TestSpriteProject[] };
}

export async function listTests(projectId: string) {
  const { response, body } = await tsFetch(`/tests?projectId=${encodeURIComponent(projectId)}&limit=50`);
  if (!response.ok) {
    return { ok: false as const, status: response.status, tests: [] as TestSpriteTest[], error: body };
  }
  const items = Array.isArray(body)
    ? body
    : Array.isArray((body as { items?: unknown })?.items)
      ? (body as { items: TestSpriteTest[] }).items
      : Array.isArray((body as { data?: unknown })?.data)
        ? (body as { data: TestSpriteTest[] }).data
        : [];
  return { ok: true as const, status: response.status, tests: items as TestSpriteTest[] };
}

export async function triggerTestRun(testId: string, targetUrl?: string) {
  const idempotencyKey = crypto.randomUUID();
  const body: Record<string, unknown> = {};
  if (targetUrl) body.targetUrl = targetUrl;
  const { response, body: result } = await tsFetch(`/tests/${encodeURIComponent(testId)}/runs`, {
    method: "POST",
    headers: { "idempotency-key": idempotencyKey },
    body: JSON.stringify(body),
  });
  return {
    ok: response.ok,
    status: response.status,
    result,
    idempotencyKey,
  };
}

export async function getRun(runId: string) {
  const { response, body } = await tsFetch(`/runs/${encodeURIComponent(runId)}`);
  return { ok: response.ok, status: response.status, run: body };
}

export function localPlans() {
  return [
    {
      file: ".testsprite/plans/viewer-approval.plan.json",
      name: "Viewer cannot approve a release",
      priority: "p0",
    },
    {
      file: ".testsprite/plans/exact-once-deploy.plan.json",
      name: "Exact-once deploy",
      priority: "p0",
    },
    {
      file: ".testsprite/plans/rollback-audit-focus.plan.json",
      name: "Rollback audit focus",
      priority: "p1",
    },
  ];
}
