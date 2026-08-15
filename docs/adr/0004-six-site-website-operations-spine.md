# ADR-0004: Six-Site Website Operations Spine

Status: Accepted  
Date: 2026-08-15

## Context

The portfolio operates five App H5 sites plus `wonderelian.com`. Before this decision, AI COO OS tracked App Store, content, search and review evidence but had no portfolio-wide website inventory, availability monitoring or website traffic contract. None of the six public sites exposed a detectable supported analytics tag on 2026-08-15.

## Decision

1. Register all six websites as first-class operating entities linked to Apps where applicable.
2. Run a read-only public HTTP/HTML provider daily at 08:15 Asia/Shanghai.
3. Record reachability and technical discovery signals separately from traffic metrics.
4. Keep page views, users, sessions, sources, landing pages, countries, devices and CTA clicks unavailable until a verified analytics API supplies them.
5. Show a bilingual six-site health and operations view in the public dashboard.
6. Preserve a per-site P0/P1 operating queue without changing product repositories as part of the monitoring rollout.
7. Keep App instrumentation maturity and the Phase 4 gate independent of website availability.

## Provider Boundaries

- `public_website_health` performs unauthenticated read-only HTTP and HTML probes and normalizes results into `website_observations`.
- `website_analytics_api` represents verified traffic and attribution data. It remains `not_connected` until tags and read-only API access are configured.
- UI and domain logic consume normalized state only; they do not call site or analytics APIs directly.

## Consequences

- Six-site uptime and basic discovery readiness can be monitored immediately without credentials.
- Traffic remains honestly unavailable rather than being inferred from health checks.
- Site operations can be prioritized from a shared evidence baseline.
- A separate analytics connection and repository-scoped instrumentation rollout is still required before traffic-driven decisions are possible.
- This work does not start Phase 4 or satisfy its gate.
