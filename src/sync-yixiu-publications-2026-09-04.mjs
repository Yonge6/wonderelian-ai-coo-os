import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";

const store = new JsonStore(fileURLToPath(new URL("../data/state.json", import.meta.url)));
const appStoreBase = "https://apps.apple.com/us/app/yixiu-white-noise-sleep/id1461182261";
const sleepPpid = "67cb8784-2b16-4849-b940-90fdf4d99752";
const unknownMetrics = {
  impressions:null,
  engagements:null,
  outbound_clicks:null,
  first_time_downloads:null,
  views:null,
  likes:null,
  comments:null,
  shares:null,
  saves:null,
  landing_page_visits:null,
  attributed_conversions:null,
  product_page_views:null,
  trial_starts:null,
  paid_conversions:null,
  measurement_status:"collecting",
};

const records = [{
  id:"yixiu-pinterest-no-account-ocean-20260904",
  app_id:"yixiu-meditation",
  channel_id:"pinterest",
  type:"pin",
  title:"Sleep Sounds Without an Account | Ocean Waves on Yixiu",
  url:"https://www.pinterest.com/pin/1147643917690853905/",
  publish_url:"https://www.pinterest.com/pin/1147643917690853905/",
  status:"published",
  published_at:"2026-09-04",
  campaign_id:"sleep_sounds",
  landing_url:"https://yixiu.wonderelian.com/sleep-sounds/?utm_source=pinterest&utm_medium=organic_social&utm_campaign=sleep_sounds&utm_content=no_account_ocean_20260904",
  app_store_campaign_url:`${appStoreBase}?ppid=${sleepPpid}`,
  ...unknownMetrics,
}];

const canonicalUrl = (value) => String(value ?? "").replace(/\/$/, "");

await store.mutate((state) => {
  const manifestUrls = new Set();
  for (const item of records) {
    const normalized = canonicalUrl(item.publish_url);
    if (manifestUrls.has(normalized)) throw new Error(`duplicate manifest URL: ${item.publish_url}`);
    manifestUrls.add(normalized);
  }

  const ids = new Set(records.map((item) => item.id));
  const existing = (state.content ?? []).filter((item) => !ids.has(item.id));
  const existingUrls = new Set(existing.map((item) => canonicalUrl(item.publish_url ?? item.url)));
  const inserted = records.filter((item) => !existingUrls.has(canonicalUrl(item.publish_url)));
  const skippedExisting = records.filter((item) => existingUrls.has(canonicalUrl(item.publish_url)));
  state.content = [...inserted, ...existing];

  const auditId = "audit-yixiu-publications-20260904";
  state.audit = (state.audit ?? []).filter((item) => item.id !== auditId);
  state.audit.unshift({
    id:auditId,
    at:new Date().toISOString(),
    actor:"AI COO OS",
    app_id:"yixiu-meditation",
    source:"verified_yixiu_growth_ops_log_and_public_pinterest_readback",
    action:"sync_verified_yixiu_publications_2026_09_04",
    input:{external_writes:false,operation_date:"2026-09-04"},
    result:{
      status:"success",
      records_inserted:inserted.length,
      records_skipped_existing:skippedExisting.length,
      permanent_urls_required:true,
      rejected_inaccurate_carousel_assets_excluded:true,
      unknown_metrics_preserved_as_null:true,
    },
    status:"success",
    error:null,
  });
});

console.log(`YIXIU_PUBLICATIONS_20260904_SYNC_OK manifest=${records.length}`);
