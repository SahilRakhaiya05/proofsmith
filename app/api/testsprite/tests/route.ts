import { listTests } from "@/lib/testsprite-client";
import { integrationFlags } from "@/lib/config";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!integrationFlags().testSprite) {
    return Response.json({ error: "testsprite_not_configured" }, { status: 503 });
  }
  const projectId =
    new URL(request.url).searchParams.get("projectId") || process.env.TESTSPRITE_PROJECT_ID;
  if (!projectId) {
    return Response.json({ error: "projectId_required" }, { status: 400 });
  }
  const result = await listTests(projectId);
  if (!result.ok) {
    return Response.json({ error: "list_failed", detail: result.error, status: result.status }, { status: result.status || 502 });
  }
  return Response.json({ projectId, tests: result.tests }, { headers: { "Cache-Control": "no-store" } });
}
