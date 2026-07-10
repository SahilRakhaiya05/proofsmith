import { createRun, listRuns } from "@/lib/run-store";
import { requireSession } from "@/lib/require-session";
import { z } from "zod";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ runs: listRuns() }, { headers: { "Cache-Control": "no-store" } });
}

const CreateSchema = z.object({
  issueNumber: z.number().int().positive(),
  title: z.string().min(3),
  repo: z.string().min(3),
});

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "invalid_body", issues: parsed.error.issues }, { status: 400 });
  }
  const run = createRun({
    ...parsed.data,
    actor: auth.session.user.login,
  });
  return Response.json({ run }, { status: 201 });
}
