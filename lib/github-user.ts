import type { GitHubSession } from "@/lib/github-session";

const API = "https://api.github.com";
const VERSION = "2022-11-28";

function ghHeaders(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": VERSION,
    "User-Agent": "proofsmith",
  };
}

export async function listUserRepos(session: GitHubSession, limit = 20) {
  const response = await fetch(
    `${API}/user/repos?per_page=${limit}&sort=updated&affiliation=owner,collaborator,organization_member`,
    { headers: ghHeaders(session.accessToken), cache: "no-store" },
  );
  if (!response.ok) {
    return { ok: false as const, status: response.status, repos: [] };
  }
  const data = (await response.json()) as Array<{
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    private: boolean;
    description: string | null;
    language: string | null;
    stargazers_count: number;
    open_issues_count: number;
    updated_at: string;
    default_branch: string;
    owner: { login: string };
  }>;
  return {
    ok: true as const,
    status: response.status,
    repos: data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      url: repo.html_url,
      private: repo.private,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      openIssues: repo.open_issues_count,
      updatedAt: repo.updated_at,
      defaultBranch: repo.default_branch,
      owner: repo.owner.login,
    })),
  };
}

export async function listRepoIssues(session: GitHubSession, owner: string, repo: string, limit = 20) {
  const response = await fetch(
    `${API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?state=open&per_page=${limit}`,
    { headers: ghHeaders(session.accessToken), cache: "no-store" },
  );
  if (!response.ok) {
    return { ok: false as const, status: response.status, issues: [] };
  }
  const data = (await response.json()) as Array<{
    id: number;
    number: number;
    title: string;
    html_url: string;
    state: string;
    user: { login: string } | null;
    labels: Array<{ name: string }>;
    created_at: string;
    pull_request?: unknown;
  }>;
  return {
    ok: true as const,
    status: response.status,
    issues: data
      .filter((item) => !item.pull_request)
      .map((issue) => ({
        id: issue.id,
        number: issue.number,
        title: issue.title,
        url: issue.html_url,
        state: issue.state,
        author: issue.user?.login || "unknown",
        labels: issue.labels.map((label) => label.name),
        createdAt: issue.created_at,
      })),
  };
}

export async function listPullRequests(session: GitHubSession, owner: string, repo: string, limit = 10) {
  const response = await fetch(
    `${API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?state=open&per_page=${limit}`,
    { headers: ghHeaders(session.accessToken), cache: "no-store" },
  );
  if (!response.ok) {
    return { ok: false as const, status: response.status, pulls: [] };
  }
  const data = (await response.json()) as Array<{
    id: number;
    number: number;
    title: string;
    html_url: string;
    user: { login: string } | null;
    head: { sha: string; ref: string };
    draft: boolean;
    created_at: string;
  }>;
  return {
    ok: true as const,
    status: response.status,
    pulls: data.map((pull) => ({
      id: pull.id,
      number: pull.number,
      title: pull.title,
      url: pull.html_url,
      author: pull.user?.login || "unknown",
      sha: pull.head.sha,
      branch: pull.head.ref,
      draft: pull.draft,
      createdAt: pull.created_at,
    })),
  };
}

export async function getAuthenticatedUser(session: GitHubSession) {
  const response = await fetch(`${API}/user`, {
    headers: ghHeaders(session.accessToken),
    cache: "no-store",
  });
  if (!response.ok) return { ok: false as const, status: response.status, user: null };
  const user = (await response.json()) as {
    login: string;
    name: string | null;
    public_repos: number;
    followers: number;
    plan?: { name: string };
  };
  return {
    ok: true as const,
    status: response.status,
    user: {
      login: user.login,
      name: user.name,
      publicRepos: user.public_repos,
      followers: user.followers,
      plan: user.plan?.name,
    },
  };
}
