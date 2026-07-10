"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/app/components/AppShell";

type Health = {
  appUrl: string;
  endpoints: { oauthCallback: string; webhook: string; health: string; dashboard: string };
  integrations: Record<string, boolean>;
};

export default function IntegrationsPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [ts, setTs] = useState<{ ok?: boolean; configured?: boolean; cli?: string; docs?: string } | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then(async (response) => setHealth(await response.json()))
      .catch(() => setHealth(null));
    fetch("/api/testsprite/status")
      .then(async (response) => setTs(await response.json()))
      .catch(() => setTs(null));
  }, []);

  const oauth = health?.endpoints.oauthCallback || "https://YOUR_VERCEL_URL/api/auth/github/callback";
  const webhook = health?.endpoints.webhook || "https://YOUR_VERCEL_URL/api/github/webhook";

  return (
    <AppShell
      title="Live integrations"
      subtitle="Wire GitHub OAuth, signed webhooks, TestSprite cloud, and E2B sandboxes. Credentials stay in host env vars."
    >
      <div className="integration-list web-list">
        <article>
          <span>01</span>
          <div>
            <h2>GitHub OAuth (identity)</h2>
            <p>
              Real collaborator login via GitHub OAuth. Register this callback on your GitHub OAuth App, then connect.
            </p>
            <code>{oauth}</code>
            <div className="action-row">
              <a className="primary-cta" href="/api/auth/github">
                Connect GitHub ↗
              </a>
              <Link className="secondary-cta" href="/dashboard">
                Open dashboard
              </Link>
            </div>
            <p className="panel-note">
              Status:{" "}
              <strong>{health?.integrations.githubOAuth ? "client id/secret/session configured" : "missing secrets"}</strong>
            </p>
          </div>
        </article>

        <article>
          <span>02</span>
          <div>
            <h2>GitHub App / webhook worker</h2>
            <p>
              Point the signed webhook at the deployed endpoint. Handler validates HMAC, delivery ID, command grammar,
              and trusted author association before posting the sticky contract.
            </p>
            <code>{webhook}</code>
            <p className="panel-note">
              Commands: <code>/proofsmith start|status|verify|repair|review|…</code>
            </p>
          </div>
        </article>

        <article>
          <span>03</span>
          <div>
            <h2>TestSprite cloud verification</h2>
            <p>
              Official CLI package{" "}
              <a href="https://github.com/TestSprite/testsprite-cli" target="_blank" rel="noreferrer">
                @testsprite/testsprite-cli
              </a>{" "}
              plus live facade probes under <code>/api/testsprite/*</code>.
            </p>
            <code>TESTSPRITE_API_KEY · TESTSPRITE_PROJECT_ID · TESTSPRITE_CRITICAL_TEST_IDS</code>
            <p className="panel-note">
              Probe:{" "}
              <strong>
                {ts?.configured ? (ts.ok ? "API key accepted / projects reachable" : "configured but probe failed") : "key missing"}
              </strong>{" "}
              · CLI {ts?.cli || "@testsprite/testsprite-cli"}
            </p>
            <a href="/api/testsprite/status">Open TestSprite status JSON ↗</a>
          </div>
        </article>

        <article>
          <span>04</span>
          <div>
            <h2>E2B isolated maker sandboxes</h2>
            <p>Maker agents build in disposable sandboxes. Configure <code>E2B_API_KEY</code> on Vercel.</p>
            <code>E2B_API_KEY · optional E2B_TEMPLATE_ID</code>
            <a href="/api/e2b/status">Open E2B status JSON ↗</a>
          </div>
        </article>

        <article>
          <span>05</span>
          <div>
            <h2>Vercel production</h2>
            <p>
              Deploy this repo to Vercel, set env vars (never commit secrets), set <code>APP_URL</code> to the Vercel
              domain, and update the GitHub OAuth callback to match.
            </p>
            <code>APP_URL=https://your-app.vercel.app</code>
            <Link href="/settings">Runtime settings ↗</Link>
          </div>
        </article>
      </div>
    </AppShell>
  );
}
