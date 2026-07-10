"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GitHubIdentity } from "@/app/GitHubIdentity";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/ai", label: "AI · Gemini" },
  { href: "/loop", label: "Four steps" },
  { href: "/loops", label: "Runs" },
  { href: "/agents", label: "Agents" },
  { href: "/integrations", label: "Integrations" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  const pathname = usePathname();
  return (
    <div className="app-shell">
      <header className="site-header app-header">
        <Link className="wordmark" href="/" aria-label="Proofsmith home">
          <span className="brand-mark">P</span>
          <span>PROOFSMITH</span>
        </Link>
        <nav aria-label="Product navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href || pathname.startsWith(`${link.href}/`) ? "nav-active" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="header-auth">
          <GitHubIdentity />
        </div>
      </header>
      <div className="app-main">
        <div className="app-page-head">
          <div>
            <p className="eyebrow">
              <span className="signal-dot" /> Live control plane
            </p>
            <h1>{title}</h1>
            {subtitle ? <p className="app-subtitle">{subtitle}</p> : null}
          </div>
          <div className="app-page-actions">
            <Link className="secondary-cta" href="/api/health" target="_blank">
              Health JSON
            </Link>
            <a className="primary-cta" href="/api/auth/github">
              Connect GitHub <span>↗</span>
            </a>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
