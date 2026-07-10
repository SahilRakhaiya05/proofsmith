import { geminiConfigured, resolveBestModel } from "@/lib/gemini";
import { integrationFlags } from "@/lib/config";

export const runtime = "nodejs";

export async function GET() {
  const flags = integrationFlags();
  if (!geminiConfigured()) {
    return Response.json({
      configured: false,
      ok: false,
      provider: "google-gemini",
      message: "GEMINI_API_KEY not set",
      integrations: flags,
    });
  }

  const resolved = await resolveBestModel();
  return Response.json(
    {
      configured: true,
      ok: resolved.ok,
      provider: "google-gemini",
      bestModel: resolved.model,
      source: resolved.source,
      modelCount: resolved.models.length,
      status: resolved.status,
      error: resolved.error,
      roles: ["triage", "maker", "reviewer"],
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
