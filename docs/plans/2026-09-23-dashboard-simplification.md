# Operations dashboard simplification

User request: review the whole site, remove low-value surfaces and improve useful functions.

## Observed issues

- Eleven top-level pages, with duplicate metrics, content records and job lists.
- Home labels old App Store baselines, August jobs and historical releases as current decisions or changes.
- Website cards select each metric independently, producing a different reporting period from the portfolio table.
- Content has 174 permanent records but no search or product/channel filters.
- Trends ignore the selected day, sum weekly UV without distinguishing user-days, and fall back to an older non-null value.
- Provider and task status are stored snapshots, but their labels suggest current live state.

## Implementation

Six primary destinations: Overview, Products, Websites, Content, Data status, Operations log. Retain historical insight/action/experiment/review/method pages under a collapsed archive so existing records and local workflows remain accessible.

Home uses a dated GA4 summary, daily/cumulative switch, four website KPIs, trends, seven-site breakdown, explicit data gaps and recent verified publications. Historical App acquisition evidence lives on Products. Website telemetry shares exactly the same selected reporting date and source as Home; technical checks are separate and dated.

Content supports search, app/channel/date filters, stable newest-first pagination and CSV export of the filtered verified records. Data status shows provider coverage dates with computed freshness; stored jobs are historical configuration, not proof of an active scheduler. Operations log defaults to chronological audit evidence and retains job/cycle history in details.

Refresh fetches the published snapshot without browser cache; it does not trigger analytics queries. Missing values stay null. Weekly UV is labeled user-days, cumulative UV remains GA4 interval-deduplicated. Existing App baselines and all durable evidence are preserved.

## Verification and release

Functional tests for missing metric handling, period selection, stale data labels, filtered ordering, CSV and rendering. Existing domain tests, state check, static build and public safety scan. Desktop/mobile browser checks, scoped Git release, backed-up restricted deployment, pinned asset/data hashes and public DOM readback. No social posting, automation change, or product repository mutation.
