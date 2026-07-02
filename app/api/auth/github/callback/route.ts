import { GitHubUserSchema, cookie, readCookie, sealSession } from "@/lib/github-session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const state = url.searchParams.get("state");
  const expectedState = readCookie(request, "ps_oauth_state");
  const code = url.searchParams.get("code");
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const sessionSecret = process.env.SESSION_SECRET;
  if (!state || !expectedState || state !== expectedState || !code) return Response.redirect(`${origin}/?auth=invalid_state`, 302);
  if (!clientId || !clientSecret || !sessionSecret) return Response.redirect(`${origin}/?auth=not_configured`, 302);

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: `${origin}/api/auth/github/callback` }),
  });
  const tokenPayload = await tokenResponse.json() as { access_token?: string; error?: string };
  if (!tokenPayload.access_token) return Response.redirect(`${origin}/?auth=exchange_failed`, 302);
  const userResponse = await fetch("https://api.github.com/user", { headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${tokenPayload.access_token}`, "X-GitHub-Api-Version": "2022-11-28" } });
  const user = GitHubUserSchema.safeParse(await userResponse.json());
  if (!user.success) return Response.redirect(`${origin}/?auth=user_failed`, 302);
  const session = await sealSession({ user: user.data, accessToken: tokenPayload.access_token, expiresAt: Date.now() + 8 * 60 * 60 * 1000 }, sessionSecret);
  const response = Response.redirect(`${origin}/?auth=connected`, 302);
  response.headers.append("Set-Cookie", cookie("ps_session", session, { maxAge: 8 * 60 * 60, secure: origin.startsWith("https:") }));
  response.headers.append("Set-Cookie", cookie("ps_oauth_state", "", { maxAge: 0, secure: origin.startsWith("https:") }));
  return response;
}
