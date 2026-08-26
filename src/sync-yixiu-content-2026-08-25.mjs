import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";

const store = new JsonStore(fileURLToPath(new URL("../data/state.json", import.meta.url)));
const publishedAt = "2026-08-25";
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

const landing = (path, source, medium, campaign, content) =>
  `https://yixiu.wonderelian.com/${path}/?utm_source=${source}&utm_medium=${medium}&utm_campaign=${campaign}&utm_content=${content}`;
const appStore = (intent) => `${appStoreBase}?ppid=${ppid[intent]}`;

const records = [
  {id:"yixiu-youtube-mountain-stream-long-20260825",channel_id:"youtube",type:"long_video",title:"Mountain Stream Sounds for Focus — 15 Minutes, No Music, No Talking",url:"https://www.youtube.com/watch?v=lfDiI0TAq1c",campaign_id:"focus_sounds",landing_url:landing("mountain-stream-sounds-for-focus","youtube","organic_video","focus_sounds","mountain_stream_focus_15min_01_description"),app_store_campaign_url:appStore("focus")},
  {id:"yixiu-youtube-mountain-stream-long-comment-20260825",channel_id:"youtube",type:"community_reply",title:"Mountain Stream Focus video conversion comment",url:"https://www.youtube.com/watch?v=lfDiI0TAq1c&lc=UgxGbsE05-JnJk3nNf54AaABAg",campaign_id:"focus_sounds",landing_url:landing("mountain-stream-sounds-for-focus","youtube","organic_comment","focus_sounds","mountain_stream_focus_15min_01_comment"),app_store_campaign_url:appStore("focus")},
  {id:"yixiu-pinterest-rain-sleep-video-20260825",channel_id:"pinterest",type:"video_pin",title:"Rain Sounds for Sleep — No Music, No Talking",url:"https://www.pinterest.com/pin/1147643917690004904/",campaign_id:"sleep_sounds",landing_url:landing("sleep-sounds","pinterest","organic_pin","sleep_sounds","rain_sleep_video_pin_02"),app_store_campaign_url:appStore("sleep")},
  {id:"yixiu-youtube-mountain-stream-short-20260825",channel_id:"youtube",type:"short",title:"Mountain Stream for Focus — No Music, No Talking",url:"https://youtube.com/shorts/TU5S6SH4s6g",campaign_id:"focus_sounds",landing_url:landing("mountain-stream-sounds-for-focus","youtube","organic_video","focus_sounds","mountain_stream_focus_short_03_description"),app_store_campaign_url:appStore("focus")},
  {id:"yixiu-youtube-rain-reading-short-20260825",channel_id:"youtube",type:"short",title:"Rain Sounds for Reading — No Music, No Talking",url:"https://youtube.com/shorts/aVEga37U6dw",campaign_id:"reading_sounds",landing_url:landing("rain-sounds-for-reading","youtube","organic_video","reading_sounds","rain_reading_short_04_description"),app_store_campaign_url:appStore("focus")},
  {id:"yixiu-youtube-rain-reading-comment-20260825",channel_id:"youtube",type:"community_reply",title:"Rain Sounds for Reading conversion comment",url:"https://www.youtube.com/watch?v=aVEga37U6dw&lc=UgxzJ9vsI6mgVjjpYnN4AaABAg",campaign_id:"reading_sounds",landing_url:landing("rain-sounds-for-reading","youtube","organic_comment","reading_sounds","rain_reading_short_04_comment"),app_store_campaign_url:appStore("focus")},
  {id:"yixiu-pinterest-rain-reading-video-20260825",channel_id:"pinterest",type:"video_pin",title:"Rain Sounds for Reading — No Music, No Talking",url:"https://www.pinterest.com/pin/383228249567990619/",campaign_id:"reading_sounds",landing_url:landing("rain-sounds-for-reading","pinterest","organic_pin","reading_sounds","rain_reading_video_pin_04"),app_store_campaign_url:appStore("focus")},
  {id:"yixiu-pinterest-mountain-stream-video-20260825",channel_id:"pinterest",type:"video_pin",title:"Mountain Stream Sounds for Focus — No Music, No Talking",url:"https://www.pinterest.com/pin/383228249567990642/",campaign_id:"focus_sounds",landing_url:landing("mountain-stream-sounds-for-focus","pinterest","organic_pin","focus_sounds","mountain_stream_focus_video_pin_03"),app_store_campaign_url:appStore("focus")},
  {id:"yixiu-youtube-waterfall-short-20260825",channel_id:"youtube",type:"short",title:"Waterfall Sounds for Noise Masking — No Music, No Talking",url:"https://youtube.com/shorts/mWZBX19LNpg",campaign_id:"noise_masking",landing_url:landing("waterfall-sounds-for-noise-masking","youtube","organic_video","noise_masking","waterfall_noise_masking_short_05_description"),app_store_campaign_url:appStore("focus")},
  {id:"yixiu-youtube-waterfall-comment-20260825",channel_id:"youtube",type:"community_reply",title:"Waterfall Noise Masking conversion comment",url:"https://www.youtube.com/watch?v=mWZBX19LNpg&lc=Ugx6n2n3WAqJuIeTwBd4AaABAg",campaign_id:"noise_masking",landing_url:landing("waterfall-sounds-for-noise-masking","youtube","organic_comment","noise_masking","waterfall_noise_masking_short_05_comment"),app_store_campaign_url:appStore("focus")},
  {id:"yixiu-pinterest-waterfall-video-20260825",channel_id:"pinterest",type:"video_pin",title:"Waterfall Sounds for Noise Masking — No Music, No Talking",url:"https://www.pinterest.com/pin/383228249567991150/",campaign_id:"noise_masking",landing_url:landing("waterfall-sounds-for-noise-masking","pinterest","organic_pin","noise_masking","waterfall_noise_masking_video_pin_05"),app_store_campaign_url:appStore("focus")},
  {id:"yixiu-youtube-ocean-focus-short-20260825",channel_id:"youtube",type:"short",title:"Ocean Waves for Focus — No Music, No Talking",url:"https://youtube.com/shorts/oZFW__xNWJI",campaign_id:"focus_sounds",landing_url:landing("ocean-waves-for-focus","youtube","organic_video","focus_sounds","ocean_waves_focus_short_06_description"),app_store_campaign_url:appStore("focus")},
  {id:"yixiu-youtube-ocean-focus-comment-20260825",channel_id:"youtube",type:"community_reply",title:"Ocean Waves Focus conversion comment",url:"https://www.youtube.com/watch?v=oZFW__xNWJI&lc=UgwR1lneTki1YUVydFV4AaABAg",campaign_id:"focus_sounds",landing_url:landing("ocean-waves-for-focus","youtube","organic_comment","focus_sounds","ocean_waves_focus_short_06_comment"),app_store_campaign_url:appStore("focus")},
  {id:"yixiu-pinterest-ocean-focus-video-20260825",channel_id:"pinterest",type:"video_pin",title:"Ocean Waves for Focus — No Music, No Talking",url:"https://www.pinterest.com/pin/1147643917690059827/",campaign_id:"focus_sounds",landing_url:landing("ocean-waves-for-focus","pinterest","organic_pin","focus_sounds","ocean_waves_focus_video_pin_06"),app_store_campaign_url:appStore("focus")},
  {id:"yixiu-pinterest-mountain-stream-static-20260825",channel_id:"pinterest",type:"pin",title:"Focus With Water — 15 Minutes of Mountain Stream",url:"https://www.pinterest.com/pin/1147643917690063136/",campaign_id:"focus_sounds",landing_url:landing("mountain-stream-sounds-for-focus","pinterest","organic_pin","focus_sounds","mountain_stream_focus_static_pin_07"),app_store_campaign_url:appStore("focus")},
  {id:"yixiu-youtube-rain-window-sleep-short-20260825",channel_id:"youtube",type:"short",title:"Rain on Window for Sleep — No Music, No Talking",url:"https://youtube.com/shorts/qhiCegeDFUQ",campaign_id:"sleep_sounds",landing_url:landing("sleep-sounds","youtube","organic_video","sleep_sounds","rain_window_sleep_short_07_description"),app_store_campaign_url:appStore("sleep")},
  {id:"yixiu-youtube-rain-window-sleep-comment-20260825",channel_id:"youtube",type:"community_reply",title:"Rain on Window Sleep conversion comment",url:"https://www.youtube.com/watch?v=qhiCegeDFUQ&lc=UgxauHW9f1GOBXc50lZ4AaABAg",campaign_id:"sleep_sounds",landing_url:landing("sleep-sounds","youtube","organic_comment","sleep_sounds","rain_window_sleep_short_07_comment"),app_store_campaign_url:appStore("sleep")},
].map((record)=>({
  app_id:"yixiu-meditation",
  ...record,
  publish_url:record.url,
  status:"published",
  published_at:publishedAt,
  ...unknownMetrics,
}));

await store.mutate((state)=>{
  const ids = new Set(records.map((record)=>record.id));
  state.content = [...records, ...(state.content??[]).filter((record)=>!ids.has(record.id))];
  const auditId = "audit-yixiu-content-ledger-20260825";
  state.audit = (state.audit??[]).filter((record)=>record.id!==auditId);
  state.audit.unshift({
    id:auditId,
    at:new Date().toISOString(),
    actor:"AI COO OS",
    app_id:"yixiu-meditation",
    source:"verified_yixiu_growth_ops_log",
    action:"sync_verified_2026_08_25_content_permalinks",
    input:{external_writes:false,published_date:publishedAt},
    result:{status:"success",records_inserted:records.length,unknown_metrics_preserved_as_null:true,pending_publications_excluded:true},
    status:"success",
    error:null,
  });
});

console.log(`YIXIU_CONTENT_SYNC_OK date=${publishedAt} records=${records.length}`);
