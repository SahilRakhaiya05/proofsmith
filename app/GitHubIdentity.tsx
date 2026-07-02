"use client";

import { useEffect, useState } from "react";

type Identity = { authenticated: false } | { authenticated: true; user: { login: string; avatar_url: string } };

export function GitHubIdentity() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  useEffect(() => { fetch("/api/auth/me", { credentials: "include" }).then(async (response) => setIdentity(await response.json() as Identity)).catch(() => setIdentity({ authenticated: false })); }, []);
  if (identity?.authenticated) return <div className="github-identity"><i className="github-avatar" aria-hidden="true" style={{ backgroundImage: `url(${identity.user.avatar_url})` }} /><span>@{identity.user.login}</span><button onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => location.reload())}>Disconnect</button></div>;
  return <a className="github-connect" href="/api/auth/github">Connect GitHub <span aria-hidden="true">↗</span></a>;
}
