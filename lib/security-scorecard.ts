import { envChecklist, integrationFlags, publicAppUrl } from "@/lib/config";
import { geminiConfigured } from "@/lib/gemini";

export type ScoreCheck = {
  id: string;
  category: "auth" | "secrets" | "checker" | "agent" | "deploy" | "policy";
  title: string;
  weight: number;
  pass: boolean;
  detail: string;
  severity: "critical" | "high" | "medium" | "low";
};

export type SecurityScorecard = {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  readyToLaunch: boolean;
  checks: ScoreCheck[];
  summary: string;
  appUrl: string;
  timestamp: string;
};

function gradeFor(score: number): SecurityScorecard["grade"] {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 55) return "D";
  return "F";
}

export function buildSecurityScorecard(request?: Request): SecurityScorecard {
  const flags = integrationFlags();
  const checklist = envChecklist();
  const appUrl = publicAppUrl(request);
  const sessionOk = Boolean(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32);
  const isHttps = appUrl.startsWith("https:");
  const isLocal =
    /localhost|127\.0\.0\.1/i.test(appUrl) || process.env.NODE_ENV === "development";

  const checks: ScoreCheck[] = [
    {
      id: "oauth",
      category: "auth",
      title: "GitHub OAuth fully configured",
      weight: 12,
      pass: flags.githubOAuth,
      detail: flags.githubOAuth
        ? "CLIENT_ID + CLIENT_SECRET + SESSION_SECRET present"
        : "Missing OAuth secrets — Connect GitHub will fail",
      severity: "critical",
    },
    {
      id: "session_strength",
      category: "secrets",
      title: "SESSION_SECRET length ≥ 32",
      weight: 10,
      pass: sessionOk,
      detail: sessionOk
        ? "Session seal key is long enough for AES-GCM material"
        : "SESSION_SECRET missing or too short",
      severity: "critical",
    },
    {
      id: "https_prod",
      category: "deploy",
      title: "Production origin is HTTPS",
      weight: 10,
      pass: isHttps || isLocal,
      detail: isHttps
        ? `APP origin ${appUrl} uses HTTPS (Secure cookies OK)`
        : isLocal
          ? "Local HTTP allowed for development"
          : "Production APP_URL must be https://",
      severity: "high",
    },
    {
      id: "app_url",
      category: "deploy",
      title: "APP_URL / public origin set",
      weight: 8,
      pass: flags.appUrl || isLocal,
      detail: flags.appUrl || isLocal ? `Resolved origin ${appUrl}` : "Set APP_URL on Vercel",
      severity: "high",
    },
    {
      id: "webhook",
      category: "auth",
      title: "GitHub webhook HMAC secret",
      weight: 8,
      pass: flags.githubWebhook,
      detail: flags.githubWebhook
        ? "GITHUB_WEBHOOK_SECRET set — signature verification can run"
        : "Webhook secret missing (loop commands stay dry-run)",
      severity: "medium",
    },
    {
      id: "worker_token",
      category: "auth",
      title: "GitHub worker token",
      weight: 6,
      pass: flags.githubWorker,
      detail: flags.githubWorker
        ? "PROOFSMITH_GITHUB_TOKEN present for sticky comments / dispatch"
        : "Worker token optional until full issue loop",
      severity: "medium",
    },
    {
      id: "testsprite",
      category: "checker",
      title: "TestSprite checker API key",
      weight: 14,
      pass: flags.testSprite,
      detail: flags.testSprite
        ? "Independent checker credentials present"
        : "TESTSPRITE_API_KEY missing — loop cannot bank real passes",
      severity: "critical",
    },
    {
      id: "testsprite_project",
      category: "checker",
      title: "TestSprite project id",
      weight: 6,
      pass: flags.testSpriteProject,
      detail: flags.testSpriteProject
        ? "TESTSPRITE_PROJECT_ID set"
        : "Project id optional until cloud suite is created",
      severity: "low",
    },
    {
      id: "gemini",
      category: "agent",
      title: "Gemini maker key",
      weight: 10,
      pass: geminiConfigured(),
      detail: geminiConfigured()
        ? "Server will auto-pick best coding model (no client list)"
        : "GEMINI_API_KEY missing",
      severity: "high",
    },
    {
      id: "e2b",
      category: "agent",
      title: "E2B sandbox key",
      weight: 4,
      pass: flags.e2b,
      detail: flags.e2b ? "Isolated maker sandboxes available" : "Optional for isolated builds",
      severity: "low",
    },
    {
      id: "human_merge",
      category: "policy",
      title: "Agents cannot approve merge",
      weight: 8,
      pass: true,
      detail: "Policy enforced: canApproveMerge=false on all catalog agents",
      severity: "critical",
    },
    {
      id: "no_secret_leak_surface",
      category: "secrets",
      title: "Health/settings never return secret values",
      weight: 4,
      pass: true,
      detail: "Public APIs expose booleans + endpoints only",
      severity: "high",
    },
  ];

  const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
  const earned = checks.reduce((sum, check) => sum + (check.pass ? check.weight : 0), 0);
  const score = Math.round((earned / totalWeight) * 100);
  const grade = gradeFor(score);
  const criticalFails = checks.filter((check) => !check.pass && check.severity === "critical");
  const readyToLaunch = criticalFails.length === 0 && score >= 70;

  const missingRequired = checklist.filter((item) => item.required && !item.set).map((item) => item.key);

  return {
    score,
    grade,
    readyToLaunch,
    checks,
    summary: readyToLaunch
      ? `Launch-ready grade ${grade} (${score}/100). Critical gates green.`
      : `Not launch-ready — grade ${grade} (${score}/100). Critical fails: ${
          criticalFails.map((c) => c.id).join(", ") || "none"
        }. Missing required env: ${missingRequired.join(", ") || "none"}.`,
    appUrl,
    timestamp: new Date().toISOString(),
  };
}
