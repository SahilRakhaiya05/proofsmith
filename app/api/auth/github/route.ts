import { cookie } from "@/lib/github-session";
import { publicAppUrl } from "@/lib/config";
import { redirectWithCookies } from "@/lib/http-redirect";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID?.trim();
    if (!clientId) {
      return Response.json(
        {
          error: "github_oauth_not_configured",
          message: "Set GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, and SESSION_SECRET on Vercel.",
          hint: "Also set APP_URL=https://proofsmith.vercel.app and register the OAuth callback.",
        },
        { status: 503 },
      );
    }

    const appUrl = publicAppUrl(request);
    const secure = appUrl.startsWith("https:");
    const state =
      crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");

    const authorize = new URL("https://github.com/login/oauth/authorize");
    authorize.searchParams.set("client_id", clientId);
    authorize.searchParams.set("redirect_uri", `${appUrl}/api/auth/github/callback`);
    authorize.searchParams.set("scope", "read:user repo workflow");
    authorize.searchParams.set("state", state);

    return redirectWithCookies(authorize, [
      cookie("ps_oauth_state", state, { maxAge: 600, secure }),
    ]);
  } catch (error) {
    console.error("[auth/github]", error);
    return Response.json(
      {
        error: "oauth_start_failed",
        message: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 },
    );
  }
}
