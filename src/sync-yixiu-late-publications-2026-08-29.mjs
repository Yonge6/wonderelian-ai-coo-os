import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";

const store = new JsonStore(fileURLToPath(new URL("../data/state.json", import.meta.url)));
const appStoreBase = "https://apps.apple.com/us/app/yixiu-white-noise-sleep/id1461182261";
const ppid = {
  sleep:"67cb8784-2b16-4849-b940-90fdf4d99752",
  focus:"7890afd3-dd12-4215-a5c5-17f4ebc28759",
  reset:"6c015245-76ff-4266-8837-5a0ffc289b9c",
};
const appStore = (intent, campaignToken = null) => {
  const base = `${appStoreBase}?ppid=${ppid[intent]}`;
  return campaignToken ? `${base}&pt=120014121&ct=${campaignToken}&mt=8` : base;
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
const record = ({intent="sleep", ...item}) => ({
  app_id:"yixiu-meditation",
  ...item,
  publish_url:item.url,
  status:"published",
  published_at:"2026-08-29",
  app_store_campaign_url:item.app_store_campaign_url ?? appStore(intent),
  ...unknownMetrics,
});
const records = [
  record({
    id:"yixiu-owned-best-sleep-sounds-20260829",
    channel_id:"owned-search",
    type:"search_landing",
    title:"Best Sleep Sounds: Rain, Ocean, Forest or White Noise?",
    url:"https://yixiu.wonderelian.com/best-sleep-sounds/",
    campaign_id:"sleep_sounds",
    landing_url:"https://yixiu.wonderelian.com/best-sleep-sounds/",
  }),
  record({
    id:"yixiu-pinterest-best-sleep-sounds-20260829",
    channel_id:"pinterest",
    type:"pin",
    title:"Best Sleep Sounds: Rain, Ocean, Forest or White Noise?",
    url:"https://www.pinterest.com/pin/1147643917690391250/",
    campaign_id:"sleep_sounds",
    landing_url:"https://yixiu.wonderelian.com/best-sleep-sounds/?utm_source=pinterest&utm_medium=organic_url_pin&utm_campaign=sleep_sounds&utm_content=best_sleep_sounds_comparison_pin_01",
  }),
  record({
    id:"yixiu-instagram-underwater-white-noise-reel-20260829",
    channel_id:"instagram",
    type:"reel",
    title:"Underwater White Noise with a Black Screen",
    url:"https://www.instagram.com/wonderelian/reel/DcnlGY2J3b5/",
    campaign_id:"sleep_sounds",
    landing_url:"https://yixiu.wonderelian.com/underwater-white-noise-for-sleep/?utm_source=instagram&utm_medium=organic_reel&utm_campaign=sleep_sounds&utm_content=underwater_white_noise_black_screen_reel_13",
  }),
  record({
    intent:"reset",
    id:"yixiu-pinterest-one-minute-reset-video-20260829",
    channel_id:"pinterest",
    type:"video_pin",
    title:"A One-Minute Reset for a Loud Day | Yixiu",
    url:"https://www.pinterest.com/pin/1147643917690399312/",
    campaign_id:"one_minute_reset",
    landing_url:"https://yixiu.wonderelian.com/one-minute-reset/?utm_source=pinterest&utm_medium=organic_video&utm_campaign=one_minute_reset&utm_content=water_breathing_video_pin_01",
  }),
  record({
    id:"yixiu-github-nature-sound-collection-release-20260829",
    channel_id:"github",
    type:"release",
    title:"Yixiu Web 2026-08-29 · Free Nature Sound Collection",
    url:"https://github.com/Yonge6/yixiu-meditation/releases/tag/yixiu-web-20260829-nature-sound-collection",
    campaign_id:"nature_sound_collection",
    landing_url:"https://yixiu.wonderelian.com/?utm_source=github&utm_medium=organic_release&utm_campaign=nature_sound_collection&utm_content=collection_home",
    app_store_campaign_url:appStore("sleep", "yixiu_github_collection_20260829"),
  }),
  record({
    id:"yixiu-youtube-white-noise-community-20260829",
    channel_id:"youtube",
    type:"community_post",
    title:"White Noise with a Black Screen",
    url:"https://www.youtube.com/post/Ugkx7SdYelmPihC9Sl3QkLfV4hhEl8PTkwEL",
    campaign_id:"sleep_sounds",
    landing_url:"https://yixiu.wonderelian.com/underwater-white-noise-for-sleep/?utm_source=youtube&utm_medium=organic_social&utm_campaign=sleep_sounds&utm_content=community_white_noise_black_screen_03",
  }),
  record({
    id:"yixiu-youtube-channel-home-profile-20260829",
    channel_id:"youtube",
    type:"channel_profile_update",
    title:"Yixiu Sleep & Focus Channel Home and Profile Path",
    url:"https://www.youtube.com/@WonderElian1",
    campaign_id:"yixiu_channel",
    landing_url:"https://yixiu.wonderelian.com/?utm_source=youtube&utm_medium=organic_profile&utm_campaign=yixiu_channel&utm_content=channel_profile_yixiu_01",
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

  const auditIds = new Set([
    "audit-yixiu-late-publications-20260830",
    "audit-yixiu-20260829-project-operations-20260830",
  ]);
  state.audit = (state.audit ?? []).filter((item) => !auditIds.has(item.id));
  const at = new Date().toISOString();
  state.audit.unshift({
    id:"audit-yixiu-20260829-project-operations-20260830",
    at,
    actor:"AI COO OS",
    app_id:"yixiu-meditation",
    source:"verified_yixiu_growth_repository_release_records",
    action:"sync_verified_yixiu_2026_08_29_project_operations",
    input:{external_writes:false,operation_date:"2026-08-29"},
    result:{
      status:"success",
      production_releases_verified:3,
      public_distribution_or_profile_operations_verified:6,
      failed_share_attempts_excluded:true,
      scheduled_youtube_posts_excluded:true,
      unverified_tiktok_excluded:true,
      unknown_apple_metrics_preserved_as_null:true,
    },
    status:"success",
    error:null,
  });
  state.audit.unshift({
    id:"audit-yixiu-late-publications-20260830",
    at,
    actor:"AI COO OS",
    app_id:"yixiu-meditation",
    source:"verified_yixiu_growth_repository_release_records",
    action:"sync_verified_yixiu_late_publications_2026_08_29",
    input:{external_writes:false,operation_date:"2026-08-29"},
    result:{
      status:"success",
      records_inserted:inserted.length,
      records_skipped_existing:skippedExisting.length,
      permanent_urls_required:true,
      unknown_metrics_preserved_as_null:true,
    },
    status:"success",
    error:null,
  });
});

console.log(`YIXIU_LATE_PUBLICATIONS_SYNC_OK manifest=${records.length}`);
