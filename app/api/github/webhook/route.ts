import { Octokit } from "@octokit/rest";
import { z } from "zod";
import { isTrustedAssociation, parseCommand, renderContractComment, type LoopContract } from "@/packages/loop-engine";

export const runtime = "nodejs";
const processed = new Set<string>();

const PayloadSchema = z.object({
  action: z.string(),
  comment: z.object({ body: z.string().max(20_000), author_association: z.string() }),
  issue: z.object({ number: z.number().int().positive(), title: z.string(), body: z.string().nullable() }),
  repository: z.object({ id: z.number().int(), name: z.string(), owner: z.object({ login: z.string() }) }),
  installation: z.object({ id: z.number().int() }).optional(),
  sender: z.object({ login: z.string() }),
});

function hex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index++) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}

async function validSignature(body: string, signature: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return constantTimeEqual(`sha256=${hex(digest)}`, signature.toLowerCase());
}

function contractFor(payload: z.infer<typeof PayloadSchema>): LoopContract {
  const summary = payload.issue.body?.trim() || payload.issue.title;
  return {
    runId: `ps_${payload.repository.id}_${payload.issue.number}`,
    issueNumber: payload.issue.number,
    title: payload.issue.title,
    problemStatement: summary.slice(0, 2_000),
    desiredOutcome: `Resolve issue #${payload.issue.number} with independently verified evidence.`,
    acceptanceCriteria: ["Reported behavior is no longer reproducible", "Invalid actions leave state unchanged", "Regression coverage passes", "Human approval is required before merge"],
    nonGoals: ["Unrelated refactoring", "Automatic merge"],
    constraints: ["No issue text may be executed as shell code", "All evidence must match the pull-request head SHA"],
    riskLevel: "medium",
    suspectedAreas: ["To be refined by repository exploration"],
    requiredChecks: ["format", "lint", "typecheck", "unit", "build", "secret scan"],
    requiredTestSpriteScenarios: ["Targeted scenario derived from the issue contract"],
    expectedUserVisibleBehavior: ["The observed result matches the contract and visible feedback"],
    humanApprovalRequired: true,
    maxBuildAttempts: 3, maxRepairAttempts: 3, maxReviewCycles: 2,
    maxChangedFiles: 12, maxChangedLines: 600, timeoutMinutes: 45,
    terminalStates: ["SUCCESS", "BLOCKED", "STALLED", "ABORTED", "BUDGET_EXHAUSTED", "SECURITY_STOP", "FAILED"],
  };
}

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 1_000_000) return Response.json({ error: "payload_too_large" }, { status: 413 });
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: "webhook_not_configured" }, { status: 503 });
  const raw = await request.text();
  const signature = request.headers.get("x-hub-signature-256") || "";
  if (!(await validSignature(raw, signature, secret))) return Response.json({ error: "invalid_signature" }, { status: 401 });

  const event = request.headers.get("x-github-event");
  const delivery = request.headers.get("x-github-delivery");
  if (!delivery) return Response.json({ error: "missing_delivery_id" }, { status: 400 });
  if (processed.has(delivery)) return Response.json({ accepted: true, duplicate: true });
  if (event !== "issue_comment") return Response.json({ accepted: false, ignored: "unsupported_event" }, { status: 202 });

  const parsed = PayloadSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) return Response.json({ error: "invalid_payload" }, { status: 400 });
  const payload = parsed.data;
  const command = parseCommand(payload.comment.body);
  if (!command) return Response.json({ accepted: false, ignored: "not_a_command" }, { status: 202 });
  if (!isTrustedAssociation(payload.comment.author_association)) return Response.json({ error: "unauthorized_actor", reason: "Only trusted repository collaborators may run Proofsmith." }, { status: 403 });
  processed.add(delivery);

  const token = process.env.PROOFSMITH_GITHUB_TOKEN;
  if (!token) return Response.json({ accepted: true, command, mode: "dry-run", reason: "PROOFSMITH_GITHUB_TOKEN is not configured" }, { status: 202 });

  const octokit = new Octokit({ auth: token });
  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;
  const issue_number = payload.issue.number;
  const contract = contractFor(payload);
  const marker = `<!-- proofsmith:${contract.runId} -->`;
  const comments = await octokit.issues.listComments({ owner, repo, issue_number, per_page: 100 });
  const sticky = comments.data.find((comment) => comment.body?.includes(marker));
  const body = renderContractComment(contract, command === "stop" ? "ABORTED" : "CONTRACTED");
  if (sticky) await octokit.issues.updateComment({ owner, repo, comment_id: sticky.id, body });
  else await octokit.issues.createComment({ owner, repo, issue_number, body });

  if (command === "start") {
    await octokit.actions.createWorkflowDispatch({ owner, repo, workflow_id: "proofsmith-loop.yml", ref: "main", inputs: { run_id: contract.runId, issue_number: String(issue_number), command, actor: payload.sender.login } });
  }
  return Response.json({ accepted: true, command, runId: contract.runId }, { status: 202 });
}
