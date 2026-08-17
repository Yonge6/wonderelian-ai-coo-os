# Daily Portfolio Command Center Design

## Outcome

The Command Center must answer two questions before it presents recommendations: how much verified activity the portfolio received on the latest complete day, and which App or website produced it. It must show a portfolio total and an itemized breakdown for five Apps and six websites.

## Data contract

The daily website layer uses verified GA4 observations. `active_users` is presented as UV, `page_views` as PV, with sessions and primary CTA events beside them. Website totals are sums of the reporting website rows. Because the current Provider reports by hostname, the UV total is explicitly identified as a site-level sum; the same person may be counted on more than one website.

Daily App rows use only observations whose period start and end are the selected day. Historical or 90-day App Store snapshots never enter daily totals. The latest verified acquisition period is shown separately for context. Missing observations remain `null` and render as an em dash.

## Interface

The first Command Center section is a dense telemetry rack with a date selector, six portfolio totals, an App + linked-H5 table, and a six-website table. The App table separates linked H5 UV/PV/session metrics from native App DAU and first-time downloads. The website table exposes UV, PV, sessions, CTA events, and analytics connection state.

The visual direction remains the existing industrial, future-facing AI COO console: cyan telemetry values, lime coverage signals, fine grid lines, tabular monospace numerals, and restrained scan-line depth. Tables scroll horizontally on narrow screens; KPI cards collapse from six to three, then two columns.

## Verification

- Domain tests prove total and per-property aggregation, daily-period isolation, and `null` preservation.
- Static UI tests prove the bilingual labels and daily portfolio binding are shipped.
- Full tests, static build, state check, public safety scan, desktop and mobile screenshots, and live HTTP checks gate deployment.
