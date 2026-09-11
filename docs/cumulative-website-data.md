# Cumulative website reporting

The dashboard defaults to cumulative reporting and retains a single-day toggle. The date selector is the inclusive interval end; the start is the first verified daily website observation retained in the operating state. This is the tracked period, not an unsupported lifetime total.

The provider requests GA4 reports without the date dimension for each interval. Portfolio users and sessions come from a single report filtered to the seven configured hostnames (including www aliases), so cross-site and cross-date duplicates are not summed. Site-level user aliases are also deduplicated by GA4. CTA totals include only the existing primary-event allowlist. Missing sites and events remain null. App interval user/download values stay null until separately verified; the manual historical App Store baseline remains separate.

`sync:website-analytics` now also calls the cumulative importer. Missing historical interval snapshots are filled once and the latest interval is refreshed on each successful daily import. The imported snapshots include source, exact range, and verification time. Older interval snapshots reflect their recorded import time and may differ from subsequently revised GA4 reports.

Acceptance on 2026-09-11: official range 2026-08-15–2026-09-10 returns UV 618, PV 2231, sessions 1038, CTA 598. All 70 tests, state validation, static export/public-data safety assertions, and 1268/633/390 px browser checks pass. Daily/cumulative switching and historical end-date selection are verified. Production deployment is recorded in the durable portfolio log after external readback.
