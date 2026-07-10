"use client";

import { useEffect, useMemo, useState } from "react";
import { ReleaseLab } from "@/apps/release-lab/ReleaseLab";
import { GitHubIdentity } from "./GitHubIdentity";

const events = [
  { state: "DISCOVERED", label: "Issue received", meta: "#24 · viewer approval bypass", proof: "Issue text becomes a falsifiable contract." },
  { state: "CONTRACTED", label: "Contract locked", meta: "4 acceptance criteria · medium risk", proof: "State unchanged, no audit event, truthful feedback." },
  { state: "LOCAL_GREEN", label: "Patch survives locally", meta: "unit · type · build", proof: "Maker output is necessary, never sufficient." },
  { state: "TESTSPRITE_RED", label: "Independent check breaks it", meta: "awaiting genuine external run", proof: "A real failure bundle will live here—never a made-up result." },
  { state: "REPAIRING", label: "Evidence drives repair", meta: "attempt 0 / 3", proof: "Only the causal slice returns to the maker." },
  { state: "CHALLENGE_RED", label: "Verifier challenged", meta: "shadow mutation pending", proof: "Reintroduce the defect in isolation; expect the verifier to fail." },
  { state: "AWAITING_HUMAN", label: "Human gate holds", meta: "merge permission: human only", proof: "Automation stops before merge." },
  { state: "PRODUCTION_VERIFIED", label: "Production earns the seal", meta: "pending deployment", proof: "The issue closes only after the exact production commit passes." },
];

export default function Home() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const current = events[active];
  const progress = useMemo(() => `${((active + 1) / events.length) * 100}%`, [active]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setActive((value) => {
      if (value === events.length - 1) { setPlaying(false); return value; }
      return value + 1;
    }), 1400);
    return () => window.clearInterval(timer);
  }, [playing]);

  return (
    <>
      <a className="skip-link" href="#story">Skip to loop story</a>
      <div className="simulation-banner" role="note"><span>LIVE + FIXTURE</span> Loop Theater below is labelled simulation. Dashboard, GitHub OAuth, TestSprite, and E2B use real integrations when secrets are set.</div>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Proofsmith home"><span className="brand-mark">P</span><span>PROOFSMITH</span></a>
        <nav aria-label="Primary navigation">
          <a href="/dashboard">Dashboard</a>
          <a href="/loops">Loops</a>
          <a href="/agents">Agents</a>
          <a href="#story">Theater</a>
          <a href="/integrations">Integrations</a>
        </nav>
        <div className="header-auth"><GitHubIdentity /></div>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span className="signal-dot" /> GitHub-native autonomous engineering</p>
            <h1 id="hero-title">Issue in.<br /><em>Verified</em> PR out.</h1>
            <p className="dek">The coding agent does not stop when the code looks finished. It stops when independent evidence proves the issue is resolved.</p>
            <div className="hero-actions">
              <a className="primary-cta" href="/dashboard">Open dashboard <span>→</span></a>
              <a className="secondary-cta" href="/api/auth/github">Connect GitHub</a>
              <a className="secondary-cta" href="#story">Loop theater</a>
            </div>
          </div>
          <div className="forge" aria-label="Proofsmith closes the engineering loop">
            <div className="forge-label top">HUMAN ISSUE <span>01</span></div>
            <div className="issue-fragment"><span className="issue-number">#24</span><p>A Viewer can approve a release even though the role should be read-only.</p><span className="command">/proofsmith start</span></div>
            <div className="strike" aria-hidden="true"><span>↓</span><i /></div>
            <div className="proof-seal"><span>PROOF</span><strong>∴</strong><small>NOT PROMISES</small></div>
            <div className="forge-label bottom">VERIFIED CHANGE <span>09</span></div>
          </div>
        </section>

        <section className="manifesto">
          <p>One-shot agents produce code.</p><p>Proofsmith produces <em>evidence.</em></p>
          <div className="manifesto-rule"><span>MAKE</span><i /><span>CHECK</span><i /><span>CHALLENGE</span><i /><span>HUMAN</span></div>
        </section>

        <section className="theater" id="story" aria-labelledby="story-title">
          <div className="section-kicker"><span>Loop theater / run ps_demo_local</span><span>Fixture · not hackathon evidence</span></div>
          <div className="theater-heading"><div><p className="eyebrow">A change under pressure</p><h2 id="story-title">Follow the proof,<br />not the pitch.</h2></div><button className="replay-button" onClick={() => { if (active === events.length - 1) setActive(0); setPlaying(!playing); }} aria-pressed={playing}>{playing ? "Pause replay" : "Replay the loop"} <span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span></button></div>
          <div className="story-grid">
            <ol className="timeline" aria-label="Loop states">
              {events.map((event, index) => <li key={event.state} className={index === active ? "active" : index < active ? "passed" : ""}><button onClick={() => { setPlaying(false); setActive(index); }} aria-current={index === active ? "step" : undefined}><span className="event-index">{String(index + 1).padStart(2, "0")}</span><span><strong>{event.label}</strong><small>{event.state}</small></span><i /></button></li>)}
            </ol>
            <article className="artifact" aria-live="polite">
              <div className="artifact-top"><span>CANONICAL ARTIFACT</span><span>{String(active + 1).padStart(2, "0")} / {String(events.length).padStart(2, "0")}</span></div>
              <p className="artifact-state">{current.state}</p>
              <h3>{current.label}</h3>
              <p className="artifact-proof">{current.proof}</p>
              <div className="artifact-meta"><span>STATUS</span><strong>{current.meta}</strong></div>
              <div className="contract-slice"><div><span>CONTRACT</span><span>immutable after build</span></div><ul><li>Viewer action is rejected</li><li>Release state does not change</li><li>No approval audit event is appended</li><li>Feedback describes the real result</li></ul></div>
              <div className="progress-track"><span style={{ width: progress }} /></div>
            </article>
          </div>
        </section>

        <div id="release-lab"><ReleaseLab /></div>

        <section className="architecture" id="architecture" aria-labelledby="architecture-title">
          <div><p className="eyebrow">Bounded by design</p><h2 id="architecture-title">The maker never<br />grades its own work.</h2></div>
          <div className="layers">
            <article><span>01</span><div><h3>GitHub is the interface</h3><p>Signed webhooks, one canonical contract comment, checks, workflow dispatch, and a human merge gate.</p></div></article>
            <article><span>02</span><div><h3>The state machine refuses shortcuts</h3><p>Every legal transition is recorded. BUILDING cannot jump to SUCCESS.</p></div></article>
            <article><span>03</span><div><h3>Evidence expires with the commit</h3><p>Local, preview, TestSprite, review, mutation, and production results must match the exact SHA.</p></div></article>
          </div>
        </section>

        <section className="start" id="start">
          <p className="eyebrow">The first strike</p><h2>Start with an issue.<br />End with proof.</h2><code>/proofsmith start</code><p>Webhook and workflow templates are included. Genuine operation requires your GitHub App credentials, installed repository, model provider, deployment target, and TestSprite secret.</p>
        </section>
      </main>
      <footer><div className="wordmark"><span className="brand-mark">P</span><span>PROOFSMITH</span></div><p>Issue in. Verified PR out.</p><span>Built to tell the truth.</span></footer>
    </>
  );
}
