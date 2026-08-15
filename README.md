# WonderElian AI COO OS

A bilingual operating command center for WonderElian's consumer-app portfolio. Phase 3 adds the official read-only growth-data spine to the Phase 2 loop:

```text
Observe -> Detect -> Decide -> Approve -> Execute -> Measure -> Learn
```

Style Atlas is the first live operating app. The other four products remain supported without synthetic metrics. Unknown outcomes stay `null` and display as `—`.

## Live dashboard

- Public GitHub Pages: read-only, sanitized, English/Chinese.
- Local Node app: writable imports, approvals, execution, jobs, and audit.

The Command Center prioritizes Today's Decisions, What Changed, the North Star, and provider-specific Data Freshness. Secondary views cover acquisition, organic search, content attribution, SEO/GEO readiness, Voice of Customer, experiments, execution, data sources, instrumentation maturity, and audit activity.

## Run locally

Use the bundled Node runtime if the shell cannot find Node:

```sh
PATH='/Users/yongyuan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin':$PATH npm run check
PATH='/Users/yongyuan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin':$PATH npm test
PATH='/Users/yongyuan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin':$PATH npm start
```

Open `http://127.0.0.1:4310/`.

Run one verified internal operating cycle:

```sh
PATH='/Users/yongyuan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin':$PATH npm run cycle
```

Run the Phase 3 Growth Data Cycle V2:

```sh
PATH='/Users/yongyuan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin':$PATH npm run cycle:growth
```

Copy `.env.example` into your shell configuration and set paths to credential files outside the repository. Never put a `.p8`, service-account JSON, access token, or cookie in this repository.

## Phase 3 implementation

- production App Store Connect ES256 JWT authentication and official Analytics Reports traversal/download;
- official App Store customer-review ingestion with stable IDs and conservative Voice-of-Customer classification;
- Google Search Console `webmasters.readonly` OAuth and paginated Search Analytics ingestion by date, query, page, country, and device;
- Google Analytics 4 `analytics.readonly` ingestion for six-site traffic, acquisition dimensions, and primary conversion events;
- idempotent stable-key history, backfill-ready ranges, append-only provider sync evidence, and manual/API reconciliation;
- explicit `manual_verified`, `api_verified`, `calculated`, and `inferred` source classes;
- provider-specific healthy, delayed, stale, blocked, and failed states with `data_through` timestamps;
- evidence-thresholded search opportunities and review themes—sparse data creates no recommendation;
- attribution confidence classes and a portfolio instrumentation maturity model from 0–5;
- Daily COO Cycle V2 with isolated syncs, validation, reconciliation, detection, brief, approval gate, internal execution, measurement, and learning;
- bilingual source drilldowns and concise Acquisition, Search, Content Attribution, Voice of Customer, Experiments, and Execution scorecards.

## Phase 2 implementation

- normalized acquisition/revenue metric records with source, provider, reference, verification time, freshness, confidence, and notes;
- idempotent verified manual/file snapshot ingestion for metrics and feedback;
- per-app Data Health with provider status, last import, stale/missing feeds, critical gaps, errors, and attribution coverage;
- configurable change thresholds and material anomaly detection;
- anomaly-to-insight conversion that separates fact, interpretation, and action;
- transparent seven-input decision score;
- Level 0–3 action risk model integrated with approvals;
- execution queue with approval enforcement and verified external output requirements;
- action outcomes, evidence-linked learnings, and structured operating memory;
- measurable content/campaign attribution and a real Style Atlas guide-vs-comparison experiment;
- eight single-machine jobs and an auditable operating-cycle runner;
- static snapshot sanitization that fails on local paths, emails, credentials, tokens, cookies, or auth material.

## Real data status (2026-08-14)

Connected and verified:

- Style Atlas App Store Connect 90-day manual snapshot through 2026-08-12: 1,610 impressions, 189 product-page views, 24 first-time downloads, 5 redownloads, 2.44% average conversion, and 3 in-app purchases;
- verified local operations log, permanent content URLs, and public URL status;
- 15 published content records and 3 complete content-to-landing-to-App-Store campaign paths.

Official API state:

- App Store Connect Analytics: `BLOCKED — AUTH REQUIRED`;
- App Store customer reviews: `BLOCKED — AUTH REQUIRED`;
- Google Search Console: `BLOCKED — AUTH REQUIRED`;
- social performance APIs;
- revenue amount, subscriptions, trials, retention, and attribution results.

The maximum real Cycle V2 completed all internal stages, retained the verified 24-download baseline through 2026-08-12, and recorded all three external syncs as blocked with zero received records. No interface or test fixture is presented as a connected provider.

## Architecture

- dependency-free Node.js modular monolith;
- atomic single-writer JSON store;
- provider adapters isolated from UI and decision logic;
- deterministic local job runner, with no distributed infrastructure;
- public GitHub Pages snapshot generated by `npm run build:static`;
- explicit public/private sanitation and read-only UI boundary.

See [Phase 3 design](docs/plans/2026-08-14-phase-3-growth-data-spine-design.md), [ADR-0003](docs/adr/0003-official-read-only-growth-providers.md), and the retained [Phase 2 design](docs/plans/2026-08-14-phase-2-continuous-loop-design.md).

Six-site website monitoring is defined by [ADR-0004](docs/adr/0004-six-site-website-operations-spine.md). The authenticated GA4 decision and failure boundaries are defined by [ADR-0005](docs/adr/0005-ga4-six-site-traffic-provider.md).

## Minimum connection actions

1. Create or provide an App Store Connect key with the required reporting access, keep its `.p8` outside the repo, and set `ASC_ISSUER_ID`, `ASC_KEY_ID`, and `ASC_PRIVATE_KEY_PATH`. If no active ongoing Analytics Report request exists, an Admin must create it once; Apple says initial generation takes 1–2 days.
2. Enable the Search Console API, grant a service account access to the exact Search Console property, keep its JSON outside the repo, and set `GOOGLE_APPLICATION_CREDENTIALS` plus the exact property string in `GSC_SITE_URL`.
3. Run `npm run cycle:growth`; the same App Store key supplies read-only customer reviews.
4. Create one GA4 Property/Web Stream for the six sites, deploy its public Measurement ID to each site, grant the external service account Viewer access, set `GA4_PROPERTY_ID`, and run `npm run sync:website-analytics`.
