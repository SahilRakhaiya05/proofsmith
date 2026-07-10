# LOOP.md

Agent-written loop log. One plain-English line per iteration: maker first, then what ran, what broke, what got fixed. Judges read this first. Backed by commit history + platform run history.

- Iteration 01 — Maker built the local Proofsmith product shell, strict loop transition table, signed command boundary, and ReleaseLab regression coverage at `67123c2`; local checker ran 10 unit tests + production build and passed; external TestSprite checker not yet pointed at a live URL; status LOCAL-GREEN / EXTERNAL-PENDING.
- Iteration 02 — Maker published the web shell as private Sites version 1 at the production URL (`bc33277`); deploy checker passed for the shell only; no GitHub/TestSprite repair loop evidence yet; status SITE-DEPLOYED / LOOP-EVIDENCE-PENDING.
- Iteration 03 — Maker added encrypted GitHub OAuth, integration health, official `@testsprite/testsprite-cli@0.3.0`, three schema-valid ReleaseLab plans, and CI gate wiring at `02a31ef`; local checker: 12 tests + lint + typecheck + build + three TestSprite dry-runs passed; live cloud TestSprite not claimed; status LOCAL-GREEN / CLOUD-CHECKER-PENDING.
- Iteration 04 — Maker shipped the live control plane at `bfd6a95`: `/dashboard`, `/loops`, `/agents`, `/settings`, real GitHub OAuth session APIs, TestSprite facade probes (`/api/testsprite/*`), E2B sandbox routes (`/api/e2b/*`), and Vercel `next build` config; local checker: 16 vitest tests + `next build` green; status LOCAL-GREEN / AWAITING-VERCEL-REDEPLOY.
- Iteration 05 — Maker fixed Vercel failure mode: old deploy cloned `6eee85d` and ran `vinext build` which could not resolve `./build/sites-vite-plugin`; switched default build to `next build`, pinned Node `22.x`, committed sites plugin, and forced Vercel `buildCommand`/`framework`; local checker re-ran unit suite + `next build`; status BUILD-FIXED / REDEPLOY-REQUIRED.
- Iteration 06 — Maker encoded the Four Steps (Write → Verify → Fix → Verify Again) into product UI (`/#four-steps`, `/loop`), submission README, and this LOOP.md so judges see maker/checker separation without reading the whole tree; checker still requires deployed APP_URL + `testsprite` run against live URL before a banked pass is claimed; status DOCS-UI-GREEN / LIVE-TESTSPRITE-PENDING.

## How to read this log

| Role | Tool | Job |
|------|------|-----|
| Maker | coding agent (Claude Code / Codex / etc.) | Write + fix code |
| Checker | TestSprite CLI | Run real tests against the live app URL and return verdicts |

A loop with no real checker does not fail loudly — it hallucinates progress. Proofsmith only banks a pass when the independent checker returns one.

## Next maker action

1. Redeploy Vercel from `main` (must not stay on `6eee85d`).
2. Set `APP_URL` to the Vercel domain; update GitHub OAuth callback.
3. Run: `npx testsprite setup` then point tests at the live URL.
4. On red: fix from failure bundle; on green: bank and append Iteration 07 here.
