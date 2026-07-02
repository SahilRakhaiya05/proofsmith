import { cookie } from "@/lib/github-session";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const response = Response.json({ authenticated: false });
  response.headers.append("Set-Cookie", cookie("ps_session", "", { maxAge: 0, secure: origin.startsWith("https:") }));
  return response;
}
