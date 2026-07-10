"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/app/components/AppShell";

type Health = {
  appUrl: string;
  mode: string;
  integrations: Record<string, boolean>;
  endpoints: Record<string, string>;
  timestamp: string;
};

export default function SettingsPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [ts, setTs] = useState<unknown>(null);
  const [e2b, setE2b] = useState<unknown>(null);

  useEffect(() => {
    fetch("/api/health")
      .then(async (response) => setHealth(await response.json()))
      .catch(() => setHealth(null));
    fetch("/api/testsprite/status")
      .then(async (response) => setTs(await response.json()))
      .catch(() => setTs({ error: "unreachable" }));
    fetch("/api/e2b/status")
      .then(async (response) => setE2b(await response.json()))
      .catch(() => setE2b({ error: "unreachable" }));
  }, []);

  return (
    <AppShell
      title="Settings & runtime"
      subtitle="Configuration flags only. Secret values are never rendered in the browser."
    >
      <section className="panel-grid">
        <div className="panel">
          <div className="panel-head">
            <h2>Environment flags</h2>
          </div>
          {health ? (
            <ul className="flag-list">
              {Object.entries(health.integrations).map(([key, value]) => (
                <li key={key}>
                  <code>{key}</code>
                  <span className={`pill ${value ? "pill-ok" : "pill-warn"}`}>{value ? "set" : "missing"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="panel-empty">Loading…</p>
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Public endpoints</h2>
          </div>
          {health ? (
            <ul className="data-list">
              {Object.entries(health.endpoints).map(([key, value]) => (
                <li key={key}>
                  <strong>{key}</strong>
                  <code className="wrap">{value}</code>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="panel-note">
            Set GitHub OAuth callback to the deployed <code>/api/auth/github/callback</code> URL. On Vercel set{" "}
            <code>APP_URL</code> to your production domain.
          </p>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>TestSprite probe</h2>
          </div>
          <pre className="json-block">{JSON.stringify(ts, null, 2)}</pre>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>E2B probe</h2>
          </div>
          <pre className="json-block">{JSON.stringify(e2b, null, 2)}</pre>
        </div>
      </section>
    </AppShell>
  );
}
