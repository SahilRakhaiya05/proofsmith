/** Public runtime config — never expose secret values. */

export function publicAppUrl(request?: Request): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.PROOFSMITH_PRODUCTION_URL) {
    return process.env.PROOFSMITH_PRODUCTION_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;
  }
  if (request) return new URL(request.url).origin;
  return "http://localhost:3000";
}

export function integrationFlags() {
  return {
    githubOAuth: Boolean(
      process.env.GITHUB_CLIENT_ID &&
        process.env.GITHUB_CLIENT_SECRET &&
        process.env.SESSION_SECRET,
    ),
    githubWebhook: Boolean(process.env.GITHUB_WEBHOOK_SECRET),
    githubWorker: Boolean(process.env.PROOFSMITH_GITHUB_TOKEN),
    testSprite: Boolean(process.env.TESTSPRITE_API_KEY),
    testSpriteProject: Boolean(process.env.TESTSPRITE_PROJECT_ID),
    e2b: Boolean(process.env.E2B_API_KEY),
    modelProvider: Boolean(process.env.MODEL_PROVIDER_API_KEY),
    appUrl: Boolean(
      process.env.APP_URL || process.env.PROOFSMITH_PRODUCTION_URL || process.env.VERCEL_URL,
    ),
  };
}

export function testspriteBaseUrl() {
  const raw = (process.env.TESTSPRITE_API_URL || "https://api.testsprite.com").replace(/\/$/, "");
  return raw.endsWith("/api/cli/v1") ? raw : `${raw}/api/cli/v1`;
}
