"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/app/components/AppShell";

type Health = {
  appUrl: string;
  mode: string;
  status: string;
  integrations: Record<string, boolean>;
  endpoints: Record<string, string>;
  env?: Array<{ key: string; set: boolean; required: boolean; purpose: string }>;
  requiredMissing?: string[];
  timestamp: string;
};

export default function SettingsPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [ts, setTs] = useState<unknown>(null);
  const [e2b, setE2b] = useState<unknown>(null);
  const [ai, setAi] = useState<unknown>(null);

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
    fetch("/api/ai/status")
      .then(async (response) => setAi(await response.json()))
      .catch(() => setAi({ error: "unreachable" }));
  }, []);

  return (
    <AppShell
      title="Settings & runtime"
      subtitle="Configuration flags only. Secret values are never rendered in the browser. Set the same keys on Vercel."
    >
      <section className="panel-grid">
        <div className="panel">
          <div className="panel-head">
            <h2>Environment checklist</h2>
            {health ? (
              <span className={`pill ${health.status === "ready" ? "pill-ok" : "pill-warn"}`}>{health.status}</span>
            ) : null}
          </div>
          {health?.env ? (
            <ul className="flag-list">
              {health.env.map((item) => (
                <li key={item.key}>
                  <span>
                    <code>{item.key}</code>
                    {item.required ? " · required" : " · optional"}
                    <small style={{ display: "block", color: "#69685f", marginTop: 4 }}>{item.purpose}</small>
                  </span>
                  <span className={`pill ${item.set ? "pill-ok" : "pill-warn"}`}>{item.set ? "set" : "missing"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="panel-empty">Loading…</p>
          )}
          {health?.requiredMissing?.length ? (
            <p className="feedback">Missing required: {health.requiredMissing.join(", ")}</p>
          ) : null}
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
            GitHub OAuth callback must match <code>{health?.appUrl || "APP_URL"}/api/auth/github/callback</code>.
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

        <div className="panel span-2">
          <div className="panel-head">
            <h2>Gemini AI probe</h2>
            <a href="/ai">Open AI console →</a>
          </div>
          <pre className="json-block">{JSON.stringify(ai, null, 2)}</pre>
        </div>
      </section>
    </AppShell>
  );
}
