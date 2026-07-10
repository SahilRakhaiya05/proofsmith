# SUBMISSION — Proofsmith (TestSprite Season 3)

## One-liner

**Issue in. Verified PR out.** GitHub-native maker/checker loop: Gemini writes, TestSprite CLI verifies on the **live** URL, Gemini fixes, TestSprite verifies again.

## Links

| Artifact | URL |
|----------|-----|
| **GitHub repo** | https://github.com/SahilRakhaiya05/proofsmith |
| **Live app** | `https://<your-vercel-app>.vercel.app` ← paste after deploy |
| **LOOP.md** | https://github.com/SahilRakhaiya05/proofsmith/blob/main/LOOP.md |
| **README** | https://github.com/SahilRakhaiya05/proofsmith#readme |
| **One-click launch** | `/launch` |
| **Security scorecard** | `/security` |
| **Judge pack** | `/submit` |
| **AI maker** | `/ai` |
| **Health** | `/api/health` |

## Discord paste (edit live URL)

```
**Proofsmith** — Issue in. Verified PR out.
Repo: https://github.com/SahilRakhaiya05/proofsmith
Live: https://<your-vercel-app>.vercel.app
LOOP.md: https://github.com/SahilRakhaiya05/proofsmith/blob/main/LOOP.md
Maker: Google Gemini (server auto-selects best coding model — no client picker)
Checker: @testsprite/testsprite-cli against live APP_URL
Surfaces: /launch · /security · /ai · /dashboard · /loop
Four steps: Write → Verify → Fix → Verify again. Agents never auto-merge.
```

## Checklist

- [x] Public GitHub repo
- [x] Agent-written LOOP.md
- [x] README with product + deploy + env
- [x] Four-step maker/checker UX
- [x] Gemini maker (server-side best model)
- [x] TestSprite plans + facade routes
- [x] GitHub OAuth + webhook skeleton
- [x] E2B sandbox routes
- [x] Pre-launch security scorecard
- [x] One-click `/launch` preflight
- [x] Local tests + `next build`
- [ ] Vercel live URL filled in README + this file
- [ ] TestSprite cloud banked pass on live URL (append LOOP iteration)
- [ ] Discord entry posted

## How judges verify in 90 seconds

1. Open live URL → `/launch` → **Run pre-launch** (expect security grade + green probes).
2. Open `/security` for scorecard detail.
3. Open `/ai` → send a maker prompt (model chosen server-side).
4. Skim [LOOP.md](./LOOP.md) — one line per iteration.
5. Optional: `/dashboard` Connect GitHub when OAuth env is set.

## Differentiator

Most entries are either (a) evidence dashboards (LoopLens, LoopLedger) or (b) apps that claim a loop. Proofsmith is a **product loop**: signed GitHub boundary, independent TestSprite checker, Gemini maker with **no client model shopping**, and a **pre-launch security scorecard** before you claim readiness.
