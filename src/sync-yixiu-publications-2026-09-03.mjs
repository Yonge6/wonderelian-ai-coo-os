import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";

const store = new JsonStore(fileURLToPath(new URL("../data/state.json", import.meta.url)));
const appStoreBase = "https://apps.apple.com/us/app/yixiu-white-noise-sleep/id1461182261";
const ppid = {
  sleep:"67cb8784-2b16-4849-b940-90fdf4d99752",
  focus:"7890afd3-dd12-4215-a5c5-17f4ebc28759",
};
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
const record = ({ intent, ...item }) => ({
  app_id:"yixiu-meditation",
  ...item,
  publish_url:item.url,
  status:"published",
  published_at:"2026-09-03",
  app_store_campaign_url:`${appStoreBase}?ppid=${ppid[intent]}`,
  ...unknownMetrics,
});

const records = [
  record({
    intent:"sleep",
    id:"yixiu-youtube-distant-thunder-short-20260903",
    channel_id:"youtube",
    type:"short",
    title:"Thunderstorm Sounds for Sleep — Distant Thunder, No Talking",
    url:"https://www.youtube.com/shorts/_sMmBoAl0zU",
    campaign_id:"sleep_sounds",
    landing_url:"https://yixiu.wonderelian.com/thunderstorm-sounds-for-sleep/?utm_source=youtube&utm_medium=organic_video&utm_campaign=sleep_sounds&utm_content=distant_thunder_sleep_short_08_description",
  }),
  record({
    intent:"focus",
    id:"yixiu-youtube-morning-birds-short-20260903",
    channel_id:"youtube",
    type:"short",
    title:"Morning Bird Sounds for Focus — No Music, No Talking",
    url:"https://www.youtube.com/shorts/N4DcQXJAB34",
    campaign_id:"focus_sounds",
    landing_url:"https://yixiu.wonderelian.com/morning-bird-sounds-for-focus/?utm_source=youtube&utm_medium=organic_video&utm_campaign=focus_sounds&utm_content=morning_birds_focus_short_09_description",
  }),
];

const canonicalUrl = (value) => String(value ?? "")
  .replace(/^https:\/\/youtube\.com/, "https://www.youtube.com")
  .replace(/\/$/, "");

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

  const auditId = "audit-yixiu-publications-20260903";
  state.audit = (state.audit ?? []).filter((item) => item.id !== auditId);
  state.audit.unshift({
    id:auditId,
    at:new Date().toISOString(),
    actor:"AI COO OS",
    app_id:"yixiu-meditation",
    source:"verified_yixiu_growth_ops_log_and_public_youtube_oembed_readback",
    action:"sync_verified_yixiu_publications_2026_09_03",
    input:{external_writes:false,operation_date:"2026-09-03"},
    result:{
      status:"success",
      records_inserted:inserted.length,
      records_skipped_existing:skippedExisting.length,
      permanent_urls_required:true,
      blocked_quiet_pass_asset_excluded:true,
      blocked_product_trust_generation_excluded:true,
      unknown_metrics_preserved_as_null:true,
    },
    status:"success",
    error:null,
  });
});

console.log(`YIXIU_PUBLICATIONS_20260903_SYNC_OK manifest=${records.length}`);
