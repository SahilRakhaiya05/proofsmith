import { cookie } from "@/lib/github-session";
import { publicAppUrl } from "@/lib/config";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const appUrl = publicAppUrl(request);
  const secure = appUrl.startsWith("https:");
  const headers = new Headers({ "Content-Type": "application/json", "Cache-Control": "no-store" });
  headers.append("Set-Cookie", cookie("ps_session", "", { maxAge: 0, secure }));
  return new Response(JSON.stringify({ authenticated: false }), { status: 200, headers });
}
