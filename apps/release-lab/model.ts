export type Role = "Viewer" | "Approver" | "Release Manager" | "Auditor";
export type ReleaseStatus = "Draft" | "Awaiting Approval" | "Approved" | "Deploying" | "Deployed" | "Rolled Back";

export type AuditEvent = { id: number; action: string; actor: Role; detail: string };
export type ReleaseState = {
  role: Role;
  status: ReleaseStatus;
  version: string;
  riskChecked: boolean;
  emergencyStopped: boolean;
  feedback: string;
  audit: AuditEvent[];
};

export type ReleaseAction =
  | { type: "SET_ROLE"; role: Role }
  | { type: "TOGGLE_RISK" }
  | { type: "SUBMIT" }
  | { type: "APPROVE" }
  | { type: "BEGIN_DEPLOY" }
  | { type: "COMPLETE_DEPLOY" }
  | { type: "EMERGENCY_STOP" }
  | { type: "ROLLBACK" }
  | { type: "RESET" };

export const initialReleaseState: ReleaseState = {
  role: "Viewer",
  status: "Draft",
  version: "v2.4.0",
  riskChecked: false,
  emergencyStopped: false,
  feedback: "Release candidate ready for risk review.",
  audit: [{ id: 1, action: "release.created", actor: "Release Manager", detail: "v2.4.0 created" }],
};

function reject(state: ReleaseState, feedback: string): ReleaseState {
  return { ...state, feedback };
}

function append(state: ReleaseState, action: string, detail: string): AuditEvent[] {
  return [...state.audit, { id: state.audit.length + 1, action, actor: state.role, detail }];
}

export function releaseReducer(state: ReleaseState, action: ReleaseAction): ReleaseState {
  switch (action.type) {
    case "SET_ROLE": return { ...state, role: action.role, feedback: `Acting as ${action.role}.` };
    case "TOGGLE_RISK": return state.status === "Draft" ? { ...state, riskChecked: !state.riskChecked, feedback: "Risk checklist updated." } : reject(state, "Risk checks are locked after submission.");
    case "SUBMIT":
      if (state.status !== "Draft" || !state.riskChecked) return reject(state, "Complete risk checks before submitting.");
      return { ...state, status: "Awaiting Approval", feedback: "Submitted for approval.", audit: append(state, "release.submitted", "Risk checks complete") };
    case "APPROVE":
      if (state.role !== "Approver") return reject(state, `${state.role}s cannot approve releases. No state changed.`);
      if (state.status !== "Awaiting Approval") return reject(state, "Only a release awaiting approval can be approved.");
      return { ...state, status: "Approved", feedback: "Release approved.", audit: append(state, "release.approved", "Approval granted") };
    case "BEGIN_DEPLOY":
      if (state.role !== "Release Manager") return reject(state, `${state.role}s cannot deploy releases. No state changed.`);
      if (state.emergencyStopped) return reject(state, "Deployment blocked by emergency stop.");
      if (state.status !== "Approved") return reject(state, "Only an approved release can deploy.");
      return { ...state, status: "Deploying", feedback: "Deployment in progress…", audit: append(state, "deployment.started", "Exactly-once deployment lock acquired") };
    case "COMPLETE_DEPLOY":
      if (state.status !== "Deploying") return state;
      return { ...state, status: "Deployed", feedback: "Deployment completed.", audit: append(state, "deployment.completed", "Production updated") };
    case "EMERGENCY_STOP":
      if (state.status === "Deployed" || state.status === "Rolled Back") return reject(state, "Emergency stop cannot alter a completed deployment.");
      return { ...state, emergencyStopped: true, feedback: "Emergency stop engaged. Deployment is blocked.", audit: append(state, "deployment.stopped", "Emergency stop engaged") };
    case "ROLLBACK":
      if (state.role !== "Release Manager") return reject(state, "Only a Release Manager can roll back.");
      if (state.status !== "Deployed") return reject(state, "Rollback requires a completed deployment.");
      return { ...state, status: "Rolled Back", feedback: "Rollback completed. Audit history was preserved.", audit: append(state, "deployment.rolled_back", "Previous events preserved") };
    case "RESET": return structuredClone(initialReleaseState);
  }
}
