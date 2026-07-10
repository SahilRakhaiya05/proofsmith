"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/app/components/AppShell";

type Evidence = { kind: string; label: string; status: string; detail?: string };
type Run = {
  id: string;
  issueNumber: number;
  title: string;
  repo: string;
  state: string;
  agentId: string;
  actor: string;
  createdAt: string;
  updatedAt: string;
  evidence: Evidence[];
  commitSha?: string;
  prUrl?: string;
  previewUrl?: string;
  testspriteRunId?: string;
};

export default function LoopsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [owner, setOwner] = useState("SahilRakhaiya05");
  const [repo, setRepo] = useState("proofsmith");
  const [issues, setIssues] = useState<Array<{ number: number; title: string; url: string; labels: string[] }>>([]);
  const [issueError, setIssueError] = useState<string | null>(null);

  const loadRuns = useCallback(() => {
    fetch("/api/loop/runs")
      .then(async (response) => {
        const body = (await response.json()) as { runs: Run[] };
        setRuns(body.runs || []);
        if (!selected && body.runs?.[0]) setSelected(body.runs[0].id);
      })
      .catch(() => setRuns([]));
  }, [selected]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  async function loadIssues() {
    setIssueError(null);
    const response = await fetch(`/api/github/issues?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`, {
      credentials: "include",
    });
    if (response.status === 401) {
      setIssueError("Connect GitHub first.");
      return;
    }
    if (!response.ok) {
      setIssueError(`GitHub issues failed (${response.status})`);
      return;
    }
    const body = (await response.json()) as {
      issues: Array<{ number: number; title: string; url: string; labels: string[] }>;
    };
    setIssues(body.issues || []);
  }

  async function startFromIssue(issue: { number: number; title: string }) {
    await fetch("/api/loop/runs", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        issueNumber: issue.number,
        title: issue.title,
        repo: `${owner}/${repo}`,
      }),
    });
    loadRuns();
  }

  const active = runs.find((run) => run.id === selected) || runs[0] || null;

  return (
    <AppShell
      title="Loop runs"
      subtitle="Each run is a falsifiable contract with maker/checker evidence. Start from a real GitHub issue when connected."
    >
      <section className="panel-grid loops-layout">
        <div className="panel">
          <div className="panel-head">
            <h2>Active runs</h2>
            <button type="button" className="text-button" onClick={loadRuns}>
              Refresh
            </button>
          </div>
          <ul className="run-list">
            {runs.map((run) => (
              <li key={run.id}>
                <button
                  type="button"
                  className={active?.id === run.id ? "active" : undefined}
                  onClick={() => setSelected(run.id)}
                  id={run.id}
                >
                  <strong>
                    #{run.issueNumber} · {run.title}
                  </strong>
                  <span>
                    {run.state} · {run.repo}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel">
          {active ? (
            <>
              <div className="panel-head">
                <h2>Run {active.id}</h2>
                <span className="pill pill-warn">{active.state}</span>
              </div>
              <dl className="kv">
                <div>
                  <dt>Issue</dt>
                  <dd>#{active.issueNumber}</dd>
                </div>
                <div>
                  <dt>Repo</dt>
                  <dd>{active.repo}</dd>
                </div>
                <div>
                  <dt>Agent</dt>
                  <dd>{active.agentId}</dd>
                </div>
                <div>
                  <dt>Actor</dt>
                  <dd>{active.actor}</dd>
                </div>
                <div>
                  <dt>Commit</dt>
                  <dd>{active.commitSha || "—"}</dd>
                </div>
                <div>
                  <dt>Updated</dt>
                  <dd>{new Date(active.updatedAt).toLocaleString()}</dd>
                </div>
              </dl>
              <h3 className="evidence-title">Evidence ledger</h3>
              <ul className="evidence-list">
                {active.evidence.map((item) => (
                  <li key={`${item.kind}-${item.label}`}>
                    <span className={`pill pill-${item.status === "pass" ? "ok" : item.status === "fail" ? "danger" : "warn"}`}>
                      {item.status}
                    </span>
                    <div>
                      <strong>
                        {item.kind} · {item.label}
                      </strong>
                      {item.detail ? <small>{item.detail}</small> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="panel-empty">No runs yet.</p>
          )}
        </div>

        <div className="panel span-2">
          <div className="panel-head">
            <h2>Start from real GitHub issue</h2>
          </div>
          <div className="inline-form">
            <label>
              Owner
              <input value={owner} onChange={(event) => setOwner(event.target.value)} />
            </label>
            <label>
              Repo
              <input value={repo} onChange={(event) => setRepo(event.target.value)} />
            </label>
            <button type="button" className="primary-cta" onClick={loadIssues}>
              Load issues
            </button>
          </div>
          {issueError ? <p className="feedback">{issueError}</p> : null}
          <ul className="data-list">
            {issues.map((issue) => (
              <li key={issue.number}>
                <a href={issue.url} target="_blank" rel="noreferrer">
                  #{issue.number} · {issue.title}
                </a>
                <span>{issue.labels.join(", ") || "no labels"}</span>
                <button type="button" className="text-button" onClick={() => startFromIssue(issue)}>
                  Start Proofsmith loop
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </AppShell>
  );
}
