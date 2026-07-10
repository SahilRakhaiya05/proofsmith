import { describe, expect, it } from "vitest";
import { testspriteBaseUrl } from "../lib/config";

describe("config helpers", () => {
  it("builds TestSprite facade base URL", () => {
    expect(testspriteBaseUrl()).toContain("/api/cli/v1");
  });
});
