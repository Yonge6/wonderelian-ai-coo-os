# ADR-0003: Official Read-Only Growth Providers in the Modular Monolith

**Status:** Accepted
**Date:** 2026-08-14

## Context

Phase 2 can operate on verified snapshots but cannot observe daily App Store acquisition, organic search, or App Store reviews. Phase 3 needs official APIs, provenance, reconciliation, and failure isolation while the public GitHub Pages build stays read-only and secret-free.

## Decision

Add App Store Connect and Google Search Console adapters behind the existing provider boundary. Use built-in Node cryptography for Apple ES256 JWTs and Google service-account OAuth JWTs. Pass credential file paths through environment variables; never copy credential material into repository data.

Keep the atomic JSON store while the data volume is small. Add append-only provider sync and reconciliation records plus idempotent observation upserts. Manual verified records remain valid historical evidence and are reconciled, never overwritten.

Request only official read-only data. Creating the first Apple Analytics Report request is treated as a separately authorized setup action because Apple requires Admin access; ordinary sync reads existing report requests and downloads generated reports. Search Console uses `webmasters.readonly` and final data by default.

## Consequences

- A complete integration can be tested and deployed without storing credentials.
- Authentication absence or provider failure is explicit and isolated.
- The public dashboard can show truthful freshness, data-through timestamps, and source drilldowns.
- The JSON store remains a single-machine constraint; migrate when the Phase 2 thresholds are reached.
- The first Apple analytics request may still require a one-time Admin-authorized setup and 1–2 days before reports appear.

## References

- `docs/plans/2026-08-14-phase-3-growth-data-spine-design.md`
- Apple App Store Connect Analytics Reports API documentation
- Google Search Console Search Analytics API documentation
