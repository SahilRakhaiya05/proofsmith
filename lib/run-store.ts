import type { LoopState, TerminalState } from "@/packages/loop-state";

export type LoopRun = {
  id: string;
  issueNumber: number;
  title: string;
  repo: string;
  state: LoopState | TerminalState;
  agentId: string;
  actor: string;
  createdAt: string;
  updatedAt: string;
  evidence: Array<{ kind: string; label: string; status: "pending" | "pass" | "fail" | "n/a"; detail?: string }>;
  commitSha?: string;
  prUrl?: string;
  previewUrl?: string;
  testspriteRunId?: string;
};

/** Process-local store for demo dashboard runs. Durable store is a later hard requirement. */
const runs = new Map<string, LoopRun>();

function seedIfEmpty() {
  if (runs.size > 0) return;
  const now = Date.now();
  const seed: LoopRun[] = [
    {
      id: "ps_seed_24",
      issueNumber: 24,
      title: "Viewer can approve a release (should be read-only)",
      repo: "SahilRakhaiya05/proofsmith",
      state: "CONTRACTED",
      agentId: "agent_contract",
      actor: "system",
      createdAt: new Date(now - 86_400_000).toISOString(),
      updatedAt: new Date(now - 3_600_000).toISOString(),
      evidence: [
        { kind: "contract", label: "Sticky contract comment", status: "pass" },
        { kind: "local", label: "Unit + type + build", status: "pending" },
        { kind: "testsprite", label: "Viewer approval plan", status: "pending" },
        { kind: "human", label: "Merge approval", status: "n/a" },
      ],
    },
    {
      id: "ps_seed_18",
      issueNumber: 18,
      title: "Deploy must be exact-once under double click",
      repo: "SahilRakhaiya05/proofsmith",
      state: "TESTSPRITE_RUNNING",
      agentId: "agent_testsprite",
      actor: "system",
      createdAt: new Date(now - 172_800_000).toISOString(),
      updatedAt: new Date(now - 900_000).toISOString(),
      evidence: [
        { kind: "contract", label: "Contract locked", status: "pass" },
        { kind: "local", label: "Local green", status: "pass" },
        { kind: "preview", label: "Preview deploy", status: "pass", detail: "awaiting external URL" },
        { kind: "testsprite", label: "Exact-once deploy plan", status: "pending" },
      ],
      commitSha: "6eee85d",
    },
  ];
  for (const run of seed) runs.set(run.id, run);
}

export function listRuns() {
  seedIfEmpty();
  return [...runs.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getRun(id: string) {
  seedIfEmpty();
  return runs.get(id) || null;
}

export function createRun(input: {
  issueNumber: number;
  title: string;
  repo: string;
  actor: string;
}) {
  seedIfEmpty();
  const id = `ps_${Date.now().toString(36)}_${input.issueNumber}`;
  const now = new Date().toISOString();
  const run: LoopRun = {
    id,
    issueNumber: input.issueNumber,
    title: input.title,
    repo: input.repo,
    state: "DISCOVERED",
    agentId: "agent_triage",
    actor: input.actor,
    createdAt: now,
    updatedAt: now,
    evidence: [
      { kind: "triage", label: "Issue received", status: "pass" },
      { kind: "contract", label: "Contract", status: "pending" },
      { kind: "local", label: "Local checks", status: "pending" },
      { kind: "testsprite", label: "TestSprite", status: "pending" },
      { kind: "human", label: "Human merge", status: "n/a" },
    ],
  };
  runs.set(id, run);
  return run;
}

export function updateRun(id: string, patch: Partial<LoopRun>) {
  seedIfEmpty();
  const existing = runs.get(id);
  if (!existing) return null;
  const next = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  runs.set(id, next);
  return next;
}
