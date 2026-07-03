import { describe, expect, it } from "vitest";
import { budgetStatus, isTrustedAssociation, parseCommand } from "../packages/loop-engine";
import { canTransition, transition } from "../packages/loop-state";

describe("Proofsmith command boundary", () => {
  it("parses only supported commands", () => {
    expect(parseCommand("/proofsmith start")).toBe("start");
    expect(parseCommand("/proofsmith rm -rf /")).toBeNull();
    expect(parseCommand("please /proofsmith start")).toBeNull();
  });
  it("trusts repository collaborators, not arbitrary commenters", () => {
    expect(isTrustedAssociation("MEMBER")).toBe(true);
    expect(isTrustedAssociation("NONE")).toBe(false);
  });
  it("enforces attempt budgets", () => {
    expect(budgetStatus(2, 3)).toBe("AVAILABLE");
    expect(budgetStatus(3, 3)).toBe("BUDGET_EXHAUSTED");
  });
});

describe("loop state machine", () => {
  it("allows a legal transition", () => {
    expect(canTransition("BUILDING", "LOCAL_GREEN")).toBe(true);
    expect(transition({ previous: "BUILDING", next: "LOCAL_GREEN", timestamp: new Date().toISOString(), actor: "maker", trigger: "checks passed", verificationResult: "pass", reason: "All deterministic local checks passed" }).next).toBe("LOCAL_GREEN");
  });
  it("refuses false completion", () => {
    expect(canTransition("BUILDING", "SUCCESS")).toBe(false);
    expect(() => transition({ previous: "BUILDING", next: "SUCCESS", timestamp: new Date().toISOString(), actor: "maker", trigger: "looks done", verificationResult: "pending", reason: "Maker tried to self-verify" })).toThrow(/Illegal Proofsmith transition/);
  });
});
