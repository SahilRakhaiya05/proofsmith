import { describe, expect, it } from "vitest";
import { pickBestModel, type GeminiModelInfo } from "../lib/gemini";

describe("gemini model picker", () => {
  it("prefers newest pro-class generateContent model", () => {
    const models: GeminiModelInfo[] = [
      { name: "gemini-2.0-flash", supportedGenerationMethods: ["generateContent"] },
      { name: "gemini-2.5-pro", supportedGenerationMethods: ["generateContent"] },
      { name: "gemini-3.1-pro-preview", supportedGenerationMethods: ["generateContent"] },
      { name: "text-embedding-004", supportedGenerationMethods: ["embedContent"] },
    ];
    expect(pickBestModel(models)).toBe("gemini-3.1-pro-preview");
  });

  it("falls back to 2.5 pro when previews absent", () => {
    const models: GeminiModelInfo[] = [
      { name: "gemini-2.5-flash", supportedGenerationMethods: ["generateContent"] },
      { name: "gemini-2.5-pro", supportedGenerationMethods: ["generateContent"] },
    ];
    expect(pickBestModel(models)).toBe("gemini-2.5-pro");
  });
});
