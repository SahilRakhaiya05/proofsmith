import { z } from "zod";

export const loopStates = [
  "DISCOVERED", "TRIAGING", "NEEDS_HUMAN", "CONTRACTED", "PLANNING",
  "WORKTREE_READY", "BUILDING", "LOCAL_RED", "LOCAL_GREEN", "PREVIEW_PENDING",
  "PREVIEW_READY", "TESTSPRITE_RUNNING", "TESTSPRITE_RED", "REPAIRING",
  "REVIEW_RUNNING", "REVIEW_RED", "CHALLENGE_RUNNING", "CHALLENGE_RED",
  "VERIFIED", "AWAITING_HUMAN", "MERGED", "PRODUCTION_RUNNING",
  "PRODUCTION_RED", "PRODUCTION_VERIFIED", "MEMORY_BANKED",
] as const;

export const terminalStates = [
  "SUCCESS", "BLOCKED", "STALLED", "REJECTED", "ABORTED",
  "BUDGET_EXHAUSTED", "SECURITY_STOP", "FAILED",
] as const;

export const LoopStateSchema = z.enum(loopStates);
export const TerminalStateSchema = z.enum(terminalStates);
export type LoopState = z.infer<typeof LoopStateSchema>;
export type TerminalState = z.infer<typeof TerminalStateSchema>;

const legal: Record<LoopState, readonly (LoopState | TerminalState)[]> = {
  DISCOVERED: ["TRIAGING", "ABORTED"],
  TRIAGING: ["NEEDS_HUMAN", "CONTRACTED", "REJECTED", "SECURITY_STOP"],
  NEEDS_HUMAN: ["TRIAGING", "ABORTED"],
  CONTRACTED: ["PLANNING", "ABORTED"],
  PLANNING: ["WORKTREE_READY", "NEEDS_HUMAN", "BLOCKED", "BUDGET_EXHAUSTED"],
  WORKTREE_READY: ["BUILDING", "BLOCKED"],
  BUILDING: ["LOCAL_RED", "LOCAL_GREEN", "BUDGET_EXHAUSTED", "SECURITY_STOP"],
  LOCAL_RED: ["REPAIRING", "STALLED", "BUDGET_EXHAUSTED"],
  LOCAL_GREEN: ["PREVIEW_PENDING", "REVIEW_RUNNING"],
  PREVIEW_PENDING: ["PREVIEW_READY", "BLOCKED"],
  PREVIEW_READY: ["TESTSPRITE_RUNNING", "BLOCKED"],
  TESTSPRITE_RUNNING: ["TESTSPRITE_RED", "REVIEW_RUNNING", "BLOCKED"],
  TESTSPRITE_RED: ["REPAIRING", "STALLED", "BUDGET_EXHAUSTED"],
  REPAIRING: ["LOCAL_RED", "LOCAL_GREEN", "STALLED", "BUDGET_EXHAUSTED"],
  REVIEW_RUNNING: ["REVIEW_RED", "CHALLENGE_RUNNING"],
  REVIEW_RED: ["REPAIRING", "STALLED"],
  CHALLENGE_RUNNING: ["CHALLENGE_RED", "BLOCKED"],
  CHALLENGE_RED: ["VERIFIED", "BLOCKED"],
  VERIFIED: ["AWAITING_HUMAN"],
  AWAITING_HUMAN: ["MERGED", "REJECTED", "ABORTED"],
  MERGED: ["PRODUCTION_RUNNING"],
  PRODUCTION_RUNNING: ["PRODUCTION_RED", "PRODUCTION_VERIFIED"],
  PRODUCTION_RED: ["BLOCKED", "FAILED"],
  PRODUCTION_VERIFIED: ["MEMORY_BANKED"],
  MEMORY_BANKED: ["SUCCESS"],
};

export const TransitionSchema = z.object({
  previous: LoopStateSchema,
  next: z.union([LoopStateSchema, TerminalStateSchema]),
  timestamp: z.string().datetime(),
  actor: z.string().min(1),
  trigger: z.string().min(1),
  inputArtifact: z.string().optional(),
  outputArtifact: z.string().optional(),
  verificationResult: z.enum(["pending", "pass", "fail", "not_applicable"]),
  commitSha: z.string().regex(/^[a-f0-9]{7,40}$/i).optional(),
  reason: z.string().min(1),
});

export type Transition = z.infer<typeof TransitionSchema>;

export function transition(record: Transition): Transition {
  const parsed = TransitionSchema.parse(record);
  if (!legal[parsed.previous].includes(parsed.next)) {
    throw new Error(`Illegal Proofsmith transition: ${parsed.previous} -> ${parsed.next}`);
  }
  return parsed;
}

export function canTransition(from: LoopState, to: LoopState | TerminalState) {
  return legal[from].includes(to);
}
