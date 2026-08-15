# ADR-0005: Use One GA4 Property for Six-Site Traffic Measurement

Status: Accepted
Date: 2026-08-15

## Context

AI COO OS monitors five App H5 sites and `wonderelian.com`, but the six sites do not yet expose a verified traffic provider. Public health checks cannot supply page views, users, sessions, acquisition sources, landing pages, geography, devices, or conversion events. The portfolio needs one read-only data spine without mixing credentials into product repositories or the public dashboard.

The user authorized one unified Google Analytics 4 setup, six-site instrumentation, a read-only Data API Provider, and repository-scoped production changes. Phase 4 remains separately gated by real App Store Analytics observations, reconciliation, and a Provider-backed COO cycle.

## Decision

1. Use one GA4 Property and one Web Data Stream for the six-site portfolio.
2. Install the same public Measurement ID on all six hostnames and separate observations with GA4's `hostName` dimension.
3. Configure cross-domain measurement for the portfolio domains after the Property exists.
4. Emit one primary conversion event per site: `app_store_download`, `app_discovery`, `chart_completion`, `chapter_read`, `poster_engagement`, or `product_discovery`.
5. Read GA4 only through the official Data API using `analytics.readonly` and a least-privilege service account or an explicitly supplied short-lived access token.
6. Keep service-account credentials outside every repository. The public Measurement ID is not treated as a secret.
7. Normalize API rows into `website_metrics` with website ID, period, metric, dimensions, provenance, import time, and `api_verified` classification.
8. Keep the Provider `waiting` until the API returns at least one real observation. A configured tag or empty report must not be represented as live traffic or as zero.
9. Run authenticated imports locally; publish only the existing sanitized read-only snapshot.

## Consequences

### Positive

- One official API supplies consistent portfolio traffic and conversion evidence.
- Hostname-level rows keep the six sites independently operable while allowing cross-site journeys.
- The same authenticated Provider can backfill from the first collected GA4 event and run daily thereafter.
- App Store campaign outcomes remain separate and can be reconciled instead of inferred from CTA events.

### Negative

- GA4 cannot recover visits that occurred before the tags were installed.
- The Alibaba-hosted Xiazi site requires an explicit mainland collection test; collection completeness cannot be assumed.
- GA4 setup depends on access to the Google Analytics administration surface and a Google Cloud identity with minimum read access.

### Neutral

- Product repositories receive only the public tag and bounded event calls.
- Website analytics does not raise Style Atlas App instrumentation maturity or open the Phase 4 gate by itself.

## Failure Modes and Mitigations

| Failure | Result | Mitigation |
|---|---|---|
| Analytics UI or authentication is unavailable | Property and Measurement ID cannot be created | Stop before deploying placeholders; preserve the configured Provider as blocked/not connected |
| API returns no rows | No verified traffic exists yet | Keep metrics absent and Provider `waiting` |
| A hostname is missing from reports | That site remains unconnected | Do not infer zero; verify tag delivery and realtime collection |
| Service-account permission is revoked | Daily sync fails safely | Retain prior verified rows and record a sanitized Provider error |
| Xiazi collection is incomplete in mainland networks | Under-counted traffic | Measure collection success before considering a first-party fallback |

## Alternatives Considered

**Six separate GA4 Properties or Streams**

- Rejected for the initial portfolio spine because it multiplies configuration, authentication, queries, and reconciliation while the Data API can separate one Property by hostname.

**Cloudflare Web Analytics only**

- Rejected as the primary Provider because the operating contract requires explicit product conversion events and one consistent API across GitHub Pages and Alibaba nginx.

**Self-hosted analytics from day one**

- Deferred because it adds database, security, backup, and operations overhead before collection reliability has been tested.

## References

- https://developers.google.com/analytics/devguides/reporting/data/v1
- https://support.google.com/analytics/answer/10071811
- https://developers.google.com/tag-platform/gtagjs/configure
