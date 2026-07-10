import { triggerTestRun } from "@/lib/testsprite-client";
import { integrationFlags, publicAppUrl } from "@/lib/config";
import { z } from "zod";

export const runtime = "nodejs";

const BodySchema = z.object({
  testId: z.string().min(3),
  targetUrl: z.string().url().optional(),
});

export async function POST(request: Request) {
  if (!integrationFlags().testSprite) {
    return Response.json({ error: "testsprite_not_configured" }, { status: 503 });
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
  const targetUrl = parsed.data.targetUrl || publicAppUrl(request);
  const result = await triggerTestRun(parsed.data.testId, targetUrl);
  return Response.json(
    {
      ok: result.ok,
      status: result.status,
      targetUrl,
      idempotencyKey: result.idempotencyKey,
      result: result.result,
    },
    { status: result.ok ? 202 : result.status || 502, headers: { "Cache-Control": "no-store" } },
  );
}
