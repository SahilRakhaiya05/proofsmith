import { openSession, readCookie } from "@/lib/github-session";

export async function GET(request: Request) {
  const secret = process.env.SESSION_SECRET;
  const value = readCookie(request, "ps_session");
  if (!secret || !value) return Response.json({ authenticated: false });
  const session = await openSession(value, secret);
  if (!session) return Response.json({ authenticated: false });
  return Response.json({ authenticated: true, user: session.user }, { headers: { "Cache-Control": "no-store" } });
}
