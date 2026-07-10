import { describe, expect, it } from "vitest";
import { createRun, getRun, listRuns } from "../lib/run-store";

describe("loop run store", () => {
  it("seeds and creates runs", () => {
    const before = listRuns().length;
    const run = createRun({
      issueNumber: 99,
      title: "Test run from unit suite",
      repo: "SahilRakhaiya05/proofsmith",
      actor: "vitest",
    });
    expect(run.state).toBe("DISCOVERED");
    expect(getRun(run.id)?.actor).toBe("vitest");
    expect(listRuns().length).toBeGreaterThanOrEqual(before);
  });
});
