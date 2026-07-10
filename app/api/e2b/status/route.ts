import { e2bStatus } from "@/lib/e2b-client";

export const runtime = "nodejs";

export async function GET() {
  const status = await e2bStatus();
  return Response.json(status, { headers: { "Cache-Control": "no-store" } });
}
