/** Public runtime config — never expose secret values. */

import { geminiConfigured } from "@/lib/gemini";

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
  const gemini = geminiConfigured();
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
    gemini,
    modelProvider: gemini || Boolean(process.env.MODEL_PROVIDER_API_KEY),
    appUrl: Boolean(
      process.env.APP_URL || process.env.PROOFSMITH_PRODUCTION_URL || process.env.VERCEL_URL,
    ),
  };
}

export function testspriteBaseUrl() {
  const raw = (process.env.TESTSPRITE_API_URL || "https://api.testsprite.com").replace(/\/$/, "");
  return raw.endsWith("/api/cli/v1") ? raw : `${raw}/api/cli/v1`;
}

/** Public-safe env checklist for settings UI (booleans only). */
export function envChecklist() {
  const flags = integrationFlags();
  return [
    { key: "APP_URL", set: flags.appUrl, required: true, purpose: "Public production origin for OAuth + TestSprite target" },
    { key: "GITHUB_CLIENT_ID", set: Boolean(process.env.GITHUB_CLIENT_ID), required: true, purpose: "GitHub OAuth app id" },
    { key: "GITHUB_CLIENT_SECRET", set: Boolean(process.env.GITHUB_CLIENT_SECRET), required: true, purpose: "GitHub OAuth secret" },
    { key: "SESSION_SECRET", set: Boolean(process.env.SESSION_SECRET), required: true, purpose: "AES-GCM session encryption (≥32 chars)" },
    { key: "GITHUB_WEBHOOK_SECRET", set: Boolean(process.env.GITHUB_WEBHOOK_SECRET), required: false, purpose: "HMAC for /api/github/webhook" },
    { key: "PROOFSMITH_GITHUB_TOKEN", set: Boolean(process.env.PROOFSMITH_GITHUB_TOKEN), required: false, purpose: "Worker token for sticky comments / dispatch" },
    { key: "TESTSPRITE_API_KEY", set: flags.testSprite, required: true, purpose: "Independent checker cloud API" },
    { key: "TESTSPRITE_PROJECT_ID", set: flags.testSpriteProject, required: false, purpose: "Default TestSprite project" },
    { key: "E2B_API_KEY", set: flags.e2b, required: false, purpose: "Isolated maker sandboxes" },
    { key: "GEMINI_API_KEY", set: flags.gemini, required: true, purpose: "Google Gemini for maker/reviewer agents" },
    { key: "GEMINI_MODEL", set: Boolean(process.env.GEMINI_MODEL), required: false, purpose: "Optional model override (auto-picks best if unset)" },
  ];
}
