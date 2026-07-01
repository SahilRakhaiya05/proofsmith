# LOOP.md

- Iteration 01 — Built the local Proofsmith product shell, strict loop transition table, signed command boundary, and ReleaseLab regression coverage at `67123c2`; 10 local tests and the production build passed, while external verification remains pending; status LOCAL-GREEN / EXTERNAL-PENDING.
- Iteration 02 — Published commit `bc33277` as private Sites version 1 at the real Proofsmith production URL; deployment succeeded, but this proves only the web shell—not the GitHub/TestSprite repair loop; status SITE-DEPLOYED / LOOP-EVIDENCE-PENDING.
- Iteration 03 — Added encrypted GitHub OAuth, integration health, official TestSprite CLI v0.3.0, three schema-valid ReleaseLab plans, and real CI invocations at `02a31ef`; 12 local tests, lint, typecheck, build, and three TestSprite dry-runs passed, but exposed credentials were rejected and no cloud TestSprite pass is claimed; status LOCAL-GREEN / SECURITY-ROTATION-REQUIRED.
