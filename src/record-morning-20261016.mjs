import { JsonStore } from "./store.mjs";
import { fileURLToPath } from "node:url";

const store=new JsonStore(fileURLToPath(new URL("../data/state.json",import.meta.url)));
await store.mutate((state)=>{
  const id="audit-morning-20261016";
  state.audit=(state.audit??[]).filter((item)=>item.id!==id);
  state.audit.unshift({
    id,
    at:new Date().toISOString(),
    actor:"Codex",
    source:"2026-10-16 morning heartbeat; safe launchctl preflight; official GA4 Data API; verified October 15 publication ledgers",
    action:"morning_data_and_publication_reconciliation",
    input:{external_writes:false,website_period_end:"2026-10-15"},
    result:{
      website_data_through:state.metadata.data_through.website_analytics,
      app_data_through:state.metadata.data_through.app_store,
      apple_configuration_present:0,
      apple_configuration_complete:false,
      apple_key_mode_600:false,
      apple_api_verified:false,
      apple_requests_created:0,
      app_snapshot_preserved:true,
      phase_4_started:false,
      unverified_publications_excluded:true,
    },
    status:"partial",
    error:{
      code:"APPLE_CONFIGURATION_MISSING",
      message:"App Analytics was not refreshed. The prior official App cutoff remains independent; no report request was created and missing metrics remain null.",
    },
  });
});
