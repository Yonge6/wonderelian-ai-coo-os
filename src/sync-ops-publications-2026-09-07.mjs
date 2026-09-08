import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";

const store = new JsonStore(fileURLToPath(new URL("../data/state.json", import.meta.url)));

await store.mutate((state) => {
  const auditId = "audit-ops-publications-20260907";
  state.audit = (state.audit ?? []).filter((item) => item.id !== auditId);
  state.audit.unshift({
    id: auditId,
    at: "2026-09-08T00:30:00.000Z",
    actor: "AI COO OS",
    app_id: null,
    source: "verified_yixiu_and_style_atlas_durable_ops_logs",
    action: "sync_verified_publication_urls_2026_09_07",
    input: { external_writes: false, operation_date: "2026-09-07" },
    result: {
      status: "success",
      records_inserted: 0,
      verified_business_publication_urls: 0,
      operational_site_and_dashboard_urls_excluded_from_content: 2,
      unverified_attempts_excluded: true,
      unknown_metrics_preserved_as_null: true,
    },
    status: "success",
    error: null,
  });
});

console.log("OPS_PUBLICATIONS_20260907_SYNC_OK inserted=0 content_unchanged=true");
