import { JsonStore } from "./store.mjs";
import { fileURLToPath } from "node:url";

const store = new JsonStore(fileURLToPath(new URL("../data/state.json", import.meta.url)));

await store.mutate((state) => {
  const old = state.content.find(x => (x.publish_url ?? x.url ?? "").includes("DemOCnBBvPa"));
  if (old) { old.status = "deleted"; old.replaced_by_url = "https://www.instagram.com/wonderelian/reel/Deqqbx4gHSo/"; old.deletion_verified_at = "2026-10-20"; }
  const id = "audit-morning-20261021";
  state.audit = (state.audit ?? []).filter((item) => item.id !== id);
  state.audit.unshift({
    id,
    at: new Date().toISOString(),
    actor: "Codex",
    source: "2026-10-21 morning heartbeat; safe launchctl preflight; official GA4 Data API; verified publication ledgers",
    action: "morning_data_and_publication_reconciliation",
    input: { external_writes: false, website_period_end: "2026-10-20" },
    result: {
      website_data_through: state.metadata.data_through.website_analytics,
      app_data_through: state.metadata.data_through.app_store,
      apple_configuration_present: 0,
      apple_configuration_complete: false,
      apple_key_mode_600: null,
      apple_api_verified: false,
      apple_request_uniqueness_verified: false,
      apple_requests_created: 0,
      app_snapshot_preserved: true,
      ga4_configuration_unique: true,
      ga4_credential_mode_600: true,
      ga4_api_verified: true,
      verified_publications_imported: 8,
      scheduled_drafts_and_unverified_publications_excluded: true,
      phase_4_started: false,
    },
    status: "partial",
    error: {
      code: "APPLE_CONFIGURATION_MISSING",
      message: "App Analytics was not refreshed. The prior official App cutoff remains independent; no report request was created and missing metrics remain null.",
    },
  });
});
