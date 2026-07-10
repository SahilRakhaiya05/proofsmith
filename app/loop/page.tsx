"use client";

import Link from "next/link";
import { AppShell } from "@/app/components/AppShell";

const steps = [
  {
    n: "01",
    role: "Maker",
    title: "Write",
    body: "Your coding agent ships code — Claude Code, Codex, Antigravity, whatever you build with. Maker proposes the smallest correction for the contract.",
    tool: "coding agent · E2B sandbox · git branch",
  },
  {
    n: "02",
    role: "Checker",
    title: "Verify",
    body: "The TestSprite CLI runs real tests against your live app and returns verdicts. Not the maker's self-grade — an independent cloud checker.",
    tool: "@testsprite/testsprite-cli · live URL",
  },
  {
    n: "03",
    role: "Maker",
    title: "Fix",
    body: "Agent reads the failure bundle and fixes the root cause. Only the causal slice returns to the maker. No hallucinated progress.",
    tool: "failure artifact · repair budget",
  },
  {
    n: "04",
    role: "Checker",
    title: "Verify again",
    body: "Rerun. Pass banks. Then back to the top. Evidence is valid only for the exact commit it tested.",
    tool: "testsprite test rerun · banked pass",
  },
];

const onboard = [
  {
    n: "01",
    title: "Install",
    body: "Get the official CLI.",
    code: "npm i -g @testsprite/testsprite-cli",
    href: "https://github.com/TestSprite/testsprite-cli",
    linkLabel: "View on GitHub →",
  },
  {
    n: "02",
    title: "Onboard",
    body: "API key + agent skill so the maker knows when and how to run the checker.",
    code: "testsprite setup",
    href: null,
    linkLabel: null,
  },
  {
    n: "03",
    title: "Target",
    body: "The CLI tests in the cloud — point it at your deployed app, never only localhost.",
    code: "APP_URL=https://your-app.vercel.app",
    href: "/integrations",
    linkLabel: "Wire integrations →",
  },
  {
    n: "04",
    title: "Loop",
    body: "create · fix · rerun. The agent drives the loop. Every pass banks into LOOP.md.",
    code: "testsprite test create --plan-from … --run --wait",
    href: "/dashboard",
    linkLabel: "Open dashboard →",
  },
];

export default function LoopPage() {
  return (
    <AppShell
      title="Four steps. One repeats."
      subtitle="Maker ships. Checker verifies. Maker fixes. Checker verifies again. A loop with no real checker doesn't fail loudly — it hallucinates progress."
    >
      <section className="four-grid" aria-label="Maker checker loop">
        {steps.map((step) => (
          <article key={step.n} className={`four-card role-${step.role.toLowerCase()}`}>
            <div className="four-card-top">
              <span>{step.n}</span>
              <span className={`pill ${step.role === "Maker" ? "pill-warn" : "pill-ok"}`}>{step.role}</span>
            </div>
            <h2>{step.title}</h2>
            <p>{step.body}</p>
            <code>{step.tool}</code>
          </article>
        ))}
      </section>

      <section className="panel span-full" style={{ marginTop: "1rem" }}>
        <div className="panel-head">
          <h2>Maker vs Checker</h2>
        </div>
        <div className="role-split">
          <div>
            <h3>Maker · your coding agent</h3>
            <p>Writes and repairs code. May open a PR. May never approve its own merge or bank a pass.</p>
          </div>
          <div>
            <h3>Checker · TestSprite CLI</h3>
            <p>
              Runs real tests against the live app. Returns pass/fail + failure bundles.{" "}
              <a href="https://github.com/TestSprite/testsprite-cli" target="_blank" rel="noreferrer">
                Open-source CLI →
              </a>
            </p>
          </div>
        </div>
      </section>

      <section className="panel span-full" style={{ marginTop: "1rem" }}>
        <div className="panel-head">
          <h2>Start in 3 minutes</h2>
          <Link href="/api/health">Health JSON</Link>
        </div>
        <div className="onboard-grid">
          {onboard.map((item) => (
            <article key={item.n}>
              <span className="onboard-n">{item.n} // {item.title}</span>
              <p>{item.body}</p>
              <code>{item.code}</code>
              {item.href ? (
                <a href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                  {item.linkLabel}
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="panel span-full" style={{ marginTop: "1rem" }}>
        <div className="panel-head">
          <h2>How to submit</h2>
          <a href="https://github.com/SahilRakhaiya05/proofsmith/blob/main/LOOP.md" target="_blank" rel="noreferrer">
            LOOP.md →
          </a>
        </div>
        <div className="submit-grid">
          <article>
            <span>01 // In your GitHub repo</span>
            <h3>Source + LOOP.md + README</h3>
            <p>
              Your source, an agent-written <code>LOOP.md</code>, and a README with the app and live URL. The agent
              writes one plain-English line per iteration as the loop runs — no hand-writing for judges.
            </p>
          </article>
          <article>
            <span>02 // Discord entry</span>
            <h3>Register the run</h3>
            <p>
              Your Discord post is the entry that registers you. Repo carries the proof; Discord registers the
              submission. Both need to be in before the deadline.
            </p>
          </article>
        </div>
        <p className="panel-note">
          Live app (set after Vercel deploy): <code>https://&lt;your-app&gt;.vercel.app</code> · Repo:{" "}
          <a href="https://github.com/SahilRakhaiya05/proofsmith" target="_blank" rel="noreferrer">
            github.com/SahilRakhaiya05/proofsmith
          </a>
        </p>
      </section>
    </AppShell>
  );
}
