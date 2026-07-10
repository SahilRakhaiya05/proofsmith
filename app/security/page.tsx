"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/app/components/AppShell";

type Check = {
  id: string;
  category: string;
  title: string;
  weight: number;
  pass: boolean;
  detail: string;
  severity: string;
};

type Card = {
  score: number;
  grade: string;
  readyToLaunch: boolean;
  checks: Check[];
  summary: string;
  appUrl: string;
  timestamp: string;
};

export default function SecurityPage() {
  const [card, setCard] = useState<Card | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    fetch("/api/security/scorecard")
      .then(async (response) => {
        if (!response.ok) throw new Error(`scorecard_${response.status}`);
        setCard(await response.json());
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppShell
      title="Pre-launch security scorecard"
      subtitle="Hackathon-ready posture checks. Booleans only — no secret values. Critical gates must pass before you claim a live loop."
    >
      {error ? <p className="feedback">Failed: {error}</p> : null}
      {!card ? <p className="muted-block">Scoring…</p> : null}

      {card ? (
        <>
          <section className="metric-grid score-hero" aria-label="Score">
            <article className="metric-card grade-card">
              <span className="muted">Grade</span>
              <strong className="grade-letter">{card.grade}</strong>
              <span className={`pill ${card.readyToLaunch ? "pill-ok" : "pill-warn"}`}>
                {card.readyToLaunch ? "launch ready" : "blocked"}
              </span>
            </article>
            <article className="metric-card">
              <span className="muted">Score</span>
              <strong>{card.score}/100</strong>
              <div className="score-bar">
                <span style={{ width: `${card.score}%` }} />
              </div>
            </article>
            <article className="metric-card">
              <span className="muted">App origin</span>
              <strong style={{ fontSize: 14 }}>{card.appUrl}</strong>
              <button type="button" className="text-button" onClick={load}>
                Rescore
              </button>
            </article>
            <article className="metric-card">
              <span className="muted">One-click launch</span>
              <strong>Preflight</strong>
              <Link href="/launch" className="text-button">
                Open launch →
              </Link>
            </article>
          </section>

          <p className="feedback">{card.summary}</p>

          <section className="panel">
            <div className="panel-head">
              <h2>Checks</h2>
              <span className="muted">{new Date(card.timestamp).toLocaleString()}</span>
            </div>
            <ul className="score-list">
              {card.checks.map((check) => (
                <li key={check.id} className={check.pass ? "pass" : "fail"}>
                  <div className="score-list-top">
                    <span className={`pill ${check.pass ? "pill-ok" : "pill-danger"}`}>
                      {check.pass ? "pass" : "fail"}
                    </span>
                    <strong>{check.title}</strong>
                    <span className="muted">
                      {check.category} · w{check.weight} · {check.severity}
                    </span>
                  </div>
                  <p>{check.detail}</p>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </AppShell>
  );
}
