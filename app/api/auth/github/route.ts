import { cookie } from "@/lib/github-session";
import { publicAppUrl } from "@/lib/config";

export async function GET(request: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) return Response.json({ error: "github_oauth_not_configured" }, { status: 503 });
  const appUrl = publicAppUrl(request);
  const secure = appUrl.startsWith("https:");
  const state = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", `${appUrl}/api/auth/github/callback`);
  authorize.searchParams.set("scope", "read:user repo workflow");
  authorize.searchParams.set("state", state);
  const response = Response.redirect(authorize, 302);
  response.headers.append("Set-Cookie", cookie("ps_oauth_state", state, { maxAge: 600, secure }));
  return response;
}
