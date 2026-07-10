# API Reference

All Proofsmith API routes live under `app/api/`. Responses use JSON unless noted. **No endpoint returns secret values** — only booleans, metadata, and safe summaries.

Base URL: `APP_URL` (e.g. `https://your-app.vercel.app`)

---

## Table of contents

- [Health & launch](#health--launch)
- [Security](#security)
- [Authentication](#authentication)
- [GitHub](#github)
- [Gemini (AI)](#gemini-ai)
- [Loop](#loop)
- [TestSprite](#testsprite)
- [E2B](#e2b)
- [Agents & dashboard](#agents--dashboard)

---

## Health & launch

### `GET /api/health`

Runtime status and integration flags.

**Response fields:**

| Field | Type | Description |
|-------|------|-------------|
| `product` | string | `"Proofsmith"` |
| `status` | `"ready"` \| `"degraded"` | Degraded when required env vars missing |
| `version` | string | App version |
| `appUrl` | string | Resolved public origin |
| `mode` | string | `maker-checker-configured` or `awaiting-secrets` |
| `integrations` | object | Boolean flags per integration |
| `env` | array | Checklist: `{ key, set, required, purpose }` |
| `requiredMissing` | string[] | Keys still needed |
| `endpoints` | object | Useful URLs |
| `fourSteps` | string[] | Loop step identifiers |

```bash
curl -s "$APP_URL/api/health" | jq .
```

---

### `GET | POST /api/launch`

One-click pre-launch: security scorecard + live probes (Gemini, TestSprite, E2B).

**Response highlights:**

| Field | Description |
|-------|-------------|
| `ready` | Overall launch readiness |
| `scorecard` | Full security scorecard object |
| `steps[]` | Per-integration probe results |
| `appUrl` | Target origin |
| `runs` | Recent loop runs from run-store |

Never returns API keys or tokens.

---

## Security

### `GET /api/security/scorecard`

Pre-launch security assessment.

**Response:**

```json
{
  "score": 85,
  "grade": "B",
  "readyToLaunch": true,
  "checks": [
    {
      "id": "oauth",
      "category": "auth",
      "title": "GitHub OAuth fully configured",
      "weight": 12,
      "pass": true,
      "detail": "CLIENT_ID + CLIENT_SECRET + SESSION_SECRET present",
      "severity": "critical"
    }
  ],
  "summary": "...",
  "appUrl": "https://...",
  "timestamp": "2026-..."
}
```

**Grades:** A ≥ 90 · B ≥ 80 · C ≥ 70 · D ≥ 55 · F < 55

**Categories:** `auth`, `secrets`, `checker`, `agent`, `deploy`, `policy`

---

## Authentication

### `GET /api/auth/github`

Redirects to GitHub OAuth authorize URL. Sets one-time state cookie.

### `GET /api/auth/github/callback`

OAuth callback. Exchanges code for token, seals session cookie, redirects to dashboard.

**Callback URL (configure in GitHub OAuth app):**

```
https://YOUR-APP.vercel.app/api/auth/github/callback
```

### `GET /api/auth/me`

Returns authenticated user profile. **Never includes OAuth token.**

### `POST /api/auth/logout`

Clears session cookie.

---

## GitHub

Requires authenticated session for data routes.

### `GET /api/github/repos`

Lists repositories for the authenticated user.

### `GET /api/github/issues`

Lists issues for a repository (query params per route implementation).

### `POST /api/github/webhook`

GitHub webhook receiver. Validates HMAC (`GITHUB_WEBHOOK_SECRET`), parses `/proofsmith` commands via `loop-engine`.

**Trusted commands:** `plan`, `start`, `status`, `verify`, `repair`, `review`, `challenge`, `explain`, `replay`, `pause`, `resume`, `stop`, `resolve-comments`, `fix-ci`, `fix-conflicts`, `release`

---

## Gemini (AI)

Model selection is **server-side only**. `/api/ai/models` returns the auto-selected best model — not a full catalog.

### `GET /api/ai/status`

Returns `{ configured: boolean, ... }` — no API key.

### `GET /api/ai/models`

Returns server-auto selection:

```json
{
  "configured": true,
  "selection": "auto",
  "model": "gemini-2.5-pro",
  "source": "ranked"
}
```

### `POST /api/ai/agent`

Run triage, maker, or reviewer agent.

**Request body (typical):**

```json
{
  "role": "maker",
  "prompt": "Fix the failing TestSprite step: ...",
  "context": {}
}
```

**Response:** Generated text + metadata (model used, no key).

**Model ranking** (when `GEMINI_MODEL` unset): prefers `gemini-3.1-pro-preview` → `gemini-2.5-pro` → …; excludes TTS/image/embed models.

---

## Loop

### `GET /api/loop/runs`

Returns loop run ledger entries from `run-store`.

### `POST /api/loop/iterate`

Maker repair step — accepts failure bundle from checker.

**Request body (typical):**

```json
{
  "runId": "ps_...",
  "failureBundle": { "...": "TestSprite artifact summary" },
  "prompt": "optional additional context"
}
```

Invokes Gemini maker agent with failure context.

---

## TestSprite

Facade to TestSprite cloud API. Requires `TESTSPRITE_API_KEY`.

### `GET /api/testsprite/status`

Auth probe + configuration flags.

### `GET /api/testsprite/projects`

Lists TestSprite projects.

### `GET /api/testsprite/tests`

Lists tests (optional project filter).

### `POST /api/testsprite/run`

Triggers a test run against `APP_URL`.

**Note:** TestSprite CLI tests the **deployed** public URL — not localhost.

---

## E2B

Optional maker sandboxes. Requires `E2B_API_KEY`.

### `GET /api/e2b/status`

Probe E2B API connectivity.

### `POST /api/e2b/sandbox`

Create ephemeral sandbox.

### `DELETE /api/e2b/sandbox`

Destroy sandbox by id.

---

## Agents & dashboard

### `GET /api/agents`

Returns agent roster from `agents-catalog.ts`. All entries have `canApproveMerge: false`.

### `GET /api/dashboard/summary`

Aggregated integration status for dashboard UI.

---

## Error handling

| Status | Meaning |
|--------|---------|
| `400` | Invalid request body or command |
| `401` | Session required but missing |
| `403` | Untrusted association or policy block |
| `500` | Integration error (message sanitized) |
| `503` | Required integration not configured |

All error responses avoid leaking stack traces or secrets in production.

---

## Related

- [Architecture](./ARCHITECTURE.md)
- [Environment variables](./ENVIRONMENT.md)
- [Deployment](./DEPLOYMENT.md)