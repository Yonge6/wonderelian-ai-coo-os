# Daily Operations Execution Design

## Outcome

The AI COO OS must make daily operations visible as operating evidence, not merely as technical state. The Command Center will show what was scheduled, what actually ran, what verifiable outcome was produced, and which permanent public content URLs were published. The detailed Operations Log will preserve the full task, outcome, cycle, and content-distribution ledgers.

## Information architecture

The Command Center remains the executive surface. A compact Daily Operations section appears immediately after Daily Portfolio Telemetry and before the Phase 4 gate. It contains three coordinated views: a Beijing-time task timeline, verified outcome counters with a short evidence feed, and a channel distribution summary with permanent public URLs.

The existing Activity navigation item becomes Operations Log. It is the drill-down surface for all scheduled jobs, append-only audit evidence, operating cycles, and published content. Content remains the canonical content inventory and Data Sources remains the provider control plane; the new execution layer links those facts without copying or inventing metrics.

## Evidence and date rules

- Schedule metadata and actual execution evidence remain separate. A scheduled job is never presented as completed without a recorded last run, result, or audit event.
- All timestamps and daily grouping use `Asia/Shanghai`.
- The Command Center summarizes the latest operating day represented by jobs, audit records, or published content. Website traffic keeps its independent latest-complete-day selector.
- Published content must have a permanent public URL before it appears in the distribution ledger.
- Missing reach, clicks, App Store page views, and first-time downloads remain `null` and render as an em dash.
- Waiting and blocked provider states remain visible and never count as successful outcomes.

## Interface

The Daily Operations module uses the existing future-facing industrial console language. A horizontal mission-control timeline uses cyan for scheduled work, lime for verified success, and orange for waiting or blocked work. Compact counters summarize scheduled jobs, verified outcomes, published URLs, and active channels. The evidence feed links to the Operations Log, while content cards link directly to permanent public URLs.

The Operations Log page provides four sections:

1. Daily scheduled tasks with schedule, last run, next run, status, and recorded result.
2. Verified outcome timeline sourced from append-only audit records.
3. Content distribution matrix grouped by channel, with permanent URL and attribution-chain completeness.
4. Provider-backed operating cycles retained from the existing Activity page.

Tables scroll horizontally on narrow screens. The Command Center summary collapses from a three-column rack to one column, preserving time, status, and evidence before decoration.

## Verification

- Static UI contract tests prove bilingual labels, page ownership, evidence rules, permanent links, and responsive tokens ship.
- Full automated tests and `npm run check` must pass.
- The static public build must pass the existing safety scan and contain no secrets, private paths, approvals, or operating memory.
- Desktop and 390 px mobile browser checks must show no horizontal page overflow or console errors.
- Deployment is complete only after GitHub Pages and `https://ops.wonderelian.com/` return the new version and live DOM exposes both Daily Operations and Operations Log.
