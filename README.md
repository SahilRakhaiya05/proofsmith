# Proofsmith

**Issue in. Verified PR out.**

Proofsmith is a GitHub-native **maker → checker → fix → verify-again** loop:

| Step | Role | Implementation |
|------|------|----------------|
| **01 Write** | Maker | **Google Gemini** agent (`/ai`, `/api/ai/agent`) + optional **E2B** |
| **02 Verify** | Checker | **[TestSprite CLI](https://github.com/TestSprite/testsprite-cli)** on the **live** app URL |
| **03 Fix** | Maker | Gemini reads failure bundle (`/api/loop/iterate`) |
| **04 Verify again** | Checker | `testsprite` rerun · pass banks into [LOOP.md](./LOOP.md) |

> A loop with no real checker doesn't fail loudly. It hallucinates progress.

## Live app & proof

| | |
|--|--|
| **Repo** | https://github.com/SahilRakhaiya05/proofsmith |
| **Live URL** | `https://<your-vercel-project>.vercel.app` ← set after deploy + paste here |
| **Loop log** | [LOOP.md](./LOOP.md) (agent-written, one line per iteration) |
| **Submission pack** | [SUBMISSION.md](./SUBMISSION.md) · in-app `/submit` |
| **One-click launch** | `/launch` |
| **Security scorecard** | `/security` |
| **AI console** | `/ai` (server auto-picks best Gemini — **no model list UI**) |
| **Dashboard** | `/dashboard` |
| **Health** | `/api/health` |

## Quick start (local)

```bash
npm ci
cp .env.example .env.local   # fill secrets — never commit .env.local
npm test
npm run build
npm run dev                  # http://localhost:3000
```

### Environment (Vercel + local)

See [`.env.example`](./.env.example). Required for a full demo:

```
APP_URL=https://YOUR-APP.vercel.app
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
SESSION_SECRET=...                 # long random
TESTSPRITE_API_KEY=...
GEMINI_API_KEY=...                 # Google AI Studio
E2B_API_KEY=...                    # optional sandboxes
```

Aliases for Gemini: `GOOGLE_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `MODEL_PROVIDER_API_KEY`.  
Optional `GEMINI_MODEL` hard-pins server selection. Otherwise the **server ranks** coding models (excludes TTS/image/embed) and runs only the winner — the browser never shows a model catalog or lets users pick.

**GitHub OAuth callback:**  
`https://YOUR-APP.vercel.app/api/auth/github/callback`

## Product map

- `/` — four-step story + Loop Theater (labelled fixture)
- `/ai` — run triage / maker / reviewer on Gemini; list best model
- `/loop` — submit guide + maker/checker explainer
- `/dashboard` — GitHub · TestSprite · E2B · Gemini status
- `/loops` — runs + start from real GitHub issues
- `/agents` — roster (all `canApproveMerge: false`)
- `/integrations` · `/settings` — wire + probe (no secret values)

### APIs

| Area | Routes |
|------|--------|
| Auth | `/api/auth/github`, `/callback`, `/me`, `/logout` |
| GitHub data | `/api/github/repos`, `/api/github/issues` |
| Webhook | `/api/github/webhook` |
| TestSprite | `/api/testsprite/status\|projects\|tests\|run` |
| E2B | `/api/e2b/status`, `POST/DELETE /api/e2b/sandbox` |
| Gemini | `/api/ai/status`, `/api/ai/models`, `POST /api/ai/agent` |
| Loop | `/api/loop/runs`, `POST /api/loop/iterate` |
| Health | `/api/health` |

## Deploy on Vercel

1. Import this repo · branch **`main`** (must be latest — not old `6eee85d`).
2. Framework **Next.js** · build `npm run build` (`next build`) · Node **22.x**.
3. Paste all env vars from `.env.example`.
4. Redeploy **without cache** if a vinext error is stuck.
5. Update **Live URL** in this README + GitHub OAuth callback.

`vercel.json` pins install/build. Local proof: `npm test && npm run build`.

## Checker onboarding (TestSprite)

```bash
npm i -g @testsprite/testsprite-cli
testsprite setup
testsprite test create \
  --plan-from .testsprite/plans/viewer-approval.plan.json \
  --run --wait \
  --target-url https://YOUR-APP.vercel.app
```

Plans in-repo: viewer approval · exact-once deploy · rollback audit.

## How to submit

### 01 // GitHub repo

- Source on `main`
- Agent-written [LOOP.md](./LOOP.md)
- This README with **live URL**

### 02 // Discord

Post the registration entry. Repo = proof · Discord = entry.

## Architecture

- `app/` — UI + API (Next.js App Router)
- `lib/gemini.ts` — listModels + generateContent + best-model picker
- `lib/testsprite-client.ts` · `lib/e2b-client.ts` · `lib/github-user.ts`
- `packages/loop-engine` · `packages/loop-state` — contracts & legal transitions
- `apps/release-lab` — deterministic reference UI for plans
- `@testsprite/testsprite-cli` — official checker pin

`BUILDING → SUCCESS` is illegal by construction. Evidence expires with the commit SHA.

## Truth status

| Claim | Status |
|-------|--------|
| Vitest + `next build` | Local green |
| Gemini agents | Wired (key in env only) |
| GitHub OAuth + data APIs | Wired when secrets set |
| E2B probe / sandbox create | Wired when key set |
| TestSprite banked live pass | **Only after run on APP_URL** |
| Human merge only | Enforced in agent policy |

## Security

- Never commit secrets (`.env*` gitignored except `.env.example`).
- Rotate any key pasted into chat.
- Health/settings expose **booleans**, never values.

## License

MIT · see `THIRD_PARTY_NOTICES.md`.
