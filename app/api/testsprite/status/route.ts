import { localPlans, testspriteWhoami } from "@/lib/testsprite-client";
import { integrationFlags } from "@/lib/config";

export const runtime = "nodejs";

export async function GET() {
  const flags = integrationFlags();
  if (!flags.testSprite) {
    return Response.json({
      configured: false,
      ok: false,
      message: "TESTSPRITE_API_KEY is not set",
      plans: localPlans(),
      cli: "@testsprite/testsprite-cli@0.3.0",
      docs: "https://github.com/TestSprite/testsprite-cli",
    });
  }
  const whoami = await testspriteWhoami();
  return Response.json(
    {
      configured: true,
      ok: whoami.ok,
      status: whoami.status,
      baseUrl: whoami.baseUrl,
      projectId: process.env.TESTSPRITE_PROJECT_ID || null,
      criticalTestIds: (process.env.TESTSPRITE_CRITICAL_TEST_IDS || "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
      probe: whoami.body,
      plans: localPlans(),
      cli: "@testsprite/testsprite-cli@0.3.0",
      docs: "https://github.com/TestSprite/testsprite-cli",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
