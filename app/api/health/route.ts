export async function GET() {
  return Response.json({
    product: "Proofsmith",
    status: "ready",
    mode: "simulation-until-external-evidence-exists",
    integrations: {
      githubOAuth: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET && process.env.SESSION_SECRET),
      githubWebhook: Boolean(process.env.GITHUB_WEBHOOK_SECRET),
      githubWorker: Boolean(process.env.PROOFSMITH_GITHUB_TOKEN),
      testSprite: Boolean(process.env.TESTSPRITE_API_KEY),
    },
    timestamp: new Date().toISOString(),
  }, { headers: { "Cache-Control": "no-store" } });
}
