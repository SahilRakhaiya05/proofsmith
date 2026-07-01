# Architecture

The web handler authenticates and reduces a GitHub event to a validated command. The loop engine creates a contract, and the state machine chooses only legal next states. Long-running work belongs in Actions, isolated by issue concurrency. Makers write; deterministic checks and independent verifiers judge; humans merge; production verification closes.

Evidence is commit-bound. A pass for one SHA is stale for every other SHA. Labels and comments project state but do not own it. Committed run records are the durable source until a GitHub-backed artifact store is added.
