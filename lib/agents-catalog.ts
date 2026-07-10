export type AgentRole =
  | "triage"
  | "contract"
  | "maker"
  | "local-checker"
  | "preview"
  | "testsprite"
  | "reviewer"
  | "challenger"
  | "production"
  | "memory";

export type AgentDefinition = {
  id: string;
  name: string;
  role: AgentRole;
  summary: string;
  inputs: string[];
  outputs: string[];
  tools: string[];
  canApproveMerge: boolean;
  status: "ready" | "gated" | "simulated";
};

export const agents: AgentDefinition[] = [
  {
    id: "agent_triage",
    name: "Triage Agent",
    role: "triage",
    summary: "Classifies issues, extracts risk, and decides if a contract can be formed.",
    inputs: ["GitHub issue body", "labels", "repo policy"],
    outputs: ["triage decision", "risk level", "needs-human flag"],
    tools: ["GitHub Issues API", "policy.yml"],
    canApproveMerge: false,
    status: "ready",
  },
  {
    id: "agent_contract",
    name: "Contract Agent",
    role: "contract",
    summary: "Locks a falsifiable loop contract and posts the sticky issue comment.",
    inputs: ["issue", "triage result"],
    outputs: ["LoopContract", "sticky comment"],
    tools: ["GitHub Comments API", "loop-engine"],
    canApproveMerge: false,
    status: "ready",
  },
  {
    id: "agent_maker",
    name: "Maker Agent",
    role: "maker",
    summary: "Implements the smallest correction in an isolated E2B worktree sandbox.",
    inputs: ["contract", "failing evidence", "repo snapshot"],
    outputs: ["branch commits", "PR draft"],
    tools: ["E2B sandbox", "model provider", "git"],
    canApproveMerge: false,
    status: "gated",
  },
  {
    id: "agent_local",
    name: "Local Checker",
    role: "local-checker",
    summary: "Runs format, lint, typecheck, unit, build, and secret scan on the PR head.",
    inputs: ["commit SHA"],
    outputs: ["local gate result"],
    tools: ["npm test", "eslint", "tsc"],
    canApproveMerge: false,
    status: "ready",
  },
  {
    id: "agent_preview",
    name: "Preview Deployer",
    role: "preview",
    summary: "Deploys a preview URL for independent browser verification.",
    inputs: ["commit SHA"],
    outputs: ["preview URL"],
    tools: ["Vercel / Sites deploy"],
    canApproveMerge: false,
    status: "gated",
  },
  {
    id: "agent_testsprite",
    name: "TestSprite Checker",
    role: "testsprite",
    summary: "Independent user-visible verification via official TestSprite CLI facade.",
    inputs: ["preview URL", "plan files", "TESTSPRITE_PROJECT_ID"],
    outputs: ["run id", "pass/fail", "artifact bundle"],
    tools: ["@testsprite/testsprite-cli", "TestSprite cloud API"],
    canApproveMerge: false,
    status: "ready",
  },
  {
    id: "agent_reviewer",
    name: "Reviewer Agent",
    role: "reviewer",
    summary: "Independent code review against contract, security policy, and diff budget.",
    inputs: ["PR diff", "contract"],
    outputs: ["review verdict", "blocking comments"],
    tools: ["GitHub PR API", "model provider"],
    canApproveMerge: false,
    status: "gated",
  },
  {
    id: "agent_challenger",
    name: "Shadow Challenger",
    role: "challenger",
    summary: "Reintroduces the defect in isolation to prove the verifier still catches it.",
    inputs: ["verified branch", "original defect"],
    outputs: ["challenge red/green", "restore proof"],
    tools: ["E2B sandbox", "TestSprite"],
    canApproveMerge: false,
    status: "simulated",
  },
  {
    id: "agent_production",
    name: "Production Verifier",
    role: "production",
    summary: "Confirms the exact production commit still satisfies the contract.",
    inputs: ["production URL", "commit SHA"],
    outputs: ["production gate result"],
    tools: ["TestSprite production run", "health checks"],
    canApproveMerge: false,
    status: "gated",
  },
  {
    id: "agent_memory",
    name: "Memory Banker",
    role: "memory",
    summary: "Banks only verified, commit-scoped lessons after production success.",
    inputs: ["success run", "sanitized artifacts"],
    outputs: ["memory card"],
    tools: ["evidence store"],
    canApproveMerge: false,
    status: "ready",
  },
];

export function getAgent(id: string) {
  return agents.find((agent) => agent.id === id) || null;
}
