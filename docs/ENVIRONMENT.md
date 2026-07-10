# Environment variables

All secrets live in Vercel Environment Variables or local `.env.local` (gitignored).  
Template: [../.env.example](../.env.example)

## Required for production demo

| Key | Purpose |
|-----|---------|
| `APP_URL` | Public HTTPS origin (no trailing slash) |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client id |
| `GITHUB_CLIENT_SECRET` | OAuth client secret |
| `SESSION_SECRET` | ≥32 random chars for AES-GCM session seal |
| `TESTSPRITE_API_KEY` | Independent checker |
| `GEMINI_API_KEY` | Maker LLM (aliases: `GOOGLE_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `MODEL_PROVIDER_API_KEY`) |

## Optional

| Key | Purpose |
|-----|---------|
| `PROOFSMITH_PRODUCTION_URL` | Fallback public URL |
| `GITHUB_WEBHOOK_SECRET` | Webhook HMAC |
| `PROOFSMITH_GITHUB_TOKEN` | Sticky comments / workflow dispatch |
| `TESTSPRITE_PROJECT_ID` | Default project |
| `TESTSPRITE_CRITICAL_TEST_IDS` | Comma-separated critical tests |
| `TESTSPRITE_API_URL` | Default `https://api.testsprite.com` |
| `E2B_API_KEY` | Sandbox create/kill |
| `E2B_API_URL` | Default `https://api.e2b.dev` |
| `E2B_TEMPLATE_ID` | Default `base` |
| `GEMINI_MODEL` | Hard pin; else server auto-ranks |
| `GEMINI_API_BASE` | Default Generative Language v1beta |
| `ALLOW_CLIENT_MODEL` | Set `1` only for debug (default: ignore client model) |

## Resolution order

**Public URL:** `APP_URL` → `PROOFSMITH_PRODUCTION_URL` → `https://$VERCEL_URL` → request origin.

**Gemini key:** `GEMINI_API_KEY` → `GOOGLE_API_KEY` → `GOOGLE_GENERATIVE_AI_API_KEY` → `MODEL_PROVIDER_API_KEY`.

## Safety

`/api/health` and `/settings` expose `{ key, set, required, purpose }` only — never values.
