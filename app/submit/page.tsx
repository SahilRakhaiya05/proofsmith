"use client";

import Link from "next/link";
import { AppShell } from "@/app/components/AppShell";

const discord = `**Proofsmith** — Issue in. Verified PR out.
Repo: https://github.com/SahilRakhaiya05/proofsmith
Live: <paste Vercel URL>
LOOP.md: https://github.com/SahilRakhaiya05/proofsmith/blob/main/LOOP.md
Maker: Google Gemini (server auto-selects best coding model)
Checker: TestSprite CLI against live APP_URL
One-click pre-launch: /launch · Security scorecard: /security
Four steps: Write → Verify → Fix → Verify again`;

export default function SubmitPage() {
  return (
    <AppShell
      title="Judge / submission pack"
      subtitle="What Season 3 winners put in front of judges: live URL, LOOP.md, checker evidence, and an honest readiness story."
    >
      <section className="submit-grid">
        <article className="panel">
          <div className="panel-head">
            <h2>01 // Repo proof</h2>
          </div>
          <ul className="data-list">
            <li>
              <strong>Source</strong>
              <a href="https://github.com/SahilRakhaiya05/proofsmith" target="_blank" rel="noreferrer">
                github.com/SahilRakhaiya05/proofsmith
              </a>
            </li>
            <li>
              <strong>LOOP.md</strong>
              <a href="https://github.com/SahilRakhaiya05/proofsmith/blob/main/LOOP.md" target="_blank" rel="noreferrer">
                Agent-written iterations
              </a>
            </li>
            <li>
              <strong>README</strong>
              <span>Live URL · four steps · env · deploy</span>
            </li>
            <li>
              <strong>SUBMISSION.md</strong>
              <a href="https://github.com/SahilRakhaiya05/proofsmith/blob/main/SUBMISSION.md" target="_blank" rel="noreferrer">
                Discord paste + checklist
              </a>
            </li>
          </ul>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h2>02 // Live product</h2>
          </div>
          <ul className="data-list">
            <li>
              <Link href="/launch">
                <strong>One-click pre-launch</strong>
              </Link>
              <span>Security + integration preflight</span>
            </li>
            <li>
              <Link href="/security">
                <strong>Security scorecard</strong>
              </Link>
              <span>Grade A–F · critical gates</span>
            </li>
            <li>
              <Link href="/ai">
                <strong>Gemini maker chat</strong>
              </Link>
              <span>Server picks best model — no client list</span>
            </li>
            <li>
              <Link href="/dashboard">
                <strong>Dashboard</strong>
              </Link>
              <span>GitHub · TestSprite · E2B · Gemini</span>
            </li>
          </ul>
        </article>
      </section>

      <section className="panel" style={{ marginTop: "1rem" }}>
        <div className="panel-head">
          <h2>Discord registration blurb</h2>
        </div>
        <pre className="json-block agent-out">{discord}</pre>
        <p className="panel-note">
          Replace <code>&lt;paste Vercel URL&gt;</code> after deploy. Both repo + Discord entry
          must land before the deadline (same rule as LoopLens / Ouroboros / LoopLedger).
        </p>
      </section>

      <section className="panel" style={{ marginTop: "1rem" }}>
        <div className="panel-head">
          <h2>Differentiation vs field</h2>
        </div>
        <ul className="diff-list">
          <li>
            <strong>vs LoopLens / LoopLedger</strong>
            <span>They package evidence UI. Proofsmith is a full GitHub-native loop product + scorecard + Gemini maker.</span>
          </li>
          <li>
            <strong>vs Ouroboros</strong>
            <span>They render the loop as content. We add signed webhook, OAuth, E2B, and security preflight.</span>
          </li>
          <li>
            <strong>vs NEXUS IDE entries</strong>
            <span>We stay honest about checker: TestSprite only banks on live APP_URL; makers never self-grade.</span>
          </li>
        </ul>
      </section>
    </AppShell>
  );
}
