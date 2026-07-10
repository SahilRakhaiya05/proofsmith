"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/app/components/AppShell";

type LaunchResult = {
  ready: boolean;
  appUrl: string;
  scorecard: { score: number; grade: string; readyToLaunch: boolean; summary: string };
  steps: Array<{ id: string; title: string; ok: boolean; detail: string }>;
  next: { open?: string[]; checker?: string; human: string };
};

export default function LaunchPage() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<LaunchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function launch() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/launch", { method: "POST" });
      const body = (await response.json()) as LaunchResult;
      setResult(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "launch_failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      title="One-click pre-launch"
      subtitle="Run security scorecard + GitHub / Gemini / TestSprite / E2B probes in one shot. Secrets never leave the server."
    >
      <section className="launch-hero panel">
        <div>
          <p className="eyebrow">Final submission gate</p>
          <h2 className="launch-title">Launch readiness in one click.</h2>
          <p className="panel-empty">
            Matches what top Season 3 entries show judges: not just a product shell, but a
            preflight that proves auth, checker, and maker wiring before you claim a loop.
          </p>
        </div>
        <button type="button" className="primary-cta launch-cta" disabled={busy} onClick={launch}>
          {busy ? "Running preflight…" : "Run pre-launch now"}
        </button>
      </section>

      {error ? <p className="feedback">{error}</p> : null}

      {result ? (
        <>
          <section className="metric-grid">
            <article className="metric-card">
              <span className="muted">Ready</span>
              <strong>{result.ready ? "YES" : "NOT YET"}</strong>
              <span className={`pill ${result.ready ? "pill-ok" : "pill-warn"}`}>
                {result.scorecard.grade} · {result.scorecard.score}
              </span>
            </article>
            <article className="metric-card">
              <span className="muted">Target URL</span>
              <strong style={{ fontSize: 13 }}>{result.appUrl}</strong>
              <Link href="/security" className="text-button">
                Full scorecard →
              </Link>
            </article>
          </section>

          <p className="feedback">{result.scorecard.summary}</p>

          <ul className="score-list">
            {result.steps.map((step) => (
              <li key={step.id} className={step.ok ? "pass" : "fail"}>
                <div className="score-list-top">
                  <span className={`pill ${step.ok ? "pill-ok" : "pill-danger"}`}>
                    {step.ok ? "ok" : "gap"}
                  </span>
                  <strong>{step.title}</strong>
                </div>
                <p>{step.detail}</p>
              </li>
            ))}
          </ul>

          <section className="panel" style={{ marginTop: "1rem" }}>
            <div className="panel-head">
              <h2>Next human actions</h2>
            </div>
            <p>{result.next.human}</p>
            {result.next.checker ? (
              <code className="wrap" style={{ display: "block", marginTop: "1rem" }}>
                {result.next.checker}
              </code>
            ) : null}
            <div className="action-row" style={{ marginTop: "1rem" }}>
              {(result.next.open || []).map((href) => (
                <Link key={href} href={href} className="secondary-cta">
                  {href}
                </Link>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </AppShell>
  );
}
