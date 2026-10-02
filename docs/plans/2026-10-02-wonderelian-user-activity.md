# WonderElian user-activity reporting

## Goal

Extend the existing OPS `User Activity` module with a dedicated WonderElian view using the same reporting pattern as Yixiu, Style Atlas and Buer.

## Data flow

1. WonderElian sends only consented, allowlisted `wonder_v1_*` events to the existing GA4 property.
2. `ProductAnalyticsProvider.fetchWonderElianUsage` queries the exact `wonderelian.com` and `www.wonderelian.com` hosts for the last 28 complete Beijing days.
3. The provider filters all detailed metrics to the new prefix and separately retains the earlier generic events as `legacy_events`.
4. The existing product-analytics sync stores the snapshot and preserves the last verified evidence if the provider or a content-dimension query fails.
5. The existing bilingual `User Activity` page renders audience, reading, discovery, product controls, content preferences, daily observations and unavailable retention.

## Metric semantics

- Users are GA4-deduplicated over the full displayed period. Daily users are not summed.
- Active and reading time come from explicit duration events; page presence is not treated as time spent.
- A note or project open is an action, not a completed read, install, payment, or later conversion.
- Audio start and listening time are separate. A request or start does not imply a completed listening session.
- Missing observations remain `null` and display as `—`.
- Legacy page views and generic click events remain visibly separate from the consented schema.

## Failure handling

- A provider failure retains the previous verified WonderElian snapshot with `unavailable` status.
- An unavailable `contentId` dimension retains the previous content rows and shows the error state.
- Sampling and privacy-threshold flags are displayed.
- GA4 processing delay produces `waiting_for_events`; it is not reported as zero.

## Acceptance

- Provider tests prove exact-host isolation and prefix filtering.
- Sync tests prove WonderElian uses the dedicated query and preserves evidence.
- View tests prove bilingual labels, null semantics and separation of legacy data.
- Full OPS tests and static checks pass before deployment.
- Production readback from `ops.wonderelian.com/#usage` shows the dedicated WonderElian panels.
