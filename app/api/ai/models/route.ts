import { geminiConfigured, resolveBestModel } from "@/lib/gemini";

export const runtime = "nodejs";

/**
 * Public status only. Does NOT expose the full model catalog.
 * Best model is chosen server-side; clients just learn whether AI is ready.
 */
export async function GET() {
  if (!geminiConfigured()) {
    return Response.json(
      {
        configured: false,
        ok: false,
        ready: false,
        selection: "server-auto",
        message: "Set GEMINI_API_KEY on the host (never in the browser).",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const resolved = await resolveBestModel();

  return Response.json(
    {
      configured: true,
      ok: resolved.ok,
      ready: resolved.ok || Boolean(resolved.model),
      selection: "server-auto",
      // Single selected model only — no catalog list for clients to pick from.
      model: resolved.model,
      reason: resolved.reason,
      source: resolved.source,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
