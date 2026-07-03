import { describe, expect, it } from "vitest";
import { initialReleaseState, releaseReducer, type ReleaseState } from "../apps/release-lab/model";

function awaiting(role: ReleaseState["role"]): ReleaseState {
  return { ...structuredClone(initialReleaseState), role, status: "Awaiting Approval", riskChecked: true };
}

describe("ReleaseLab authorization", () => {
  it("rejects viewer approval without changing state or audit", () => {
    const state = awaiting("Viewer");
    const next = releaseReducer(state, { type: "APPROVE" });
    expect(next.status).toBe("Awaiting Approval");
    expect(next.audit).toEqual(state.audit);
    expect(next.feedback).toContain("cannot approve");
  });
  it("allows an approver exactly in the awaiting state", () => {
    const next = releaseReducer(awaiting("Approver"), { type: "APPROVE" });
    expect(next.status).toBe("Approved");
    expect(next.audit.at(-1)?.action).toBe("release.approved");
  });
  it("deploys exactly once", () => {
    const approved: ReleaseState = { ...awaiting("Release Manager"), status: "Approved" };
    const first = releaseReducer(approved, { type: "BEGIN_DEPLOY" });
    const duplicate = releaseReducer(first, { type: "BEGIN_DEPLOY" });
    expect(duplicate.status).toBe("Deploying");
    expect(duplicate.audit.filter((event) => event.action === "deployment.started")).toHaveLength(1);
  });
  it("preserves audit history on rollback", () => {
    const deployed: ReleaseState = { ...awaiting("Release Manager"), status: "Deployed", audit: [...initialReleaseState.audit, { id: 2, action: "deployment.completed", actor: "Release Manager", detail: "done" }] };
    const next = releaseReducer(deployed, { type: "ROLLBACK" });
    expect(next.audit.slice(0, deployed.audit.length)).toEqual(deployed.audit);
    expect(next.audit.at(-1)?.action).toBe("deployment.rolled_back");
  });
  it("reset is deterministic", () => {
    expect(releaseReducer(awaiting("Auditor"), { type: "RESET" })).toEqual(initialReleaseState);
  });
});
