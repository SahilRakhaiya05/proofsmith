# Deployment

## Vercel (primary)

1. Import `SahilRakhaiya05/proofsmith`, branch `main`.
2. Framework: **Next.js**. Build: `npm run build`. Install: `npm ci`. Node: **22.x**.
3. Copy env from `.env.example` into Project → Settings → Environment Variables (Production + Preview).
4. `APP_URL=https://<deployment>.vercel.app` (or custom domain).
5. GitHub OAuth App callback: `https://<deployment>.vercel.app/api/auth/github/callback`.
6. Deploy. Open `/api/health` then `/launch`.

See `vercel.json` and root README §D.

## GitHub OAuth App

- Homepage URL = `APP_URL`
- Authorization callback URL = `{APP_URL}/api/auth/github/callback`
- Scopes requested by app: `read:user repo workflow`

## TestSprite against production

```bash
npx @testsprite/testsprite-cli setup
npx @testsprite/testsprite-cli test create \
  --plan-from .testsprite/plans/viewer-approval.plan.json \
  --run --wait --target-url "$APP_URL"
```

## Known fixed deploy issues

| Issue | Fix |
|-------|-----|
| `vinext build` missing sites plugin | Use `next build` on latest main |
| OAuth `/api/auth/github` 500 | Immutable redirect headers — use `lib/http-redirect.ts` |
| Google Fonts fetch fail in build | System font stack in `layout.tsx` |

## Post-deploy checklist

- [ ] `/api/health` shows expected integration booleans
- [ ] `/api/auth/github` returns 302 to github.com
- [ ] `/launch` preflight runs
- [ ] `/ai` responds with Gemini when key set
- [ ] Update README + SUBMISSION.md live URL if domain changed
