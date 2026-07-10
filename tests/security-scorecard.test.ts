import { describe, expect, it } from "vitest";
import { buildSecurityScorecard } from "../lib/security-scorecard";

describe("security scorecard", () => {
  it("returns grade and checks without secrets", () => {
    const card = buildSecurityScorecard();
    expect(card.score).toBeGreaterThanOrEqual(0);
    expect(card.score).toBeLessThanOrEqual(100);
    expect(["A", "B", "C", "D", "F"]).toContain(card.grade);
    expect(card.checks.length).toBeGreaterThan(5);
    expect(card.summary).not.toMatch(/AQ\.|sk-user|gho_/i);
    expect(JSON.stringify(card)).not.toMatch(/AQ\.|sk-user-/);
  });

  it("always passes human-merge policy check", () => {
    const card = buildSecurityScorecard();
    const human = card.checks.find((check) => check.id === "human_merge");
    expect(human?.pass).toBe(true);
  });
});
