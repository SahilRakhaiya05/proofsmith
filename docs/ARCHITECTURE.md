# Proofsmith Architecture

**Version:** 0.3 · **Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Vercel  
**Repo:** https://github.com/SahilRakhaiya05/proofsmith · **Live:** https://proofsmith.vercel.app

This document is the system design reference: context, components, data flows, state machine, agents, security, and deployment topology.

---

## Table of contents

1. [Design principles](#1-design-principles)
2. [System context](#2-system-context)
3. [High-level container diagram](#3-high-level-container-diagram)
4. [Repository map](#4-repository-map)
5. [Request lifecycle](#5-request-lifecycle)
6. [Maker–checker loop](#6-makerchecker-loop)
7. [Four-step sequence](#7-four-step-sequence)
8. [Loop state machine](#8-loop-state-machine)
9. [GitHub OAuth sequence](#9-github-oauth-sequence)
10. [Webhook command pipeline](#10-webhook-command-pipeline)
11. [Gemini model selection](#11-gemini-model-selection)
12. [TestSprite checker path](#12-testsprite-checker-path)
13. [E2B sandbox path](#13-e2b-sandbox-path)
14. [Agent roster](#14-agent-roster)
15. [Security boundaries](#15-security-boundaries)
16. [Pre-launch scorecard](#16-pre-launch-scorecard)
17. [Data stores](#17-data-stores)
18. [API surface map](#18-api-surface-map)
19. [Deployment topology](#19-deployment-topology)
20. [Failure modes](#20-failure-modes)
21. [Related docs](#21-related-docs)

---

## 1. Design principles

| # | Principle | How it is enforced |
|---|-----------|-------------------|
| P1 | **Independent checker** | TestSprite hits live `APP_URL`, never trusts maker self-grade |
| P2 | **No hallucinated progress** | Illegal transitions throw; `BUILDING → SUCCESS` is impossible |
| P3 | **Human merge gate** | All agents: `canApproveMerge: false` |
| P4 | **Secrets stay server-side** | Health/settings/scorecard return booleans only |
| P5 | **Server-auto AI** | Gemini ranked in `lib/gemini.ts`; no client model catalog |
| P6 | **Signed command boundary** | Webhook HMAC + trusted association + command grammar |
| P7 | **Evidence is commit-bound** | Pass for SHA N is stale for SHA N+1 |
| P8 | **Fail closed** | Missing secrets → 503 / degraded, not silent success |

---

## 2. System context

Who talks to Proofsmith, and who Proofsmith talks to.

```mermaid
flowchart TB
  subgraph People
    H[Human operator<br/>merge authority]
    J[Judge / reviewer<br/>reads LOOP.md + live app]
  end

  subgraph Proofsmith["Proofsmith control plane"]
    APP[Next.js app<br/>Vercel]
  end

  subgraph External systems
    GH[GitHub<br/>OAuth · Issues · Webhooks · PRs]
    GE[Google Gemini API<br/>listModels · generateContent]
    TS[TestSprite Cloud + CLI<br/>independent checker]
    EB[E2B API<br/>optional sandboxes]
  end

  H -->|/dashboard /ai /launch /security| APP
  J -->|/submit live URL LOOP.md| APP
  APP <-->|OAuth · REST · webhook| GH
  APP -->|generateContent| GE
  APP -->|facade /api/cli/v1| TS
  TS -->|HTTP tests| APP
  APP -->|create/kill sandbox| EB
  H -->|merge PR| GH
```

---

## 3. High-level container diagram

```mermaid
flowchart TB
  subgraph Browser
    UI[React pages<br/>app/*/page.tsx]
    ID[GitHubIdentity]
  end

  subgraph Vercel["Vercel Node runtime"]
    subgraph Routes["app/api/**"]
      AUTH[auth/*]
      GAPI[github/*]
      AI[ai/*]
      LOOP[loop/*]
      TAPI[testsprite/*]
      EAPI[e2b/*]
      LAUNCH[launch]
      SEC[security/scorecard]
      HEALTH[health]
      DASH[dashboard/summary]
    end

    subgraph Lib["lib/*"]
      CFG[config.ts]
      SES[github-session.ts]
      GEM[gemini.ts]
      TSC[testsprite-client.ts]
      E2BC[e2b-client.ts]
      RUN[run-store.ts]
      SC[security-scorecard.ts]
      RED[http-redirect.ts]
    end

    subgraph Packages["packages/*"]
      LE[loop-engine<br/>commands · contracts]
      LS[loop-state<br/>legal transitions]
    end

    subgraph Domain
      RL[apps/release-lab<br/>deterministic UI]
      AG[agents-catalog.ts]
    end
  end

  UI --> Routes
  ID --> AUTH
  Routes --> Lib
  GAPI --> LE
  LOOP --> LS
  LOOP --> GEM
  AI --> GEM
  LAUNCH --> SC
  SEC --> SC
  AUTH --> SES
  AUTH --> RED
  AUTH --> CFG
```

---

## 4. Repository map

```
proofsmith/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Marketing + four steps + Loop Theater
│   ├── layout.tsx · globals.css
│   ├── ai/                       # Gemini chat console
│   ├── agents/                   # Agent roster UI
│   ├── dashboard/                # Integration board
│   ├── launch/                   # One-click preflight
│   ├── security/                 # Scorecard UI
│   ├── submit/                   # Judge pack UI
│   ├── loop/ · loops/            # Four-step guide + run ledger
│   ├── settings/ · integrations/
│   ├── components/AppShell.tsx
│   └── api/                      # REST (see §18)
├── lib/                          # Server-only integrations
├── packages/
│   ├── loop-engine/              # parseCommand, contracts, sticky comments
│   └── loop-state/               # transition() legal table
├── apps/release-lab/             # Reference app for TestSprite plans
├── .testsprite/plans/            # viewer-approval · exact-once · rollback
├── .proofsmith/                  # policy.yml · config.yml
├── .github/workflows/            # quality · loop · testsprite · production
├── tests/                        # Vitest unit suite
├── docs/                         # This architecture + API + deploy guides
├── LOOP.md · SUBMISSION.md · README.md
└── vercel.json · package.json · .env.example
```

---

## 5. Request lifecycle

Every browser/API call follows the same outer shell.

```mermaid
sequenceDiagram
  participant B as Browser
  participant N as Next.js route
  participant L as lib/* helper
  participant X as External API

  B->>N: HTTP request
  N->>N: Validate env / session / body (zod)
  alt missing secret
    N-->>B: 503 { error, message } no secrets leaked
  else ok
    N->>L: business logic
    L->>X: signed/authenticated call
    X-->>L: result
    L-->>N: normalized DTO
    N-->>B: JSON / redirect (mutable Headers)
  end
```

**Critical implementation note:** `Response.redirect()` headers are **immutable** on Vercel/undici. OAuth sets cookies via `lib/http-redirect.ts` (`redirectWithCookies`), not `response.headers.append` on a redirect Response (that caused production 500s).

---

## 6. Maker–checker loop

Conceptual roles (fixed):

| Role | Actor | Tools | May merge? |
|------|--------|-------|------------|
| **Maker** | Gemini agent | `/api/ai/agent`, `/api/loop/iterate`, optional E2B | **No** |
| **Checker** | TestSprite CLI/cloud | Live `APP_URL`, plan files | **No** (only verdicts) |
| **Human** | Collaborator | GitHub merge UI | **Yes** |

```mermaid
stateDiagram-v2
  [*] --> Write: issue / contract
  Write --> Verify: maker ships SHA
  Verify --> Fix: TestSprite RED
  Verify --> HumanGate: TestSprite GREEN
  Fix --> VerifyAgain: repaired SHA
  VerifyAgain --> Fix: still RED
  VerifyAgain --> HumanGate: GREEN
  HumanGate --> [*]: merge + production verify
```

---

## 7. Four-step sequence

```mermaid
sequenceDiagram
  participant M as Maker Gemini
  participant P as Proofsmith
  participant T as TestSprite
  participant H as Human

  Note over M,H: 01 Write
  M->>P: POST /api/ai/agent or /api/loop/iterate
  P->>M: plan / patch proposal
  Note over M,H: 02 Verify
  P->>T: create/run plan --target-url APP_URL
  T->>P: HTTP against live app
  alt fail
    T-->>P: failure bundle
    Note over M,H: 03 Fix
    P->>M: failureBundle in context
    M-->>P: repair plan
    Note over M,H: 04 Verify again
    P->>T: rerun
    T-->>P: pass/fail
  else pass
    T-->>P: banked pass
    P->>H: AWAITING_HUMAN — human merges
  end
```

---

## 8. Loop state machine

Source of truth: `packages/loop-state/index.ts`.

### Active states

`DISCOVERED → TRIAGING → CONTRACTED → PLANNING → WORKTREE_READY → BUILDING → LOCAL_RED|LOCAL_GREEN → PREVIEW_* → TESTSPRITE_* → REPAIRING → REVIEW_* → CHALLENGE_* → VERIFIED → AWAITING_HUMAN → MERGED → PRODUCTION_* → MEMORY_BANKED → SUCCESS`

### Terminal states

`SUCCESS · BLOCKED · STALLED · REJECTED · ABORTED · BUDGET_EXHAUSTED · SECURITY_STOP · FAILED`

### Illegal by construction

```mermaid
flowchart LR
  B[BUILDING] -.->|ILLEGAL| S[SUCCESS]
  B --> LR[LOCAL_RED]
  B --> LG[LOCAL_GREEN]
```

`transition()` throws if `legal[previous]` does not include `next`.

### Happy path (simplified)

```mermaid
flowchart TD
  D[DISCOVERED] --> T[TRIAGING]
  T --> C[CONTRACTED]
  C --> P[PLANNING]
  P --> W[WORKTREE_READY]
  W --> B[BUILDING]
  B --> LG[LOCAL_GREEN]
  LG --> PP[PREVIEW_PENDING]
  PP --> PR[PREVIEW_READY]
  PR --> TR[TESTSPRITE_RUNNING]
  TR --> REV[REVIEW_RUNNING]
  REV --> CH[CHALLENGE_RUNNING]
  CH --> CR[CHALLENGE_RED]
  CR --> V[VERIFIED]
  V --> AH[AWAITING_HUMAN]
  AH --> M[MERGED]
  M --> PO[PRODUCTION_RUNNING]
  PO --> PV[PRODUCTION_VERIFIED]
  PV --> MB[MEMORY_BANKED]
  MB --> OK[SUCCESS]
```

### Repair path

```mermaid
flowchart LR
  TR[TESTSPRITE_RED] --> R[REPAIRING]
  R --> LG[LOCAL_GREEN]
  LG --> TR2[TESTSPRITE_RUNNING]
```

---

## 9. GitHub OAuth sequence

```mermaid
sequenceDiagram
  participant U as User
  participant P as Proofsmith
  participant G as GitHub

  U->>P: GET /api/auth/github
  P->>P: random state · Set-Cookie ps_oauth_state
  P-->>U: 302 Location authorize
  U->>G: login + consent
  G-->>U: redirect callback?code&state
  U->>P: GET /api/auth/github/callback
  P->>P: validate state cookie
  P->>G: exchange code → access_token
  P->>G: GET /user
  P->>P: sealSession AES-GCM → cookie ps_session
  P-->>U: 302 /dashboard?auth=connected
```

**Env:** `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `SESSION_SECRET`, `APP_URL`  
**Callback must match:** `{APP_URL}/api/auth/github/callback`

---

## 10. Webhook command pipeline

```mermaid
flowchart TD
  A[GitHub issue_comment] --> B{payload size OK?}
  B -->|no| R413[413]
  B -->|yes| C{HMAC sha256 valid?}
  C -->|no| R401[401]
  C -->|yes| D{delivery id new?}
  D -->|duplicate| R202d[202 duplicate]
  D -->|yes| E{event = issue_comment?}
  E -->|no| R202i[202 ignored]
  E -->|yes| F{parse /proofsmith cmd}
  F -->|null| R202n[202 not_a_command]
  F -->|ok| G{trusted association?}
  G -->|no| R403[403]
  G -->|yes| H{PROOFSMITH_GITHUB_TOKEN?}
  H -->|no| R202dry[202 dry-run]
  H -->|yes| I[sticky contract comment]
  I --> J{command = start?}
  J -->|yes| K[workflow_dispatch]
  J -->|no| L[202 accepted]
  K --> L
```

Commands (allowlist): `plan · start · status · verify · repair · review · challenge · explain · replay · pause · resume · stop · resolve-comments · fix-ci · fix-conflicts · release`

---

## 11. Gemini model selection

```mermaid
flowchart TD
  A[POST /api/ai/agent] --> B[Ignore client model field]
  B --> C[listModels API]
  C --> D[Filter generateContent only]
  D --> E[Exclude TTS / image / embed]
  E --> F[Score: 3.1-pro > 3-pro > 2.5-pro > flash]
  F --> G[Winner model id]
  G --> H[generateContent]
  H --> I[Return text + model used<br/>selection=server-auto]
```

Client **never** receives a full model catalog for shopping. `/api/ai/models` returns readiness + the single selected model only.

---

## 12. TestSprite checker path

```mermaid
flowchart LR
  subgraph Local
    PLAN[.testsprite/plans/*.json]
    CLI[@testsprite/testsprite-cli]
  end
  subgraph Proofsmith
    FAC[/api/testsprite/*]
  end
  subgraph Cloud
    API[api.testsprite.com/api/cli/v1]
    RUN[Browser run vs APP_URL]
  end

  PLAN --> CLI
  CLI --> API
  FAC --> API
  API --> RUN
  RUN -->|pass/fail + artifacts| CLI
  CLI -->|bank| LOOPMD[LOOP.md iteration]
```

Plans in-repo:

| Plan | Intent |
|------|--------|
| `viewer-approval.plan.json` | Viewer cannot approve release |
| `exact-once-deploy.plan.json` | Deploy is exact-once |
| `rollback-audit-focus.plan.json` | Rollback leaves audit trail |

---

## 13. E2B sandbox path

```mermaid
sequenceDiagram
  participant UI as Dashboard / API
  participant P as /api/e2b/*
  participant E as E2B API

  UI->>P: GET /status
  P->>E: list sandboxes probe
  E-->>P: ok/fail
  UI->>P: POST /sandbox
  P->>E: create template sandbox
  E-->>P: sandbox id
  UI->>P: DELETE /sandbox?id=
  P->>E: kill
```

Optional for isolated maker worktrees. Missing key → scorecard still launchable if other critical gates pass.

---

## 14. Agent roster

Defined in `lib/agents-catalog.ts` (all `canApproveMerge: false`).

```mermaid
flowchart TB
  subgraph Ingestion
    TRI[Triage]
    CON[Contract]
  end
  subgraph Build
    MAK[Maker · Gemini]
    ORC[Gemini Orchestrator]
    LOC[Local Checker]
    PRE[Preview Deployer]
  end
  subgraph Verify
    TS[TestSprite Checker]
    REV[Reviewer · Gemini]
    CHA[Shadow Challenger]
    PROD[Production Verifier]
  end
  subgraph Close
    MEM[Memory Banker]
  end

  TRI --> CON --> MAK --> LOC --> PRE --> TS
  TS -->|red| MAK
  TS -->|green| REV --> CHA --> PROD --> MEM
```

---

## 15. Security boundaries

```mermaid
flowchart TB
  subgraph Public browser
    HTML[Pages]
    JS[Client fetch]
  end

  subgraph Trust boundary
    API[API routes]
    ENV[process.env secrets]
  end

  subgraph Outside
    GH[GitHub]
    GE[Gemini]
    TS[TestSprite]
  end

  HTML --> JS
  JS -->|cookies only · no secrets| API
  API --> ENV
  API --> GH & GE & TS
  ENV -.->|never serialized| JS
```

| Control | Location |
|---------|----------|
| Session seal AES-GCM | `lib/github-session.ts` |
| OAuth state CSRF cookie | `ps_oauth_state` |
| Webhook HMAC constant-time | `app/api/github/webhook` |
| Secure cookies on HTTPS | `lib/http-redirect` + cookie helper |
| Scorecard critical gates | `lib/security-scorecard.ts` |

---

## 16. Pre-launch scorecard

```mermaid
flowchart LR
  A[/api/security/scorecard] --> B[Weighted checks]
  B --> C{critical fails?}
  C -->|yes| D[readyToLaunch=false]
  C -->|no + score≥70| E[readyToLaunch=true]
  B --> F[Grade A–F]
```

`/api/launch` aggregates scorecard + Gemini/TestSprite/E2B/GitHub probes for one-click preflight.

---

## 17. Data stores

| Store | Durability | Contents |
|-------|------------|----------|
| Encrypted session cookie | Client, 8h | User + access token |
| `lib/run-store` | Process memory | Demo loop runs |
| GitHub issue comments | GitHub | Sticky loop contracts |
| `LOOP.md` | Git | Agent iteration evidence |
| TestSprite cloud | TestSprite | Runs + artifacts |
| Vercel env | Host | All secrets |

**Not yet:** durable multi-instance run DB (noted as limitation).

---

## 18. API surface map

```mermaid
mindmap
  root((/api))
    health
    launch
    security/scorecard
    auth
      github
      github/callback
      me
      logout
    github
      repos
      issues
      webhook
    ai
      status
      models
      agent
    loop
      runs
      iterate
    testsprite
      status
      projects
      tests
      run
    e2b
      status
      sandbox
    agents
    dashboard/summary
```

Full field reference: [API.md](./API.md).

---

## 19. Deployment topology

```mermaid
flowchart LR
  DEV[Developer laptop<br/>npm run dev :3000] --> GH[(GitHub main)]
  GH --> V[Vercel build<br/>next build · Node 22]
  V --> EDGE[proofsmith.vercel.app]
  EDGE --> ENV[Vercel env secrets]
  EDGE --> GHO[GitHub OAuth App<br/>callback = APP_URL/...]
  EDGE --> GEM[Gemini]
  EDGE --> TSC[TestSprite]
  EDGE --> E2B[E2B]
```

| Concern | Setting |
|---------|---------|
| Framework | Next.js (`vercel.json`) |
| Build | `npm run build` → `next build` |
| Node | `22.x` (`.nvmrc`) |
| Region | `iad1` |

---

## 20. Failure modes

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `/api/auth/github` 500 | Immutable redirect + Set-Cookie | Use `redirectWithCookies` (fixed `7e1ac20`) |
| OAuth 503 | Missing CLIENT_ID | Set Vercel env |
| `auth=invalid_state` | Cookie/domain/APP_URL mismatch | Align `APP_URL` + callback |
| `auth=exchange_failed` | Wrong secret / redirect_uri | Match OAuth app config |
| TestSprite red | App bug or brittle plan | Fix code or plan; rerun |
| Scorecard blocked | Critical env missing | `/settings` checklist |
| vinext build fail | Old commit / Sites plugin | Use latest main + `next build` |

---

## 21. Related docs

| Doc | Purpose |
|-----|---------|
| [README.md](../README.md) | A–Z product overview |
| [API.md](./API.md) | Endpoint reference |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Vercel + OAuth + checker |
| [ENVIRONMENT.md](./ENVIRONMENT.md) | Env var encyclopedia |
| [TESTING.md](./TESTING.md) | Vitest + TestSprite |
| [LOOP.md](../LOOP.md) | Iteration evidence |
| [SUBMISSION.md](../SUBMISSION.md) | Judge pack |
| [SECURITY.md](../SECURITY.md) | Reporting + model |

---

*Architecture is code-backed: if diagrams and `packages/loop-state` diverge, trust the TypeScript.*
