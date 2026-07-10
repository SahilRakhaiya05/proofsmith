"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/app/components/AppShell";

type Agent = {
  id: string;
  name: string;
  role: string;
  summary: string;
  inputs: string[];
  outputs: string[];
  tools: string[];
  canApproveMerge: boolean;
  status: "ready" | "gated" | "simulated";
  liveTools?: { github?: boolean; testsprite?: boolean; e2b?: boolean };
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    fetch("/api/agents")
      .then(async (response) => {
        const body = (await response.json()) as { agents: Agent[] };
        setAgents(body.agents || []);
      })
      .catch(() => setAgents([]));
  }, []);

  return (
    <AppShell
      title="Agent roster"
      subtitle="Maker/checker separation is structural: no agent may approve its own merge. Human remains the only merge authority."
    >
      <div className="agent-grid">
        {agents.map((agent, index) => (
          <article key={agent.id} className={`agent-card status-${agent.status}`}>
            <div className="agent-card-top">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <span className={`pill pill-${agent.status === "ready" ? "ok" : agent.status === "gated" ? "warn" : "sim"}`}>
                {agent.status}
              </span>
            </div>
            <h2>{agent.name}</h2>
            <p className="agent-role">{agent.role}</p>
            <p>{agent.summary}</p>
            <div className="agent-meta">
              <div>
                <strong>Inputs</strong>
                <ul>
                  {agent.inputs.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Outputs</strong>
                <ul>
                  {agent.outputs.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="tool-row">
              {agent.tools.map((tool) => (
                <span key={tool} className="chip">
                  {tool}
                </span>
              ))}
            </div>
            <p className="merge-note">
              Merge authority: <strong>{agent.canApproveMerge ? "yes" : "never — human only"}</strong>
            </p>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
