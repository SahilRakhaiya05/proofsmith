# LOOP.md

Agent-written loop log for **Proofsmith** (`SahilRakhaiya05/proofsmith`).

**How judges should read this:** one plain-English line per iteration — **maker first**, then what ran, what broke, what got fixed. Backed by git history + platform probes. No hand-waved “it works.”

---

## Roles (fixed)

| Role | Who | Tooling in this repo |
|------|-----|----------------------|
| **Maker** | Coding agent | Google **Gemini** (`/api/ai/agent`, `/api/loop/iterate`), optional **E2B** sandboxes |
| **Checker** | Independent verifier | **[TestSprite CLI](https://github.com/TestSprite/testsprite-cli)** against the **live** `APP_URL` |
| **Human** | You | Merge authority only — agents **never** auto-merge |

> A loop with no real checker doesn't fail loudly. It hallucinates progress.

### Four steps · one repeats

1. **Write (Maker)** — Gemini (best available model from `listModels`) plans/ships the smallest fix.  
2. **Verify (Checker)** — TestSprite runs real tests on the **deployed** app.  
3. **Fix (Maker)** — Agent reads the failure bundle and repairs root cause.  
4. **Verify again (Checker)** — Rerun; pass banks into this file; return to step 1.

---

## Iterations

- Iteration 01 — **Maker** built the local Proofsmith product shell, strict loop transition table (`packages/loop-state`), signed webhook command boundary, and ReleaseLab regression coverage at `67123c2`; **local checker** ran unit tests + production build and passed; external TestSprite not yet pointed at a public live URL; status **LOCAL-GREEN / EXTERNAL-PENDING**.

- Iteration 02 — **Maker** published the web shell as private Sites version 1 (`bc33277`); deploy of shell succeeded; this proved only the UI shell, not the GitHub↔TestSprite repair loop; status **SITE-DEPLOYED / LOOP-EVIDENCE-PENDING**.

- Iteration 03 — **Maker** added encrypted GitHub OAuth, integration health, official `@testsprite/testsprite-cli@0.3.0`, three schema-valid ReleaseLab plans under `.testsprite/plans/`, and CI gate wiring at `02a31ef`; local suite + three TestSprite dry-runs passed; live cloud pass not claimed; status **LOCAL-GREEN / CLOUD-CHECKER-PENDING**.

- Iteration 04 — **Maker** shipped the live control plane at `bfd6a95`: `/dashboard`, `/loops`, `/agents`, `/settings`, session-backed GitHub repos/issues APIs, TestSprite facade routes (`/api/testsprite/*`), E2B sandbox routes (`/api/e2b/*`), Vercel `next build` config; **16** vitest tests + `next build` green; status **LOCAL-GREEN / AWAITING-VERCEL-REDEPLOY**.

- Iteration 05 — **Maker** fixed Vercel failure: old deploy cloned `6eee85d` and ran `vinext build` missing `./build/sites-vite-plugin`; switched default to `next build`, pinned Node `22.x`, committed sites plugin, forced `vercel.json` framework settings (`f2241d2`); local re-check green; status **BUILD-FIXED / REDEPLOY-REQUIRED**.

- Iteration 06 — **Maker** encoded Four Steps (Write → Verify → Fix → Verify Again) into `/loop`, home `#four-steps`, submission README, and this log so judges see maker/checker without reading the whole tree; banked TestSprite cloud pass still requires live `APP_URL`; status **DOCS-UI-GREEN / LIVE-TESTSPRITE-PENDING**.

- Iteration 07 — **Maker** integrated **Google Gemini** as the live model provider for triage/maker/reviewer agents: `lib/gemini.ts` lists models from the Generative Language API, **auto-selects best** (prefers `gemini-3.1-pro-preview` → `gemini-2.5-pro` …), exposes `/api/ai/models`, `/api/ai/status`, `/api/ai/agent`, `/api/loop/iterate`, and `/ai` console; health/settings env checklist now covers GitHub + TestSprite + E2B + Gemini without leaking secrets; **live listModels probe returned HTTP 200 with 50 models, best pick `gemini-3.1-pro-preview` when present else `gemini-2.5-pro`**; agents still **cannot merge**; status **GEMINI-MAKER-GREEN / CHECKER-STILL-EXTERNAL**.

- Iteration 08 — **Maker** perfected env surface (`.env.example`, `/api/health` requiredMissing, Settings checklist), dashboard Gemini card, agent catalog entries for Gemini Orchestrator, and expanded submission docs; local **vitest + next build** must stay green before push; next **Checker** action is TestSprite against the Vercel URL after env is set; status **ENV-SURFACE-COMPLETE / AWAITING-LIVE-TESTSPRITE-BANK**.

- Iteration 09 — **Maker** closed competitive gaps vs Season 3 field (LoopLens / Ouroboros / LoopLedger / NEXUS-style entries): (1) Gemini model catalog **removed from the client** — `/api/ai/models` returns only server-auto selection, ranking prefers `gemini-3.1-pro-preview` → `gemini-2.5-pro` and excludes TTS/image/embed; (2) **one-click pre-launch** at `/launch` + `/api/launch`; (3) **pre-launch security scorecard** at `/security` + `/api/security/scorecard` (grade A–F, critical gates, no secret leakage); (4) judge pack `/submit` + `SUBMISSION.md` with Discord paste; local unit tests for scorecard + model ranking; status **SUBMISSION-PACK-GREEN / LIVE-TESTSPRITE-STILL-PENDING**.

---

## Environment map (no secret values)

| Variable | Used by | Required |
|----------|---------|----------|
| `APP_URL` | OAuth redirect, TestSprite target, health | Yes (prod) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` / `SESSION_SECRET` | Human GitHub OAuth | Yes |
| `GITHUB_WEBHOOK_SECRET` / `PROOFSMITH_GITHUB_TOKEN` | Webhook worker | For full loop |
| `TESTSPRITE_API_KEY` / `TESTSPRITE_PROJECT_ID` | Independent checker | Yes for banked pass |
| `E2B_API_KEY` | Isolated maker sandboxes | Optional |
| `GEMINI_API_KEY` (+ aliases) | Maker / triage / reviewer | Yes for AI agents |
| `GEMINI_MODEL` | Optional hard pin | No (auto best) |

Set these on **Vercel → Environment Variables**. Never commit `.env.local`.

---

## Live surfaces

| Path | Purpose |
|------|---------|
| `/` | Marketing + four steps + Loop Theater (fixture labelled) |
| `/ai` | Gemini agent console (triage / maker / reviewer) |
| `/dashboard` | Live integration board |
| `/loop` | Four steps + submit guide |
| `/loops` | Run ledger + start from GitHub issues |
| `/agents` | Agent roster (no merge rights) |
| `/settings` | Env checklist + probes |
| `/api/health` | Flags + endpoints only |
| `/api/ai/*` | Gemini models + agent |
| `/api/testsprite/*` | Checker facade |
| `/api/e2b/*` | Sandbox lifecycle |
| `/api/github/*` | OAuth session GitHub data + webhook |

---

## Next checker steps (to bank Iteration 09)

```bash
# after Vercel is green and APP_URL is set
npx testsprite setup
npx testsprite test create \
  --plan-from .testsprite/plans/viewer-approval.plan.json \
  --run --wait \
  --target-url "$APP_URL"
```

On **red**: paste failure into `/ai` or `POST /api/loop/iterate` with `failureBundle`, maker fixes, re-run checker.  
On **green**: append Iteration 09 with run id + commit SHA + pass — that is the only banked evidence.

---

## Truth table

| Claim | Status |
|-------|--------|
| Local tests + `next build` | Green when CI/local passes |
| Vercel uses `next build` on latest main | Redeploy `main` HEAD (not `6eee85d`) |
| Gemini listModels + generateContent | Wired; key via env only |
| GitHub OAuth | Wired when secrets set |
| TestSprite cloud banked pass | **Not claimed until live run** |
| Auto-merge | **Never** |

---

*Last agent update: Iteration 09 — server-auto Gemini, security scorecard, one-click launch, submission pack.*
