import { z } from "zod";

export const ProofsmithCommandSchema = z.enum([
  "plan", "start", "status", "verify", "repair", "review", "challenge",
  "explain", "replay", "pause", "resume", "stop", "resolve-comments",
  "fix-ci", "fix-conflicts", "release",
]);
export type ProofsmithCommand = z.infer<typeof ProofsmithCommandSchema>;

export const LoopContractSchema = z.object({
  runId: z.string().regex(/^ps_[a-zA-Z0-9_-]+$/),
  issueNumber: z.number().int().positive(),
  title: z.string().min(3),
  problemStatement: z.string().min(10),
  desiredOutcome: z.string().min(5),
  acceptanceCriteria: z.array(z.string().min(3)).min(1),
  nonGoals: z.array(z.string()),
  constraints: z.array(z.string()),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  suspectedAreas: z.array(z.string()),
  requiredChecks: z.array(z.string()).min(1),
  requiredTestSpriteScenarios: z.array(z.string()),
  expectedUserVisibleBehavior: z.array(z.string()).min(1),
  humanApprovalRequired: z.literal(true),
  maxBuildAttempts: z.number().int().positive().max(10),
  maxRepairAttempts: z.number().int().positive().max(10),
  maxReviewCycles: z.number().int().positive().max(10),
  maxChangedFiles: z.number().int().positive(),
  maxChangedLines: z.number().int().positive(),
  timeoutMinutes: z.number().int().positive(),
  terminalStates: z.array(z.string()).min(1),
});

export type LoopContract = z.infer<typeof LoopContractSchema>;

export function parseCommand(body: string): ProofsmithCommand | null {
  const match = body.trim().match(/^\/proofsmith\s+([a-z-]+)(?:\s|$)/i);
  if (!match) return null;
  const parsed = ProofsmithCommandSchema.safeParse(match[1].toLowerCase());
  return parsed.success ? parsed.data : null;
}

const trustedAssociations = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);
export function isTrustedAssociation(association: string) {
  return trustedAssociations.has(association.toUpperCase());
}

export function budgetStatus(attempts: number, maxAttempts: number) {
  return attempts >= maxAttempts ? "BUDGET_EXHAUSTED" : "AVAILABLE";
}

export function renderContractComment(contract: LoopContract, state: string) {
  const criteria = contract.acceptanceCriteria.map((item) => `- [ ] ${item}`).join("\n");
  return `## Proofsmith Loop Contract\n\n<!-- proofsmith:${contract.runId} -->\n` +
    `**State:** \`${state}\` · **Risk:** ${contract.riskLevel} · **Run:** \`${contract.runId}\`\n\n` +
    `### Problem\n${contract.problemStatement}\n\n### Success criteria\n${criteria}\n\n` +
    `### Non-goals\n${contract.nonGoals.map((item) => `- ${item}`).join("\n") || "- None declared"}\n\n` +
    `### Verification\n${contract.requiredChecks.map((item) => `- ${item}`).join("\n")}\n\n` +
    `**Next action:** Build is gated on this falsifiable contract. Human approval remains required.`;
}
