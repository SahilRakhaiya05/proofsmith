import Link from "next/link";

export default function IntegrationsPage() {
  return <main className="integration-page">
    <Link className="back-link" href="/">← Proofsmith</Link>
    <p className="eyebrow">Live integration room</p>
    <h1>Connect the<br /><em>real loop.</em></h1>
    <p className="integration-dek">Credentials belong in private runtime settings. This page contains no secret values and makes no verification claim.</p>
    <div className="integration-list">
      <article><span>01</span><div><h2>GitHub identity</h2><p>Set the OAuth callback to the deployed URL below, add rotated secrets to the host, then connect a real collaborator.</p><code>https://proofsmith-loop-theater.fxcore120.chatgpt.site/api/auth/github/callback</code><a href="/api/auth/github">Connect GitHub ↗</a></div></article>
      <article><span>02</span><div><h2>GitHub App worker</h2><p>Point the signed webhook at the deployed endpoint. The handler validates HMAC, delivery ID, command grammar, and author trust before updating the canonical contract.</p><code>https://proofsmith-loop-theater.fxcore120.chatgpt.site/api/github/webhook</code></div></article>
      <article><span>03</span><div><h2>TestSprite cloud verification</h2><p>The repository includes the official v0.3.0 CLI, its Codex guidance, three schema-valid ReleaseLab plans, and live preview/production workflows. Add only a rotated API key and project ID through GitHub Actions secrets.</p><code>TESTSPRITE_API_KEY · TESTSPRITE_PROJECT_ID</code></div></article>
      <article><span>04</span><div><h2>Runtime truth</h2><p>The health endpoint reports only whether integrations are configured, never their values.</p><a href="/api/health">Open health JSON ↗</a></div></article>
    </div>
  </main>;
}
