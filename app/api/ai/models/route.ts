import { geminiConfigured, listGeminiModels, pickBestModel, resolveBestModel } from "@/lib/gemini";

export const runtime = "nodejs";

export async function GET() {
  if (!geminiConfigured()) {
    return Response.json(
      {
        configured: false,
        ok: false,
        message: "Set GEMINI_API_KEY (or GOOGLE_API_KEY / MODEL_PROVIDER_API_KEY)",
        preferredOrder: [
          "gemini-2.5-pro",
          "gemini-2.5-flash",
          "gemini-2.0-flash",
          "gemini-1.5-pro",
        ],
      },
      { status: 503 },
    );
  }

  const resolved = await resolveBestModel();
  const listed = await listGeminiModels();
  const best = listed.ok ? pickBestModel(listed.models) : resolved.model;

  return Response.json(
    {
      configured: true,
      ok: listed.ok,
      status: listed.status,
      bestModel: best,
      source: resolved.source,
      override: process.env.GEMINI_MODEL || null,
      models: listed.models
        .filter((model) => {
          const methods = model.supportedGenerationMethods || [];
          return methods.length === 0 || methods.includes("generateContent");
        })
        .slice(0, 40)
        .map((model) => ({
          name: model.name,
          displayName: model.displayName,
          inputTokenLimit: model.inputTokenLimit,
          outputTokenLimit: model.outputTokenLimit,
        })),
      error: listed.error,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
