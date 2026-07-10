# Testing

## Unit (Vitest)

```bash
npm test
```

Covers: loop-engine, loop-state, github-session, gemini ranking, security scorecard, run-store, release-lab, config.

## Production build

```bash
npm run build
```

## TestSprite (independent checker)

Plans in `.testsprite/plans/`:

- `viewer-approval.plan.json`
- `exact-once-deploy.plan.json`
- `rollback-audit-focus.plan.json`

Run against **live** `APP_URL` only for banked evidence. See root README §T.

## Manual smoke

1. `/api/health`
2. `/launch`
3. `/security`
4. `/ai` one prompt
5. `/api/auth/github` 302
