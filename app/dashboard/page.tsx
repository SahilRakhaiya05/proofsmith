"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/app/components/AppShell";

type Summary = {
  appUrl: string;
  integrations: Record<string, boolean>;
  github: {
    authenticated: boolean;
    login?: string;
    avatarUrl?: string;
    profile?: { publicRepos?: number; followers?: number; plan?: string } | null;
    repos?: Array<{
      fullName: string;
      url: string;
      private: boolean;
      language: string | null;
      openIssues: number;
      updatedAt: string;
      description: string | null;
    }>;
  };
  testsprite: {
    configured: boolean;
    ok: boolean;
    status: number;
    projectId: string | null;
    plans: Array<{ name: string; file: string; priority: string }>;
  };
  e2b: { configured: boolean; ok: boolean; endpoint: string | null };
  agents: { total: number; ready: number; gated: number };
  loops: {
    total: number;
    byState: Record<string, number>;
    recent: Array<{ id: string; title: string; state: string; issueNumber: number; repo: string }>;
  };
  timestamp: string;
};

function Pill({ ok, label }: { ok: boolean; label: string }) {
  return <span className={`pill ${ok ? "pill-ok" : "pill-warn"}`}>{label}</span>;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sandboxMsg, setSandboxMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    fetch("/api/dashboard/summary", { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`summary_${response.status}`);
        setSummary(await response.json());
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 30_000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function createSandbox() {
    setBusy(true);
    setSandboxMsg(null);
    try {
      const response = await fetch("/api/e2b/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata: { source: "dashboard" } }),
      });
      const body = (await response.json()) as { sandbox?: unknown; error?: string };
      setSandboxMsg(
        response.ok
          ? `Sandbox created: ${JSON.stringify(body.sandbox).slice(0, 180)}`
          : `E2B error ${response.status}: ${JSON.stringify(body).slice(0, 180)}`,
      );
    } catch (err) {
      setSandboxMsg(err instanceof Error ? err.message : "sandbox_failed");
    } finally {
      setBusy(false);
      load();
    }
  }

  async function createLoopFromRepo() {
    if (!summary?.github.authenticated) {
      window.location.href = "/api/auth/github";
      return;
    }
    const repo = summary.github.repos?.[0];
    setBusy(true);
    try {
      await fetch("/api/loop/runs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueNumber: Math.floor(Math.random() * 80) + 10,
          title: "Dashboard-started loop: verify production gates",
          repo: repo?.fullName || "SahilRakhaiya05/proofsmith",
        }),
      });
      load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      title="Operations dashboard"
      subtitle="Live GitHub identity, TestSprite cloud probe, E2B sandbox status, agents, and loop runs — no secret values are shown."
    >
      {error ? <p className="feedback">Failed to load dashboard: {error}</p> : null}
      {!summary ? <p className="muted-block">Loading live summary…</p> : null}

      {summary ? (
        <>
          <section className="metric-grid" aria-label="Integration status">
            <article className="metric-card">
              <span className="muted">GitHub OAuth</span>
              <strong>{summary.github.authenticated ? `@${summary.github.login}` : "Not connected"}</strong>
              <Pill ok={summary.integrations.githubOAuth} label={summary.integrations.githubOAuth ? "configured" : "missing secrets"} />
            </article>
            <article className="metric-card">
              <span className="muted">TestSprite</span>
              <strong>{summary.testsprite.ok ? "API reachable" : summary.testsprite.configured ? "Probe failed" : "Not configured"}</strong>
              <Pill ok={summary.testsprite.ok} label={summary.testsprite.configured ? `HTTP ${summary.testsprite.status}` : "no key"} />
            </article>
            <article className="metric-card">
              <span className="muted">E2B sandboxes</span>
              <strong>{summary.e2b.ok ? "API reachable" : summary.e2b.configured ? "Probe failed" : "Not configured"}</strong>
              <Pill ok={summary.e2b.ok} label={summary.e2b.configured ? "key set" : "no key"} />
            </article>
            <article className="metric-card">
              <span className="muted">Agents / loops</span>
              <strong>
                {summary.agents.ready}/{summary.agents.total} ready · {summary.loops.total} runs
              </strong>
              <Pill ok={summary.agents.ready > 0} label={`${summary.agents.gated} gated`} />
            </article>
          </section>

          <section className="panel-grid">
            <div className="panel">
              <div className="panel-head">
                <h2>GitHub repositories</h2>
                {!summary.github.authenticated ? (
                  <a href="/api/auth/github">Connect ↗</a>
                ) : (
                  <button type="button" className="text-button" onClick={load}>
                    Refresh
                  </button>
                )}
              </div>
              {!summary.github.authenticated ? (
                <p className="panel-empty">Connect GitHub to load your real repositories, issues, and pull requests.</p>
              ) : (
                <ul className="data-list">
                  {(summary.github.repos || []).map((repo) => (
                    <li key={repo.fullName}>
                      <a href={repo.url} target="_blank" rel="noreferrer">
                        {repo.fullName}
                      </a>
                      <span>
                        {repo.private ? "private" : "public"} · {repo.language || "n/a"} · {repo.openIssues} open issues
                      </span>
                      <small>{repo.description || "No description"}</small>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="panel">
              <div className="panel-head">
                <h2>Recent loops</h2>
                <button type="button" className="text-button" disabled={busy} onClick={createLoopFromRepo}>
                  Start loop
                </button>
              </div>
              <ul className="data-list">
                {summary.loops.recent.map((run) => (
                  <li key={run.id}>
                    <Link href={`/loops#${run.id}`}>
                      #{run.issueNumber} · {run.title}
                    </Link>
                    <span>
                      {run.state} · {run.repo}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="panel">
              <div className="panel-head">
                <h2>TestSprite plans</h2>
                <Link href="/integrations">Wire cloud ↗</Link>
              </div>
              <ul className="data-list">
                {summary.testsprite.plans.map((plan) => (
                  <li key={plan.file}>
                    <strong>{plan.name}</strong>
                    <span>
                      {plan.priority} · {plan.file}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="panel-note">
                Project: <code>{summary.testsprite.projectId || "set TESTSPRITE_PROJECT_ID"}</code>
              </p>
            </div>

            <div className="panel">
              <div className="panel-head">
                <h2>E2B maker sandbox</h2>
                <button type="button" className="text-button" disabled={busy || !summary.e2b.configured} onClick={createSandbox}>
                  {busy ? "Working…" : "Create sandbox"}
                </button>
              </div>
              <p className="panel-empty">
                Isolated maker worktrees run in E2B. Endpoint: <code>{summary.e2b.endpoint || "unset"}</code>
              </p>
              {sandboxMsg ? <p className="feedback">{sandboxMsg}</p> : null}
            </div>
          </section>

          <p className="timestamp-line">
            App URL <code>{summary.appUrl}</code> · refreshed {new Date(summary.timestamp).toLocaleString()}
          </p>
        </>
      ) : null}
    </AppShell>
  );
}
