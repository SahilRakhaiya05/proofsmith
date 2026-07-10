# Proofsmith

Issue in. Verified PR out.

Proofsmith is a GitHub-native autonomous engineering loop that converts an issue into a human-reviewed, TestSprite-verified pull request and confirms the fix again in production.

> Truth status: this repository currently contains a working local product shell, ReleaseLab reference application, loop state machine, signed webhook boundary, tests, and guarded workflow templates. It does **not** yet contain a genuine GitHub issue-to-production run, TestSprite result, public GitHub App installation, human review, or production verification. The Loop Theater fixture is visibly labelled Simulation.

## Live application and real evidence

- Product UI: `/` (marketing + Loop Theater fixture), `/dashboard`, `/loops`, `/agents`, `/integrations`, `/settings`
- GitHub OAuth: `/api/auth/github` → callback `/api/auth/github/callback`
- Health (config flags only): `/api/health`
- TestSprite probe: `/api/testsprite/status` ([official CLI](https://github.com/TestSprite/testsprite-cli))
- E2B probe: `/api/e2b/status`
- Signed webhook: `/api/github/webhook`

### Deploy on Vercel (recommended)

1. Import `SahilRakhaiya05/proofsmith` into Vercel.
2. Set env vars from `.env.example` in the Vercel project (never commit real secrets).
3. Set `APP_URL` to `https://<your-deployment>.vercel.app` (no trailing slash).
4. In GitHub OAuth App settings, set Authorization callback URL to  
   `https://<your-deployment>.vercel.app/api/auth/github/callback`.
5. Redeploy. Open `/dashboard` and **Connect GitHub**.

Proofsmith never substitutes fixtures for hackathon evidence. Loop Theater remains a labelled simulation until a real issue→TestSprite→production artifact chain exists.

## One-minute explanation

Most coding agents stop after producing code or opening a pull request. Proofsmith turns each issue into a falsifiable contract, lets a bounded maker implement the smallest correction, and requires separate local, preview, TestSprite, review, shadow-mutation, human, and production gates. Evidence is valid only for the exact commit it tested.

## How the loop works

`issue → contract → isolated build → local checks → preview → TestSprite → repair → independent review → shadow challenge → human approval → production verification → memory`

The strict transition table lives in `packages/loop-state`. `BUILDING → SUCCESS` is illegal by construction.

## GitHub-native interaction

The signed webhook endpoint is `/api/github/webhook`. It validates payload size, HMAC signature, delivery ID, supported event, command grammar, and trusted author association before it contacts GitHub. It maintains a single contract comment and dispatches the guarded workflow for `/proofsmith start`.

Supported parser commands include `plan`, `start`, `status`, `verify`, `repair`, `review`, `challenge`, `explain`, `replay`, `pause`, `resume`, `stop`, `resolve-comments`, `fix-ci`, `fix-conflicts`, and `release`. Workflows enable only the commands they implement.

The web app also implements GitHub OAuth with state validation and an AES-GCM encrypted, HttpOnly session. Set the OAuth callback to `https://proofsmith-loop-theater.fxcore120.chatgpt.site/api/auth/github/callback`. GitHub recommends GitHub Apps over OAuth apps for repository automation; OAuth here identifies the human, while the GitHub App remains the intended worker boundary.

## Maker/checker separation and TestSprite

The maker may propose changes but cannot transition the run to success, approve its own PR, or bank verified memory. TestSprite is the independent user-visible checker. The repository pins the official CLI, installs its Codex verification guidance, validates three broad ReleaseLab plans offline, and includes real preview and production invocations. A live run still requires a rotated `TESTSPRITE_API_KEY` and project ID in GitHub Actions secrets.

## Shadow mutation challenge

A completed live implementation will apply a temporary isolated mutation that reintroduces the original defect. The relevant verifier must fail, the corrected branch must be restored, and the verifier must pass again. The current repository contains the policy and UI slot, not a claimed mutation result.

## Architecture

- `app/` — Loop Theater, ReleaseLab surface, and signed webhook route.
- `apps/release-lab/` — deterministic release workflow and accessible interactions.
- `packages/loop-engine/` — contracts, commands, authorization, budgets, sticky-comment renderer.
- `packages/loop-state/` — legal state transitions and durable transition schema.
- `.github/workflows/` — quality, dispatch, preview, and production gates.
- `.proofsmith/` — repository policy and loop budgets.
- `evidence/` — reserved for sanitized real external artifacts.

## Security model

Issue text is data, never a command. The webhook requires SHA-256 signature verification and a trusted GitHub author association. Dispatch inputs are allowlisted, merge is human-only, credentials are environment secrets, and external workflows fail closed when prerequisites are absent. See `SECURITY.md`.

## Installation

1. Create a GitHub App with Issues (read/write), Pull requests (read/write), Checks (read/write), Actions (write), and Contents (read/write only for the worker) permissions.
2. Subscribe to `issue_comment`, `pull_request`, `check_run`, `workflow_run`, and deployment events as each handler is implemented.
3. Point the webhook to `/api/github/webhook` and set `GITHUB_WEBHOOK_SECRET`.
4. Set a short-lived installation token adapter as `PROOFSMITH_GITHUB_TOKEN` for the current prototype.
5. Configure a tested model provider, `TESTSPRITE_API_KEY`, preview deployment, and production environment.
6. Install dependencies with `npm ci`, run `npm test`, and start with `npm run dev`.

The long-lived token environment variable is a prototype boundary. Production should mint per-installation tokens from a GitHub App private key.

## CI/CD and evidence

`quality.yml` runs lint, strict type checking, unit tests, build, and a basic secret scan. Loop workflows use per-issue concurrency and explicit timeouts. Preview and production verification fail closed until their external contracts are wired. Real artifacts belong under `evidence/<kind>/<run-id>/` with commit SHA and hash metadata.

## Limitations

- Webhook delivery idempotency is process-local; durable GitHub-backed delivery records are still required.
- GitHub App JWT and installation-token minting are not implemented.
- Coding provider, branch/PR worker, check-run requested actions, reviewer, and mutation worker are not yet connected.
- TestSprite invocation remains deliberately unwired until real CLI help is inspected.
- The deployed Sites experience is private and the story data is a labelled fixture; no public GitHub/TestSprite evidence has been produced yet.

## Hackathon disclosure

The interactive story is a labelled fixture used to demonstrate the intended experience. It is not a pre-recorded run and must not be submitted as verified evidence. Only future linked GitHub, deployment, TestSprite, and human-review artifacts may support hackathon claims.

## License

MIT. Third-party packages retain their own licenses; see `THIRD_PARTY_NOTICES.md`.
