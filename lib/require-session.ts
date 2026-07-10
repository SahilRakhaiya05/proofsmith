import { openSession, readCookie, type GitHubSession } from "@/lib/github-session";

export async function requireSession(request: Request): Promise<
  | { ok: true; session: GitHubSession }
  | { ok: false; response: Response }
> {
  const secret = process.env.SESSION_SECRET;
  const value = readCookie(request, "ps_session");
  if (!secret || !value) {
    return { ok: false, response: Response.json({ error: "unauthenticated" }, { status: 401 }) };
  }
  const session = await openSession(value, secret);
  if (!session) {
    return { ok: false, response: Response.json({ error: "session_expired" }, { status: 401 }) };
  }
  return { ok: true, session };
}
