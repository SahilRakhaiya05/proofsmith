import { agents } from "@/lib/agents-catalog";
import { integrationFlags } from "@/lib/config";

export async function GET() {
  const flags = integrationFlags();
  return Response.json(
    {
      agents: agents.map((agent) => ({
        ...agent,
        liveTools: {
          github: flags.githubOAuth || flags.githubWorker,
          testsprite: flags.testSprite && agent.role === "testsprite" ? true : flags.testSprite,
          e2b: flags.e2b && (agent.role === "maker" || agent.role === "challenger"),
        },
      })),
      count: agents.length,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
