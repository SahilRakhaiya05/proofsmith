import { envChecklist, integrationFlags, publicAppUrl } from "@/lib/config";

export async function GET(request: Request) {
  const flags = integrationFlags();
  const checklist = envChecklist();
  const requiredMissing = checklist.filter((item) => item.required && !item.set).map((item) => item.key);

  return Response.json(
    {
      product: "Proofsmith",
      status: requiredMissing.length === 0 ? "ready" : "degraded",
      version: "0.3.0",
      appUrl: publicAppUrl(request),
      mode:
        flags.githubOAuth && flags.testSprite && flags.gemini
          ? "maker-checker-configured"
          : "awaiting-secrets",
      integrations: flags,
      env: checklist.map(({ key, set, required, purpose }) => ({ key, set, required, purpose })),
      requiredMissing,
      endpoints: {
        oauthCallback: `${publicAppUrl(request)}/api/auth/github/callback`,
        webhook: `${publicAppUrl(request)}/api/github/webhook`,
        health: `${publicAppUrl(request)}/api/health`,
        dashboard: `${publicAppUrl(request)}/dashboard`,
        aiAgent: `${publicAppUrl(request)}/api/ai/agent`,
        aiModels: `${publicAppUrl(request)}/api/ai/models`,
        loopIterate: `${publicAppUrl(request)}/api/loop/iterate`,
      },
      fourSteps: ["write-maker", "verify-testsprite", "fix-maker", "verify-again-testsprite"],
      timestamp: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
