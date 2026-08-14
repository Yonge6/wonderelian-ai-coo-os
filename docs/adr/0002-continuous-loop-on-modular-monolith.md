# ADR-0002: Build the continuous loop inside the modular monolith

## Status

Accepted

## Context

Phase 1 is a dependency-free Node.js modular monolith with an atomic JSON store, provider boundary, approval state machine, local writable UI, and public read-only snapshot. Phase 2 needs normalized metric ingestion, data health, scheduled jobs, change detection, execution measurement, and operating memory. Current verified volume is six Style Atlas acquisition observations plus content and campaign records; only one operator writes locally.

The system must become operational now without fabricating provider connectivity, exposing credentials, or adding distributed infrastructure.

## Decision

Keep the existing deployable and persistence model. Add focused domain modules for normalized metrics, data health, detection and decisions, execution and learning, scheduled jobs, and public sanitization. Run scheduled work through a deterministic single-machine runner that can be invoked once or kept alive locally. Treat provider contracts and normalized records as the migration boundary for future SQLite/PostgreSQL or hosted workers.

External providers that lack authentication remain explicit contracts with verified manual/file snapshot ingestion. The public build is generated from a sanitized snapshot and fails on sensitive patterns.

## Consequences

### Positive

- Preserves all Phase 1 behavior and deployment boundaries.
- Produces a useful operating loop without new infrastructure or credentials.
- Keeps missing and stale data visible in every decision.
- Makes future providers and persistence replaceable behind stable interfaces.
- Retains simple local recovery and deterministic tests.

### Negative

- The JSON store is unsuitable for concurrent writers or large time-series history.
- A local scheduler runs only while the operator's machine is available.
- Manual App Store snapshots are not live API connectivity.

### Neutral

- Move to SQLite/PostgreSQL when state size exceeds 10 MB, measured p95 API latency exceeds 200 ms, multi-process writes are required, or hosted authentication is approved.

## Alternatives Considered

**SQLite migration before Phase 2**

- Deferred because current scale does not justify a persistence-first project and the existing store already provides atomic single-writer behavior.

**Hosted database and distributed workers**

- Rejected for this phase because it introduces authentication, secrets, availability, and deployment work before provider access exists.

**Synthetic metrics to demonstrate detection**

- Rejected. The real cycle may correctly report no material change when no comparable verified snapshot exists.

## References

- `docs/plans/2026-08-14-phase-2-continuous-loop-design.md`
- `README.md`

