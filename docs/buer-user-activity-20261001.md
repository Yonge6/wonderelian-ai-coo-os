# Buer and portfolio user activity

## Scope

User authorized replacing Human Design's active portfolio URL/title/introduction with Buer Within / 不二见己, renaming 产品使用 to 用户使用, and connecting all listed projects.

- Active destination: https://buer.wonderelian.com/
- Verified public description: AI growth companion Doudoulong, Human Design self-observation, HUMAN 3.0 interviews and personal experience/reflection.
- Existing app/site IDs remain stable so Apple and operating references stay valid.
- Legacy Human Design metrics, health observations and all 47 cumulative snapshots are retained in `website_history`. They are not relabeled as Buer observations.
- All 47 current cumulative periods were re-queried from the official GA4 Data API for the new seven-host portfolio. Never subtract UV from old cross-site deduplicated totals.

## User activity

The existing daily website sync already invokes `syncProductAnalyticsState`; it now reads all seven projects without creating another automation. Yixiu retains its specialized playback / listening / native stream reporting. The other projects use exact hostname filters for period-deduplicated users, PV, sessions, engaged sessions, engagement duration, event counts/users, and daily observations. Maker and the brand website are web-only. No new native stream IDs are inferred.

2026-09-03 through 2026-09-30, read back from official GA4 on October 1:

| Project | Period users | Event types returned |
| --- | ---: | ---: |
| Yixiu | 299 | 7 current-schema events |
| Wendao | 73 | 8 |
| Xiazi | 52 | 7 |
| Style Atlas | 44 | 5 |
| Maker | 26 | 9 |
| WonderElian | 91 | 8 |
| Buer | null | no rows |

Event counts are not user-funnel conversions. GA4 engagement duration is not Yixiu listening duration. Unverified retention, trials, revenue, and native usage remain null/unconnected.

## Blockers and boundaries

1. Buer's public `analytics.js` on October 1 returns immediately unless hostname is `human-design.wonderelian.com`. Public HTML has the script, but its new-domain reporting does not run. Official API reports no Buer rows. This ops repository's protected boundary forbids editing production product repositories here; product-side repair remains required.
2. Read-only SSH preflight found the ops production filesystem at 100%, available 0 KiB. No production mutation or deletion attempted. Production rollout requires user-directed disk recovery. GitHub Pages publication alone is not custom-domain acceptance because its CNAME is the same Alibaba-served domain.

## Verification

Local browser: Chinese navigation label, seven project selectors, Wendao real metrics/events, Buer honest empty state, Buer intro and link, no active Human Design link, 390 px viewport without horizontal page overflow. Audit trail includes migration, provider query, cumulative refresh and public health probe.

## October 1 owner-approved recovery and activation

The owner explicitly approved old OPS backup recovery and the Buer product-repository patch. Seven exact September 24–29 backup directories were downloaded to the local operations recovery archive; every one of 371 regular files matched SHA-256 before server removal. September 30 and October 1 rollback copies remain. Archive SHA-256: `2e0e87eec2990aed211ec6232a041a4765e9babd73c9c1fc4fa29076d2898c33`.

The filesystem's ordinary-user available count is zero; inspection found about 1.7 GiB of free blocks reserved for the existing root deployment identity. No filesystem reserve policy was changed. The bounded deployment enforces 1 GiB actual free space, backs up seven replaced files, and preserves every NOESIS design asset.

Buer source commits `c4a14ca` and `6f46eb0` allow only the old and new production hostnames, use the matching canonical page location/title/cookie scope, and version nested resources. Native/insecure/unknown-host exclusions and consent-gated chart events remain unchanged. No birth values, query strings, referrers or conversation content are collected by this change. All 150 product unit tests passed. Independent artifact commit `439e9fe4d9c5c67534729709150ef0585ca64a75` was published by Pages run `36822899309` (success). Four public artifacts return HTTP 200 with matching hashes; the live iframe configuration is initialized for Buer. Browser verification visits are not acquisition evidence. Processed Buer GA4 observations remain null until the existing daily report imports them.
