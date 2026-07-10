import { createSandbox, killSandbox } from "@/lib/e2b-client";
import { integrationFlags } from "@/lib/config";
import { z } from "zod";

export const runtime = "nodejs";

const CreateSchema = z.object({
  template: z.string().min(1).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

export async function POST(request: Request) {
  if (!integrationFlags().e2b) {
    return Response.json({ error: "e2b_not_configured" }, { status: 503 });
  }
  let json: unknown = {};
  try {
    json = await request.json();
  } catch {
    json = {};
  }
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }
  const result = await createSandbox(parsed.data);
  return Response.json(result, {
    status: result.ok ? 201 : result.status || 502,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function DELETE(request: Request) {
  if (!integrationFlags().e2b) {
    return Response.json({ error: "e2b_not_configured" }, { status: 503 });
  }
  const sandboxId = new URL(request.url).searchParams.get("id");
  if (!sandboxId) return Response.json({ error: "id_required" }, { status: 400 });
  const result = await killSandbox(sandboxId);
  return Response.json(result, { status: result.ok ? 200 : result.status || 502 });
}
