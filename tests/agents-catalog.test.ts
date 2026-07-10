import { describe, expect, it } from "vitest";
import { agents, getAgent } from "../lib/agents-catalog";

describe("agent roster", () => {
  it("includes TestSprite and E2B-capable agents", () => {
    expect(agents.length).toBeGreaterThanOrEqual(8);
    expect(getAgent("agent_testsprite")?.tools.join(" ")).toMatch(/TestSprite/i);
    expect(getAgent("agent_maker")?.tools.join(" ")).toMatch(/E2B/i);
  });

  it("never grants merge approval to automation agents", () => {
    for (const agent of agents) {
      expect(agent.canApproveMerge).toBe(false);
    }
  });
});
