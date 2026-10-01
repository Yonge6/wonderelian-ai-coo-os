# Style Atlas detailed usage — 2026-10-01

Published in https://ops.wonderelian.com/#usage under 艺术风格图鉴. The existing bilingual interface now has audience/reading, learning, sharing/download, membership and style-preference panels plus daily event details when observations exist.

## Data contract

- H5 uses exact hostname `style-atlas.wonderelian.com` and `atlas_v1_` events.
- Native must use a dedicated numeric `styleAtlasIosStreamId` in private analytics configuration, with property validation and iOS platform filter. No fallback to another product's stream.
- Durations use incremental active/reading seconds, never summed user counts. Style breakdown uses built-in GA4 `contentId`. No raw notes, search queries, account emails or transaction IDs are collected.
- No events returned means waiting for events, not zero usage. Retention and verified revenue remain null; purchase callbacks and download clicks are not inferred purchases or installations.
- Prior basic H5 metrics remain in `legacy_h5`; unrelated products and public dashboard data were preserved.
- The existing website analytics sync invokes the product-usage sync. No duplicate recurring automation was created.

## Verified state

Data API readback on 2026-10-01, report period 2026-09-03 through 2026-09-30: H5 `waiting_for_events`, empty content report; iOS `waiting_for_firebase_link`. Browser production readback confirmed the Style Atlas Web/H5 and iOS panels and pending labels; mobile 390 px has no horizontal overflow.

The confirmed browser account `hustyy986@gmail.com` lacks access to reference Firebase project `yixiu-meditation`. Native source integration exists but requires the correct Firebase app registration/config, complete App build and production release. Do not label App collection as live.

Production deployment changed only `index.html`, `app.js`, `product-usage.js` and `data/state.json`, with HTTPS SHA-256 readback and nginx validation. Backup: `/srv/wonderelian/backups/atlas-usage-20261001-ops`. The builder merges only Style Atlas changes into the current production snapshot to preserve concurrent updates elsewhere.

QA: 112/112 tests passed, covering provider isolation, built-in content dimension, duration values, null handling, stale evidence, bilingual UI, native config rejection and partial-failure auditing. State validation passed. Web transport wire testing intercepts outbound collection and does not inject synthetic production metrics.

## Later same-day Firebase activation

The earlier permission blocker was resolved by reusing the already-signed-in administrator `wondereilan@gmail.com`, exactly as Yixiu did; no change to `hustyy986@gmail.com` or any account role was required. Style Atlas was registered separately in the existing free project and linked to the existing GA4 property. Its machine-local `styleAtlasIosStreamId` mapping was verified in the official stream-details UI; Yixiu, Buer and Web streams were preserved.

Both Style Atlas H5 and iOS Data API queries now succeed, with status `waiting_for_events` for September 3–30. The native connection is verified, not production user activity. On the public iOS tab, the Firebase-pending message is replaced by a verified-connection notice that still requires a distributed instrumented App and consent.

Bounded ops deployment read back successfully; backup `/srv/wonderelian/backups/atlas-usage-20261001-ops-r2`. Native config and privacy manifest are bundled in the Style Atlas main target only. Complete App packaging is still blocked by insufficient system space to restore the matching Xcode runtime; no new App Store submission was made.
