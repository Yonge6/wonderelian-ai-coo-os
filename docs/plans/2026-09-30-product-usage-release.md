# Product usage — production evidence

- User authorized Yixiu behavior instrumentation and six product dashboards at ops.wonderelian.com; five other products remain placeholders. No other product runtime was changed and no new automation was created.
- Ops source PR #139 merged at `348b604d5d67a360e68f24f00fca704a6d81e047`. Canonical local main fast-forwarded with unrelated untracked files preserved, so the existing website sync can execute the product provider.
- Public view: https://ops.wonderelian.com/#usage . Browser verified six project selectors, bilingual UI, H5/App switch, placeholder null semantics and 390px viewport without horizontal overflow.
- Source is verified GA4 Data API, exactly yixiu.wonderelian.com, 2026-09-02 through 2026-09-29 (Asia/Shanghai). No schema-2 production events had been returned at release. Historic clicks are separate. New counts await real consenting users and GA4 processing.
- App reporting remains blocked by Firebase/GA4 linking permissions; scene_id cannot be created in the read-only custom definitions page. Retention cohorts and Apple revenue reconciliation are explicitly not connected. These are not zero values.
- Verification: state invariant check, public safety scan/static build and 88 tests (including two follow-up stream-isolation/stale-data regression tests). No automated GitHub checks were configured; these checks ran locally.
- Deployment delta archive SHA256: `dbac169ba183790f223e2bc903bdd45df75975831c39adeb69043e1900de5a60`. Result `DEPLOY_OK_PRODUCT_USAGE_20260930_ops`. Baseline index and state hashes checked before mutation; nginx configuration and all seven public file hashes matched after deployment.
- Backup: `/srv/wonderelian/backups/product-usage-20260930-ops`. Only changed frontend/aggregate JSON files copied; no media deleted. Server had about 467MB free at preflight, so a full duplicate site deployment was avoided.
- Yixiu initial deployment also passed with backup `/srv/wonderelian/backups/product-usage-20260930-yixiu`; final playback-cancellation follow-up is documented in the Yixiu repository/release.

Audit: actor=Codex; action=publish authorized usage dashboard; source=explicit user instruction; status=public_verified; limitations=App linkage, scene dimension, cohort retention and Apple outcomes remain pending.
