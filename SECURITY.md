# Security

Report vulnerabilities privately to the repository owner. Do not include secrets or exploit data in a public issue.

Proofsmith treats issue and pull-request content as untrusted. Webhooks are authenticated before parsing commands; commands are exact allowlisted tokens; trusted GitHub association is required; workflow inputs are validated again; merge and production closure stay human-gated. Logs and evidence must redact credentials, cookies, authorization headers, and personal data.

Known prototype limitation: delivery deduplication is currently in-memory and `PROOFSMITH_GITHUB_TOKEN` is accepted as a pre-minted token. Production requires durable delivery receipts and short-lived installation tokens minted by the GitHub App.

GitHub OAuth uses a one-time state cookie and an AES-GCM encrypted, HttpOnly session. OAuth tokens are never returned by `/api/auth/me`. Any credential pasted into chat, logs, issues, or source must be revoked rather than reused.
