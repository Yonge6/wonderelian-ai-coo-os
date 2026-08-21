# ADR 0007: Maker Business Lab as the seventh operated website

**Status:** Accepted
**Date:** 2026-08-21

## Context

The portfolio command center tracks five App-associated H5 sites plus the WonderElian brand site. Maker Business Lab is now public at `maker.wonderelian.com` and needs the same evidence-backed operating visibility without becoming a fake sixth App or changing its production repository.

The public site exposes a healthy English product experience, canonical metadata, `robots.txt`, `sitemap.xml`, and client-side `page_view` and `recommendation_click` instrumentation. That instrumentation currently uses PostHog and a first-party event endpoint rather than the portfolio GA4 property, so no official GA4 traffic observations exist for this hostname.

## Decision

1. Register Maker Business Lab as a web-only `business_tool`, not an App.
2. Include it in the public HTTP/HTML health Provider, daily brief, website ledger, operating queue, and daily/weekly selector.
3. Use `recommendation_click` as its declared primary conversion because it is present in the live client instrumentation.
4. Keep UV, PV, sessions, CTA events, and conversions `null` until a verified read-only Provider returns observations for this hostname.
5. Label analytics as `tag_detected`, not `connected`, while only the client instrumentation is visible.
6. Preserve the existing stable job identifiers while making all user-facing labels portfolio-based rather than six-site-specific.
7. Do not modify the Maker Business Lab product repository, DNS, product recommendations, pricing, or account configuration from AI COO OS.

## Consequences

- The command center reports five Apps and seven websites.
- Site health and technical discovery readiness are immediately monitorable.
- Traffic gaps remain explicit and cannot be mistaken for zero traffic.
- A future PostHog or first-party read-only Provider can connect without changing UI or domain logic.
