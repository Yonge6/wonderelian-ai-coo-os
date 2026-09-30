# Yixiu App analytics connection

The user confirmed the Firebase terms step and asked to finish the existing analytics setup. Only Yixiu is registered; the five other product panels remain placeholders.

## Verified setup

- The already-signed-in GA4 administrator was used without changing any account role. Firebase `yixiu-meditation` is linked to the existing WonderElian Web Portfolio property on the free Spark plan.
- `com.health.yixiu` is a separate iOS stream; the existing web stream is unchanged.
- Event-scoped `scene_id` is registered, and the read-only Data API now accepts content queries.
- Machine-local mapping is kept in ignored `config/product-analytics.local.json`, with `propertyId` and `iosStreamId` strings. It is not public data. `YIXIU_IOS_STREAM_ID` overrides it; an empty environment value explicitly disables App reporting. Mapping/property mismatch fails closed.
- The existing website-sync entry point loads this mapping automatically. No new scheduled task is created or required.
- Native Release build and 15 Swift tests passed in the Yixiu repo. The actual configuration is bundled only in the App; opt-in, production-install and test exclusions are unchanged. Native distribution and privacy review remain a separate release step.

## Verification and semantics

- Official Data API returns successfully for both exact Yixiu hostname and the dedicated iOS stream/platform. Reporting window: 2026-09-02 through 2026-09-29, Asia/Shanghai.
- New schema events have not appeared in that window. Status remains `waiting_for_events`; no listening, subscription or revenue is invented.
- Content status now depends on valid schema-2 scene rows, not unrelated historic `(not set)` rows.
- Native UI explains that Firebase is linked but user activity requires a distributed instrumented build and user consent.
- All non-usage public state compared equal to production, excluding only the store update timestamp and usage audit additions.
- Validation: 94 tests, state invariants and public safety/static build. Production release readback follows below.
