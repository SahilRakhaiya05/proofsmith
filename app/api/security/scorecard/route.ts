import { buildSecurityScorecard } from "@/lib/security-scorecard";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const card = buildSecurityScorecard(request);
  return Response.json(card, { headers: { "Cache-Control": "no-store" } });
}
