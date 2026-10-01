# Buer usage release — 2026-10-01

- Actor: Codex, executing the user's explicit Buer H5/App instrumentation and ops deployment request.
- Source: GA4 property 549913650, exact H5 hostname buer.wonderelian.com; native Buer stream 15912522443, independent of Yixiu.
- Action: deployed seven scoped files to ops.wonderelian.com; source 34b12b3, generated snapshot and deployment script 181caa9.
- Result/status: DEPLOY_OK_BUER_USAGE; all deployed file hashes read back through HTTPS; NOESIS JS/CSS unchanged. Browser readback shows Buer conversation, growth, membership and retention sections with H5/iOS selection.
- Data: official reporting period 2026-09-03 through 2026-09-30 returned waiting_for_events. Missing observations, revenue and retention remain null, not zero or inferred success.
- Rollback: /srv/wonderelian/backups/ops-before-buer-usage-20261001 contains the exact seven predeployment files. No product assets or other project code were removed.
- Native production observations require the instrumented App Store release and user opt-in. TestFlight/development observations are excluded. App Review completion is recorded separately in the Buer repository.
