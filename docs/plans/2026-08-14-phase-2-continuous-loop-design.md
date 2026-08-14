# Phase 2 Continuous Operating Loop Design

## Outcome

Extend the existing WonderElian AI COO OS from a verified operating record into a bounded continuous loop:

```text
Observe -> Detect -> Decide -> Approve -> Execute -> Measure -> Learn
```

Style Atlas is the first live app. Other apps remain supported without synthetic metrics. The public GitHub Pages build stays read-only and sanitized; the local process remains the only writable control plane.

## Requirements and constraints

- Normalize verified acquisition, revenue, content, feedback, and attribution snapshots with complete provenance.
- Preserve missing values as `null`; a missing measurement is never zero.
- Calculate data health before producing high-confidence recommendations.
- Detect only threshold-crossing changes with sufficient comparable observations.
- Keep observed facts, interpretation, and recommended action separate.
- Enforce four action risk levels and explicit approval for external execution.
- Record execution, outcomes, learnings, experiments, jobs, and audit history.
- Run on one machine without background infrastructure, secrets in state, or external writes during the Phase 2 demonstration cycle.

## Options considered

1. **Extend the modular monolith and JSON store (selected).** Add focused domain modules, an idempotent ingestion service, and a single-machine job runner. This preserves Phase 1, has no new runtime dependency, and is enough for the current data volume. Concurrent multi-user writes and large time-series queries remain out of scope.
2. **Migrate to SQLite first.** Better querying and constraints, but consumes the phase on persistence migration before a verified operating loop exists. Defer until measured state size, query latency, or multi-process access justifies it.
3. **Build a hosted backend and workers.** Enables continuous cloud execution but requires authentication, secrets, remote write protection, and operational infrastructure that the current single-operator workflow does not need.

## Component design

- `metrics.mjs`: metric normalization, provenance validation, freshness, provider and per-app data health, attribution validation.
- `operations.mjs`: change detection, anomaly-to-insight conversion, explainable decision scores, risk-level approval enforcement, execution queue, action outcomes, and learnings.
- `jobs.mjs`: deterministic single-run scheduler with job contracts, retries, results, and audit. It does not run external providers without configured credentials.
- `cycle.mjs`: orchestrates the internal Style Atlas COO cycle and records each stage.
- `public-sanitize.mjs`: allowlist/denylist sanitization plus secret-pattern scanning for the static snapshot.
- Existing `domain.mjs`, `server.mjs`, `store.mjs`, and the UI remain the application shell and API boundary.

## Data flow

1. A provider or verified manual snapshot emits normalized metric records.
2. Ingestion validates provenance and de-duplicates stable observations.
3. Data Health evaluates provider status, freshness, critical coverage, errors, and attribution coverage.
4. Change Detection compares like-for-like verified metric windows. Insufficient comparison data yields no trend anomaly.
5. Material detections can become Insights with fact, interpretation, recommendation, and confidence kept separate.
6. Ranked decisions expose the full score calculation and are capped by evidence quality.
7. Approved actions enter the Execution Queue. Level 2 and 3 work cannot execute without approval.
8. Completed executions open a measurement window; verified before/after metrics produce an ActionOutcome.
9. Conclusive outcomes create evidence-linked operating learnings. Inconclusive evidence stays inconclusive.

## Failure modes

| Failure | Behavior |
| --- | --- |
| Provider unavailable | Record failed job/import, retain prior observation, mark source stale or unavailable, never substitute zero. |
| Duplicate snapshot | Treat as idempotent and audit as unchanged. |
| Non-comparable periods | Do not calculate percentage change; record insufficient evidence. |
| Poor data coverage | Lower recommendation confidence and surface a Data Risk. |
| Missing approval | Keep execution blocked and reject the transition. |
| External result lacks URL/ID | Do not mark external execution verified. |
| Static data includes sensitive pattern | Fail the public build before files are published. |
| Interrupted write | Existing atomic temporary-file rename preserves the last valid state. |

## Verification

- Domain and HTTP tests cover provenance, missing values, freshness, thresholds, scores, approvals, queue transitions, outcomes, learnings, attribution, jobs, brief ranking, and static sanitization.
- One real Style Atlas cycle refreshes the existing verified snapshot, evaluates change, creates the current brief, executes only a Level 0/1 internal operation, and appends audit evidence.
- Local and public modes are checked in English and Chinese at desktop and mobile widths.

