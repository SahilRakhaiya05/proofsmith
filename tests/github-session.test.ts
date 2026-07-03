import { describe, expect, it } from "vitest";
import { openSession, sealSession } from "../lib/github-session";

const secret = "test-only-secret-that-is-long-enough-to-be-safe";
const session = { user: { id: 1, login: "proofsmith-test", avatar_url: "https://example.com/avatar.png", html_url: "https://github.com/proofsmith-test", name: null }, accessToken: "gho_test_token_long_enough_for_schema", expiresAt: Date.now() + 60_000 };

describe("encrypted GitHub session", () => {
  it("round-trips a valid session", async () => {
    const sealed = await sealSession(session, secret);
    expect(await openSession(sealed, secret)).toEqual(session);
    expect(sealed).not.toContain(session.accessToken);
  });
  it("rejects tampering", async () => {
    const sealed = await sealSession(session, secret);
    expect(await openSession(`${sealed.slice(0, -1)}x`, secret)).toBeNull();
  });
});
