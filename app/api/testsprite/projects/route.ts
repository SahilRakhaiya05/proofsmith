import { listProjects } from "@/lib/testsprite-client";
import { integrationFlags } from "@/lib/config";

export const runtime = "nodejs";

export async function GET() {
  if (!integrationFlags().testSprite) {
    return Response.json({ error: "testsprite_not_configured" }, { status: 503 });
  }
  const result = await listProjects();
  if (!result.ok) {
    return Response.json({ error: "list_failed", detail: result.error, status: result.status }, { status: result.status || 502 });
  }
  return Response.json({ projects: result.projects }, { headers: { "Cache-Control": "no-store" } });
}
