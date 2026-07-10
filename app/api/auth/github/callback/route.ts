import { GitHubUserSchema, cookie, readCookie, sealSession } from "@/lib/github-session";
import { publicAppUrl } from "@/lib/config";
import { redirectTo, redirectWithCookies } from "@/lib/http-redirect";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const appUrl = publicAppUrl(request);
    const secure = appUrl.startsWith("https:");
    const state = url.searchParams.get("state");
    const expectedState = readCookie(request, "ps_oauth_state");
    const code = url.searchParams.get("code");
    const clientId = process.env.GITHUB_CLIENT_ID?.trim();
    const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();
    const sessionSecret = process.env.SESSION_SECRET?.trim();

    if (!state || !expectedState || state !== expectedState || !code) {
      return redirectTo(`${appUrl}/dashboard?auth=invalid_state`);
    }
    if (!clientId || !clientSecret || !sessionSecret) {
      return redirectTo(`${appUrl}/dashboard?auth=not_configured`);
    }

    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${appUrl}/api/auth/github/callback`,
      }),
    });
    const tokenPayload = (await tokenResponse.json()) as { access_token?: string; error?: string };
    if (!tokenPayload.access_token) {
      return redirectTo(`${appUrl}/dashboard?auth=exchange_failed`);
    }

    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${tokenPayload.access_token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "proofsmith",
      },
    });
    const user = GitHubUserSchema.safeParse(await userResponse.json());
    if (!user.success) return redirectTo(`${appUrl}/dashboard?auth=user_failed`);

    const session = await sealSession(
      {
        user: user.data,
        accessToken: tokenPayload.access_token,
        expiresAt: Date.now() + 8 * 60 * 60 * 1000,
      },
      sessionSecret,
    );

    return redirectWithCookies(`${appUrl}/dashboard?auth=connected`, [
      cookie("ps_session", session, { maxAge: 8 * 60 * 60, secure }),
      cookie("ps_oauth_state", "", { maxAge: 0, secure }),
    ]);
  } catch (error) {
    console.error("[auth/github/callback]", error);
    const appUrl = publicAppUrl(request);
    return redirectTo(`${appUrl}/dashboard?auth=callback_error`);
  }
}
