"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/app/components/AppShell";

type ModelsResponse = {
  configured: boolean;
  ok?: boolean;
  bestModel?: string;
  models?: Array<{ name: string; displayName?: string }>;
  error?: unknown;
  message?: string;
};

export default function AiAgentPage() {
  const [models, setModels] = useState<ModelsResponse | null>(null);
  const [role, setRole] = useState<"triage" | "maker" | "reviewer">("maker");
  const [prompt, setPrompt] = useState(
    "Issue: Viewer can approve a release though role should be read-only. Propose the smallest fix and the TestSprite checks that must pass on the live URL.",
  );
  const [output, setOutput] = useState<string>("");
  const [meta, setMeta] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [iterateOut, setIterateOut] = useState<string>("");

  const loadModels = useCallback(() => {
    fetch("/api/ai/models")
      .then(async (response) => setModels(await response.json()))
      .catch(() => setModels({ configured: false, message: "unreachable" }));
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  async function runAgent() {
    setBusy(true);
    setOutput("");
    setMeta("");
    try {
      const response = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          prompt,
          context: {
            repo: "SahilRakhaiya05/proofsmith",
            appUrl: window.location.origin,
          },
        }),
      });
      const body = (await response.json()) as {
        ok?: boolean;
        text?: string;
        model?: string;
        error?: unknown;
        checkerNext?: string;
      };
      setMeta(
        response.ok
          ? `model=${body.model} · role=${role} · merge=never · ${body.checkerNext || ""}`
          : `error HTTP ${response.status}: ${JSON.stringify(body.error || body).slice(0, 240)}`,
      );
      setOutput(body.text || JSON.stringify(body, null, 2));
    } catch (error) {
      setMeta(error instanceof Error ? error.message : "agent_failed");
    } finally {
      setBusy(false);
    }
  }

  async function runIterate() {
    setBusy(true);
    setIterateOut("");
    try {
      const response = await fetch("/api/loop/iterate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Viewer approval bypass",
          problem:
            "A Viewer can approve a release even though the role should be read-only. State must not change; no approval audit event.",
          repo: "SahilRakhaiya05/proofsmith",
        }),
      });
      const body = await response.json();
      setIterateOut(JSON.stringify(body, null, 2));
    } catch (error) {
      setIterateOut(error instanceof Error ? error.message : "iterate_failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      title="AI agents · Google Gemini"
      subtitle="Maker / triage / reviewer run on Gemini. Best model is selected from the live API. Checker remains TestSprite on the live URL — agents never self-approve."
    >
      <section className="metric-grid" aria-label="Gemini status">
        <article className="metric-card">
          <span className="muted">Provider</span>
          <strong>Google Gemini</strong>
          <span className={`pill ${models?.configured ? "pill-ok" : "pill-warn"}`}>
            {models?.configured ? "key set" : "missing key"}
          </span>
        </article>
        <article className="metric-card">
          <span className="muted">Best model</span>
          <strong>{models?.bestModel || "—"}</strong>
          <span className="pill pill-sim">{models?.ok ? "from API" : "pending"}</span>
        </article>
        <article className="metric-card">
          <span className="muted">Models listed</span>
          <strong>{models?.models?.length ?? 0}</strong>
          <button type="button" className="text-button" onClick={loadModels}>
            Refresh
          </button>
        </article>
        <article className="metric-card">
          <span className="muted">Merge authority</span>
          <strong>Human only</strong>
          <span className="pill pill-ok">never auto-merge</span>
        </article>
      </section>

      <section className="panel-grid">
        <div className="panel">
          <div className="panel-head">
            <h2>Run agent</h2>
          </div>
          <div className="inline-form" style={{ marginBottom: "1rem" }}>
            <label>
              Role
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as typeof role)}
                style={{ border: "1px solid #171713", padding: "0.7rem", minWidth: 160 }}
              >
                <option value="triage">Triage</option>
                <option value="maker">Maker (write/fix)</option>
                <option value="reviewer">Reviewer</option>
              </select>
            </label>
          </div>
          <label className="block-label">
            Prompt
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={8}
              className="agent-textarea"
            />
          </label>
          <div className="action-row" style={{ marginTop: "1rem" }}>
            <button type="button" className="primary-cta" disabled={busy} onClick={runAgent}>
              {busy ? "Running…" : "Run Gemini agent"}
            </button>
            <button type="button" className="secondary-cta" disabled={busy} onClick={runIterate}>
              Full iterate (maker + checker readiness)
            </button>
          </div>
          {meta ? <p className="feedback">{meta}</p> : null}
          {output ? <pre className="json-block agent-out">{output}</pre> : null}
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Available models</h2>
            <a href="/api/ai/models" target="_blank" rel="noreferrer">
              JSON ↗
            </a>
          </div>
          {!models?.configured ? (
            <p className="panel-empty">Set GEMINI_API_KEY on Vercel / .env.local (never commit).</p>
          ) : (
            <ul className="data-list">
              {(models.models || []).slice(0, 18).map((model) => (
                <li key={model.name}>
                  <strong>
                    {model.name}
                    {model.name === models.bestModel ? " · BEST" : ""}
                  </strong>
                  <span>{model.displayName || "generateContent"}</span>
                </li>
              ))}
            </ul>
          )}
          {models?.error ? (
            <p className="feedback">API: {JSON.stringify(models.error).slice(0, 280)}</p>
          ) : null}
          {iterateOut ? (
            <>
              <h3 className="evidence-title" style={{ marginTop: "1.2rem" }}>
                Iterate result
              </h3>
              <pre className="json-block">{iterateOut}</pre>
            </>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
