import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";

const store = new JsonStore(fileURLToPath(new URL("../data/state.json", import.meta.url)));
const publishedAt = "2026-08-24";
const appStoreBase = "https://apps.apple.com/us/app/yixiu-white-noise-sleep/id1461182261";
const ppid = {
  sleep:"67cb8784-2b16-4849-b940-90fdf4d99752",
  focus:"7890afd3-dd12-4215-a5c5-17f4ebc28759",
  reset:"6c015245-76ff-4266-8837-5a0ffc289b9c",
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
  measurement_status:"collecting",
};

const landing = (path, source, medium, campaign, content) =>
  `https://yixiu.wonderelian.com/${path}/?utm_source=${source}&utm_medium=${medium}&utm_campaign=${campaign}&utm_content=${content}`;
const appStore = (intent) => `${appStoreBase}?ppid=${ppid[intent]}`;

const records = [
  {id:"yixiu-instagram-intent-carousel-20260824",channel_id:"instagram",type:"carousel",title:"Sleep, Focus and One-Minute Reset",url:"https://www.instagram.com/wonderelian/p/DcY3T5pm-SY/"},
  {id:"yixiu-pinterest-rain-sleep-20260824",channel_id:"pinterest",type:"pin",title:"Rain Sounds for Sleep",url:"https://www.pinterest.com/pin/1147643917689917821/",campaign_id:"sleep_sounds",landing_url:landing("sleep-sounds","pinterest","organic_social","sleep_sounds","rain_pin_01"),app_store_campaign_url:appStore("sleep")},
  {id:"yixiu-pinterest-reset-20260824",channel_id:"pinterest",type:"pin",title:"One-Minute Reset",url:"https://www.pinterest.com/pin/1147643917689918061/",campaign_id:"one_minute_reset",landing_url:landing("one-minute-reset","pinterest","organic_social","one_minute_reset","reset_pin_01"),app_store_campaign_url:appStore("reset")},
  {id:"yixiu-pinterest-stream-focus-20260824",channel_id:"pinterest",type:"pin",title:"Stream Sounds for Focus",url:"https://www.pinterest.com/pin/1147643917689918434/",campaign_id:"focus_sounds",landing_url:landing("focus-sounds","pinterest","organic_social","focus_sounds","stream_pin_01"),app_store_campaign_url:appStore("focus")},
  {id:"yixiu-pinterest-fourteen-sounds-20260824",channel_id:"pinterest",type:"pin",title:"14 Nature Sounds for Sleep, Focus and Quiet",url:"https://www.pinterest.com/pin/1147643917689959758/",campaign_id:"sleep_sounds",landing_url:landing("sleep-sounds","pinterest","organic_social","sleep_sounds","14_sounds_pin_02"),app_store_campaign_url:appStore("sleep")},
  {id:"yixiu-instagram-present-carousel-20260824",channel_id:"instagram",type:"carousel",title:"Three Small Ways Back to the Present",url:"https://www.instagram.com/wonderelian/p/DcaFpxWGyxn/"},
  {id:"yixiu-pinterest-morning-birds-20260824",channel_id:"pinterest",type:"pin",title:"Morning Bird Sounds for Focus — No Ads, No Account",url:"https://www.pinterest.com/pin/1147643917689962363/",campaign_id:"focus_sounds",landing_url:landing("focus-sounds","pinterest","organic_social","focus_sounds","morning_birds_pin_03"),app_store_campaign_url:appStore("focus")},
  {id:"yixiu-pinterest-sunny-reset-20260824",channel_id:"pinterest",type:"pin",title:"A One-Minute Nature Reset for a Busy Workday",url:"https://www.pinterest.com/pin/1147643917689962421/",campaign_id:"one_minute_reset",landing_url:landing("one-minute-reset","pinterest","organic_social","one_minute_reset","sunny_valley_pin_02"),app_store_campaign_url:appStore("reset")},
  {id:"yixiu-youtube-community-sleep-20260824",channel_id:"youtube",type:"community_post",title:"Tonight, Try a Quieter Setup",url:"https://www.youtube.com/post/UgkxILwCoSlHASXlXGgSFwqCZaeVEyJauvA9",campaign_id:"sleep_sounds",landing_url:landing("sleep-sounds","youtube","organic_social","sleep_sounds","community_sleep_setup_01"),app_store_campaign_url:appStore("sleep")},
  {id:"yixiu-youtube-rain-short-20260824",channel_id:"youtube",type:"short",title:"Rain on a Window for Sleep — No Talking, Gentle Timer",url:"https://www.youtube.com/shorts/w6ofxBlm1MU",campaign_id:"sleep_sounds",landing_url:landing("sleep-sounds","youtube","organic_video","sleep_sounds","rain_window_short_01"),app_store_campaign_url:appStore("sleep")},
  {id:"yixiu-youtube-ocean-focus-20260824",channel_id:"youtube",type:"long_video",title:"Ocean Waves for Deep Focus — 10 Minutes, No Talking",url:"https://www.youtube.com/watch?v=2nJUyIr9EOY",campaign_id:"focus_sounds",landing_url:landing("ocean-waves-for-focus","youtube","organic_video","ocean_waves_focus","ocean_focus_10min_01_description"),app_store_campaign_url:appStore("focus")},
  {id:"yixiu-youtube-ocean-focus-comment-20260824",channel_id:"youtube",type:"community_reply",title:"Ocean Focus video conversion comment",url:"https://www.youtube.com/watch?v=2nJUyIr9EOY&lc=Ugx2ndK6t0T9txDbolN4AaABAg",campaign_id:"focus_sounds",landing_url:landing("ocean-waves-for-focus","youtube","organic_comment","ocean_waves_focus","ocean_focus_10min_01_comment"),app_store_campaign_url:appStore("focus")},
  {id:"yixiu-youtube-ocean-short-20260824",channel_id:"youtube",type:"short",title:"Ocean Waves for Focus — No Music, No Talking",url:"https://www.youtube.com/shorts/GHAYLQENv18",campaign_id:"focus_sounds",landing_url:landing("ocean-waves-for-focus","youtube","organic_video","ocean_waves_focus","ocean_focus_short_02_description"),app_store_campaign_url:appStore("focus")},
  {id:"yixiu-youtube-ocean-short-comment-20260824",channel_id:"youtube",type:"community_reply",title:"Ocean Focus Short conversion comment",url:"https://www.youtube.com/watch?v=GHAYLQENv18&lc=Ugx08j1MbkozxNhyHMF4AaABAg",campaign_id:"focus_sounds",landing_url:landing("ocean-waves-for-focus","youtube","organic_comment","ocean_waves_focus","ocean_focus_short_02_comment"),app_store_campaign_url:appStore("focus")},
  {id:"yixiu-pinterest-ocean-focus-video-20260824",channel_id:"pinterest",type:"video_pin",title:"Ocean Waves for Focus — 10 Minutes, No Music",url:"https://www.pinterest.com/pin/1147643917689984773/",campaign_id:"focus_sounds",landing_url:landing("ocean-waves-for-focus","pinterest","organic_pin","ocean_waves_focus","ocean_focus_video_pin_01"),app_store_campaign_url:appStore("focus")},
  {id:"yixiu-instagram-ocean-focus-reel-20260824",channel_id:"instagram",type:"reel",title:"Your Focus Soundtrack Does Not Need Music",url:"https://www.instagram.com/reel/DcbDOZ2Au_T/",campaign_id:"focus_sounds",landing_url:landing("ocean-waves-for-focus","instagram","organic_reel","focus_sounds","ocean_focus_reel_01"),app_store_campaign_url:appStore("focus")},
  {id:"yixiu-instagram-one-minute-reset-reel-20260824",channel_id:"instagram",type:"reel",title:"One Quiet Minute — Water Breathing Reset",url:"https://www.instagram.com/reel/DcbIHxfNSO6/",campaign_id:"one_minute_reset",landing_url:landing("one-minute-reset","instagram","organic_reel","one_minute_reset","water_breathing_reel_01"),app_store_campaign_url:appStore("reset")},
  {id:"yixiu-pinterest-one-minute-reset-video-20260824",channel_id:"pinterest",type:"video_pin",title:"A One-Minute Breathing Reset with Nature Sound",url:"https://www.pinterest.com/pin/1147643917689989468/",campaign_id:"one_minute_reset",landing_url:landing("one-minute-reset","pinterest","organic_pin","one_minute_reset","water_breathing_video_pin_01"),app_store_campaign_url:appStore("reset")},
  {id:"yixiu-youtube-rain-sleep-long-20260824",channel_id:"youtube",type:"long_video",title:"Rain Sounds for Sleep — 15 Minutes, No Talking, No Music",url:"https://www.youtube.com/watch?v=8LJoPKN3CO4",campaign_id:"sleep_sounds",landing_url:landing("sleep-sounds","youtube","organic_video","sleep_sounds","rain_sleep_15min_01_description"),app_store_campaign_url:appStore("sleep")},
].map((record)=>({
  app_id:"yixiu-meditation",
  campaign_id:null,
  landing_url:null,
  app_store_campaign_url:null,
  ...record,
  publish_url:record.url,
  status:"published",
  published_at:publishedAt,
  ...unknownMetrics,
}));

await store.mutate((state)=>{
  const ids = new Set(records.map((record)=>record.id));
  state.content = [...records, ...(state.content??[]).filter((record)=>!ids.has(record.id))];
  const auditId = "audit-yixiu-content-ledger-20260824";
  state.audit = (state.audit??[]).filter((record)=>record.id!==auditId);
  state.audit.unshift({
    id:auditId,
    at:new Date().toISOString(),
    actor:"AI COO OS",
    app_id:"yixiu-meditation",
    source:"verified_yixiu_growth_ops_log",
    action:"sync_verified_2026_08_24_content_permalinks",
    input:{external_writes:false,published_date:publishedAt},
    result:{status:"success",records_inserted:records.length,unknown_metrics_preserved_as_null:true},
    status:"success",
    error:null,
  });
});

console.log(`YIXIU_CONTENT_SYNC_OK date=${publishedAt} records=${records.length}`);
