import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";

const store = new JsonStore(fileURLToPath(new URL("../data/state.json", import.meta.url)));
const appStoreBase = "https://apps.apple.com/us/app/yixiu-white-noise-sleep/id1461182261";
const resetPpid = "6c015245-76ff-4266-8837-5a0ffc289b9c";
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

const record = (item) => ({
  app_id:"yixiu-meditation",
  ...item,
  publish_url:item.url,
  status:"published",
  published_at:"2026-08-30",
  ...unknownMetrics,
});

const records = [
  record({
    id:"yixiu-owned-first-breath-20260830",
    channel_id:"owned-search",
    type:"search_landing",
    title:"1-Minute Meditation Music — Free Full First Breath Track",
    url:"https://yixiu.wonderelian.com/1-minute-meditation-music/",
    campaign_id:"meditation_music",
    landing_url:"https://yixiu.wonderelian.com/1-minute-meditation-music/",
    app_store_campaign_url:`${appStoreBase}?pt=120014121&ct=yixiu_h5_first_breath_20260830&mt=8`,
  }),
  record({
    id:"yixiu-owned-still-water-20260830",
    channel_id:"owned-search",
    type:"search_landing",
    title:"20-Minute Meditation Music — Free Full Still Water Track",
    url:"https://yixiu.wonderelian.com/20-minute-meditation-music/",
    campaign_id:"meditation_music",
    landing_url:"https://yixiu.wonderelian.com/20-minute-meditation-music/",
    app_store_campaign_url:`${appStoreBase}?pt=120014121&ct=yixiu_h5_still_water_20260830&mt=8`,
  }),
  record({
    id:"yixiu-instagram-first-breath-reel-20260830",
    channel_id:"instagram",
    type:"reel",
    title:"One Quiet Minute with First Breath",
    url:"https://www.instagram.com/wonderelian/reel/DcpOEp7w-bf/",
    campaign_id:"meditation_music",
    landing_url:"https://yixiu.wonderelian.com/?utm_source=ig&utm_medium=social&utm_content=link_in_bio",
    app_store_campaign_url:appStoreBase,
  }),
  record({
    id:"yixiu-pinterest-first-breath-20260830",
    channel_id:"pinterest",
    type:"pin",
    title:"First Breath: Free 88-Second Meditation Music",
    url:"https://www.pinterest.com/pin/1147643917690439669/",
    campaign_id:"meditation_music",
    landing_url:"https://yixiu.wonderelian.com/1-minute-meditation-music/?utm_source=pinterest&utm_medium=organic_pin&utm_campaign=meditation_music&utm_content=first_breath_short_pin_01",
    app_store_campaign_url:appStoreBase,
  }),
  record({
    id:"yixiu-pinterest-still-water-20260830",
    channel_id:"pinterest",
    type:"pin",
    title:"20-Minute Meditation Music for Sleep & Deep Focus | Still Water",
    url:"https://www.pinterest.com/pin/1147643917690412709/",
    campaign_id:"meditation_music",
    landing_url:"https://yixiu.wonderelian.com/20-minute-meditation-music/?utm_source=pinterest&utm_medium=organic_pin&utm_campaign=meditation_music&utm_content=still_water_20_min_pin_01",
    app_store_campaign_url:appStoreBase,
  }),
  record({
    id:"yixiu-pinterest-duration-choice-20260830",
    channel_id:"pinterest",
    type:"infographic_pin",
    title:"1-Minute vs 20-Minute Meditation Music: Which Fits Today?",
    url:"https://www.pinterest.com/pin/1147643917690442973/",
    campaign_id:"meditation_music",
    landing_url:"https://yixiu.wonderelian.com/guides/?utm_source=pinterest&utm_medium=organic_infographic&utm_campaign=meditation_music&utm_content=one_vs_twenty_minute_choice_pin_01",
    app_store_campaign_url:appStoreBase,
  }),
  record({
    id:"yixiu-youtube-one-minute-reset-community-20260830",
    channel_id:"youtube",
    type:"community_post",
    title:"One-Minute Water-Breathing Reset",
    url:"https://www.youtube.com/post/Ugkx2c0jlPyDpPdF8X1SgX1ubmGm_4t0yTGD",
    campaign_id:"one_minute_reset",
    landing_url:"https://yixiu.wonderelian.com/one-minute-reset/?utm_source=youtube&utm_medium=organic_social&utm_campaign=one_minute_reset&utm_content=community_water_breathing_reset_04",
    app_store_campaign_url:`${appStoreBase}?ppid=${resetPpid}&pt=120014121&ct=yixiu_youtube_reset_20260830&mt=8`,
  }),
  record({
    id:"yixiu-youtube-duration-choice-community-20260830",
    channel_id:"youtube",
    type:"community_post",
    title:"One Minute or Twenty?",
    url:"https://www.youtube.com/post/UgkxCy9fu4Y3e3kFnZFJ10_k2UmPfiAcmQ4G",
    campaign_id:"meditation_music",
    landing_url:"https://yixiu.wonderelian.com/guides/?utm_source=youtube&utm_medium=organic_social&utm_campaign=meditation_music&utm_content=community_duration_choice_01",
    app_store_campaign_url:`${appStoreBase}?pt=120014121&ct=yixiu_youtube_duration_choice_20260901&mt=8`,
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

  const guidesUrl = canonicalUrl("https://yixiu.wonderelian.com/guides/");
  const guidesReconciled = state.content.some((item) => canonicalUrl(item.publish_url ?? item.url) === guidesUrl);
  const auditId = "audit-yixiu-publications-20260830-reconciled-20260901";
  state.audit = (state.audit ?? []).filter((item) => item.id !== auditId);
  state.audit.unshift({
    id:auditId,
    at:new Date().toISOString(),
    actor:"AI COO OS",
    app_id:"yixiu-meditation",
    source:"verified_yixiu_growth_repository_release_records_and_durable_ops_log",
    action:"sync_verified_yixiu_publications_2026_08_30",
    input:{external_writes:false,operation_date:"2026-08-30"},
    result:{
      status:"success",
      records_inserted:inserted.length,
      records_skipped_existing:skippedExisting.length,
      existing_guides_permanent_url_reconciled:guidesReconciled,
      verified_operations_represented:inserted.length + (guidesReconciled ? 1 : 0),
      permanent_urls_required:true,
      unknown_metrics_preserved_as_null:true,
    },
    status:"success",
    error:null,
  });
});

console.log(`YIXIU_PUBLICATIONS_20260830_SYNC_OK manifest=${records.length}`);
