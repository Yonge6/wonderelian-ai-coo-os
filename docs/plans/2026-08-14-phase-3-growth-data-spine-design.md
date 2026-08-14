# Phase 3 Growth Data Spine Design

## Outcome

Connect the existing Phase 2 operating loop to official, read-only growth sources without adding the Phase 4 distribution engine. The north star remains attributable first-time App Store downloads.

## Selected design

Extend the modular monolith with two production provider adapters and one shared ingestion/reconciliation service:

- App Store Connect API: ES256 JWT authentication, Analytics Reports discovery/download, and customer reviews.
- Google Search Console API: read-only OAuth, Search Analytics query ingestion by date, query, page, country, and device.
- Growth data service: stable-key upsert, immutable sync history, source classification, conflict reconciliation, provider-specific freshness, search opportunity detection, Voice of Customer clustering, attribution confidence, and instrumentation maturity.

Credentials are supplied only through process environment variables and paths to ignored local files. Secrets and tokens never enter state, logs, HTTP responses, or the public build.

## Alternatives

1. **Extend the modular monolith (selected).** Current volume remains small, writes remain single-machine, and stable provider contracts avoid a premature persistence migration.
2. **Separate ETL service and hosted database.** Deferred until multi-process writes, remote scheduling, or measured query volume requires it.
3. **Continue manual exports.** Retained only as a reconciled historical source; it cannot deliver the requested daily measurement loop.

## Data contracts

Every observation carries a stable identity plus `provider`, `source_reference`, `period`, `imported_at`, `verified_at`, `verification_type`, `freshness`, and `confidence`.

Verification types are `manual_verified`, `api_verified`, `calculated`, and `inferred`. Missing remains `null`. Reconciliation never silently overwrites conflicting manual and API observations; it appends an explicit match or mismatch record.

Provider syncs record requested period, start/end time, received/inserted/updated/unchanged counts, provider data-through timestamp, status, and a safe error code. Re-running a range is idempotent.

## Daily COO Cycle V2

1. Validate configuration without exposing credentials.
2. Sync App Store analytics, reviews, and Search Console independently.
3. Preserve the last successful data if a provider fails.
4. Reconcile overlapping manual and API metrics.
5. Detect only evidence-backed metric, search, attribution, and review changes.
6. Generate a brief that states each provider's `data_through` timestamp.
7. Auto-execute only Level 0/1 internal work; keep external work behind approval.
8. Measure completed work and create learnings only when evidence is conclusive.

Normal provider latency is represented as delayed rather than failed. App Store ongoing analytics has an initial 1–2 day generation window; Search Console final data is requested by default. Operating SLAs are configurable and deliberately more conservative than the providers' freshest possible views.

## Fail-safe behavior

| Condition | Result |
| --- | --- |
| Missing credential or property | `BLOCKED — AUTH REQUIRED`; no network call |
| 401/403 | Safe auth error, previous data retained |
| 429/5xx | Provider unavailable, retryable sync history, no zero substitution |
| Malformed report row | Reject that row and record validation error |
| Duplicate row | Unchanged count increments; no duplicate observation |
| Manual/API disagreement | Append reconciliation mismatch; keep both sources |
| Sparse search/review evidence | No opportunity or product recommendation |
| Public snapshot contains secret/path/email | Build fails |

## Instrumentation maturity

0. No verified acquisition baseline.
1. Verified manual baseline.
2. Automated official acquisition feed connected.
3. Search/content path observed with campaign outcomes.
4. Reliable experiment measurement and review loop.
5. Portfolio-level continuous optimization with conclusive learnings.

Style Atlas remains Level 1 until an official sync succeeds. The other apps remain Level 0.

## Acceptance

- All Phase 1/2 tests remain green.
- Provider auth, normalization, pagination, idempotency, reconciliation, freshness, opportunity thresholds, failure isolation, and public sanitization have deterministic tests.
- A real cycle runs against available credentials. Missing credentials produce an audited blocked state, not a false live connection.
- The public bilingual dashboard leads with decisions, changes, north star, and data freshness, and important numbers expose their source.
