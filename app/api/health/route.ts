import { integrationFlags, publicAppUrl } from "@/lib/config";

export async function GET(request: Request) {
  const flags = integrationFlags();
  return Response.json(
    {
      product: "Proofsmith",
      status: "ready",
      version: "0.2.0",
      appUrl: publicAppUrl(request),
      mode: flags.githubOAuth && flags.testSprite ? "integrations-configured" : "awaiting-secrets",
      integrations: {
        githubOAuth: flags.githubOAuth,
        githubWebhook: flags.githubWebhook,
        githubWorker: flags.githubWorker,
        testSprite: flags.testSprite,
        testSpriteProject: flags.testSpriteProject,
        e2b: flags.e2b,
        modelProvider: flags.modelProvider,
      },
      endpoints: {
        oauthCallback: `${publicAppUrl(request)}/api/auth/github/callback`,
        webhook: `${publicAppUrl(request)}/api/github/webhook`,
        health: `${publicAppUrl(request)}/api/health`,
        dashboard: `${publicAppUrl(request)}/dashboard`,
      },
      timestamp: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
