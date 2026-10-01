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
