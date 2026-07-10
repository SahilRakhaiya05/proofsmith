import { describe, expect, it } from "vitest";
import { pickBestModel, scoreModelForProofsmith, type GeminiModelInfo } from "../lib/gemini";

describe("gemini model picker (server-side)", () => {
  it("prefers newest pro-class generateContent model over flash/list noise", () => {
    const models: GeminiModelInfo[] = [
      { name: "gemini-2.0-flash", supportedGenerationMethods: ["generateContent"] },
      { name: "gemini-2.5-pro", supportedGenerationMethods: ["generateContent"], inputTokenLimit: 1_000_000 },
      { name: "gemini-3.1-pro-preview", supportedGenerationMethods: ["generateContent"], inputTokenLimit: 1_000_000 },
      { name: "gemini-2.5-pro-preview-tts", supportedGenerationMethods: ["generateContent"] },
      { name: "text-embedding-004", supportedGenerationMethods: ["embedContent"] },
      { name: "gemini-2.5-flash-image", supportedGenerationMethods: ["generateContent"] },
    ];
    expect(pickBestModel(models)).toBe("gemini-3.1-pro-preview");
    expect(scoreModelForProofsmith(models[2]!)).toBeGreaterThan(scoreModelForProofsmith(models[1]!));
  });

  it("falls back to 2.5 pro when previews absent", () => {
    const models: GeminiModelInfo[] = [
      { name: "gemini-2.5-flash", supportedGenerationMethods: ["generateContent"] },
      { name: "gemini-2.5-pro", supportedGenerationMethods: ["generateContent"] },
    ];
    expect(pickBestModel(models)).toBe("gemini-2.5-pro");
  });

  it("never ranks tts/image/embed as best coding model", () => {
    const models: GeminiModelInfo[] = [
      { name: "gemini-2.5-pro-preview-tts", supportedGenerationMethods: ["generateContent"] },
      { name: "gemini-2.5-flash-image", supportedGenerationMethods: ["generateContent"] },
      { name: "gemini-2.5-flash", supportedGenerationMethods: ["generateContent"] },
    ];
    expect(pickBestModel(models)).toBe("gemini-2.5-flash");
  });
});
