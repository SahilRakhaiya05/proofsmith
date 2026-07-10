# Proofsmith

**Issue in. Verified PR out.**

Proofsmith is a GitHub-native autonomous engineering loop: a **Maker** (coding agent) ships code, an independent **Checker** ([TestSprite CLI](https://github.com/TestSprite/testsprite-cli)) runs real tests against the **live** app, the Maker fixes from the failure bundle, and the Checker verifies again until the pass banks.

> A loop with no real checker doesn't fail loudly. It hallucinates progress.

## Live app

| | |
|--|--|
| **Repository** | https://github.com/SahilRakhaiya05/proofsmith |
| **Live URL** | Set after Vercel deploy → `https://<your-project>.vercel.app` (put the real URL here once deploy succeeds) |
| **Loop log** | [LOOP.md](./LOOP.md) — agent-written, one line per iteration |
| **Health** | `/api/health` |
| **Dashboard** | `/dashboard` |
| **Four steps** | `/loop` |

After Vercel is green, update this section with the exact production URL and set `APP_URL` to the same value.

## Four steps · one repeats

| Step | Role | What happens |
|------|------|----------------|
| **01 Write** | Maker | Coding agent ships code (Claude Code, Codex, etc.) |
| **02 Verify** | Checker | TestSprite CLI tests the **live** app URL |
| **03 Fix** | Maker | Agent reads the failure bundle and fixes root cause |
| **04 Verify again** | Checker | Rerun · pass banks · back to the top |

Install checker skill for your agent:

```bash
npm i -g @testsprite/testsprite-cli
testsprite setup          # API key + agent skill
# point tests at your deployed APP_URL — not localhost
```

Docs: https://github.com/TestSprite/testsprite-cli

## Product surfaces

- `/` — marketing + four-step overview + Loop Theater (labelled fixture)
- `/loop` — maker/checker guide + submit checklist
- `/dashboard` — live GitHub, TestSprite, E2B, runs
- `/loops` — run ledger · start from real GitHub issues
- `/agents` — 10 bounded agents (none may merge)
- `/integrations` · `/settings` — wire secrets without exposing them

### API

- GitHub OAuth: `/api/auth/github` → `/api/auth/github/callback`
- Repos / issues (session): `/api/github/repos`, `/api/github/issues`
- Webhook: `/api/github/webhook`
- TestSprite: `/api/testsprite/status|projects|tests|run`
- E2B: `/api/e2b/status`, `POST /api/e2b/sandbox`
- Dashboard summary: `/api/dashboard/summary`

## Deploy on Vercel (required)

**Important:** Vercel must build commit **`main` HEAD**, not old `6eee85d`.  
Default build is **`next build`** (not `vinext build`).

1. Import `SahilRakhaiya05/proofsmith` · branch `main`.
2. Framework: **Next.js**. Build command: `npm run build` (already in `vercel.json`).
3. Node: **22.x** (see `.nvmrc` / `package.json` engines).
4. Env vars (Project → Settings → Environment Variables):

```
APP_URL=https://YOUR-APP.vercel.app
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
SESSION_SECRET=
TESTSPRITE_API_KEY=
TESTSPRITE_PROJECT_ID=
E2B_API_KEY=
```

5. GitHub OAuth App callback:  
   `https://YOUR-APP.vercel.app/api/auth/github/callback`
6. Redeploy **without** build cache if an old vinext failure is cached.

Local:

```bash
npm ci
npm test
npm run build
npm run dev
```

## How to submit

### 01 // In your GitHub repo

- Source on `main`
- Agent-written [LOOP.md](./LOOP.md) (one plain-English line per iteration)
- This README with app description + **live URL**

Judges read LOOP.md first. It is backed by commit history + platform run history.

### 02 // Discord entry

Post the entry that registers you. Repo = proof · Discord = registration. Both before the deadline.

## Architecture

- `app/` — UI + API routes
- `packages/loop-engine` · `packages/loop-state` — contracts & legal transitions (`BUILDING → SUCCESS` is illegal)
- `apps/release-lab/` — deterministic reference app for TestSprite plans
- `.testsprite/plans/` — viewer-approval, exact-once deploy, rollback audit
- `.proofsmith/` — policy + budgets
- `@testsprite/testsprite-cli` — official checker CLI pin

## Truth status

| Claim | Status |
|-------|--------|
| Local tests + `next build` | Green (see LOOP.md) |
| Vercel Next.js deploy | Redeploy latest `main` after vinext fix |
| GitHub OAuth against production URL | Ready when `APP_URL` + callback match |
| Live TestSprite cloud pass | Pending first run against deployed URL |
| Full issue → production seal | Pending first end-to-end banked pass |

Loop Theater on `/` is a **labelled fixture**. Only LOOP.md + real checker artifacts support evidence claims.

## Security

Never commit secrets. Use Vercel env / `.env.local` (gitignored). Rotate any keys that appeared in chat logs. See `SECURITY.md`.

## License

MIT. See `THIRD_PARTY_NOTICES.md`.
