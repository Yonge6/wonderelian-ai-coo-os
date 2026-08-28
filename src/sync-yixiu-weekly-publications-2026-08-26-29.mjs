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
const landing = (path, source, medium, campaign, content) =>
  `https://yixiu.wonderelian.com/${path ? `${path}/` : ""}?utm_source=${source}&utm_medium=${medium}&utm_campaign=${campaign}&utm_content=${content}`;
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
const record = ({date, intent="focus", ...item}) => ({
  app_id:"yixiu-meditation",
  ...item,
  publish_url:item.url,
  status:"published",
  published_at:date,
  app_store_campaign_url:item.app_store_campaign_url ?? appStore(intent),
  ...unknownMetrics,
});

const records = [
  record({date:"2026-08-26",id:"yixiu-pinterest-waterfall-static-20260826",channel_id:"pinterest",type:"pin",title:"Waterfall Sounds for Noise Masking & Focus",url:"https://www.pinterest.com/pin/1147643917690157924/",campaign_id:"focus_sounds",landing_url:landing("waterfall-sounds-for-noise-masking","pinterest","organic_pin","focus_sounds","waterfall_noise_masking_pin_01")}),

  record({date:"2026-08-27",intent:"sleep",id:"yixiu-pinterest-mountain-wind-static-20260827",channel_id:"pinterest",type:"pin",title:"Mountain Wind Sounds for Sleeping",url:"https://www.pinterest.com/pin/1147643917690163192/",campaign_id:"sleep_sounds",landing_url:landing("wind-sounds-for-sleeping","pinterest","organic_pin","sleep_sounds","mountain_wind_sleep_pin_11")}),
  record({date:"2026-08-27",intent:"sleep",id:"yixiu-product-hunt-launch-20260827",channel_id:"product-hunt",type:"launch",title:"Yixiu — Nature Sounds for Sleep, Focus & Pause",url:"https://www.producthunt.com/products/yixiu?launch=yixiu",campaign_id:"product_hunt_launch",landing_url:"https://yixiu.wonderelian.com/",app_store_campaign_url:appStore("sleep")}),
  record({date:"2026-08-27",intent:"reset",id:"yixiu-product-hunt-reset-discussion-20260827",channel_id:"product-hunt",type:"community_thread",title:"When You Need to Reset, What Do You Reach for First?",url:"https://www.producthunt.com/p/yixiu/when-you-need-to-reset-what-do-you-reach-for-first",campaign_id:"one_minute_reset",landing_url:"https://yixiu.wonderelian.com/one-minute-reset/"}),
  record({date:"2026-08-27",intent:"sleep",id:"yixiu-instagram-mountain-wind-reel-20260827",channel_id:"instagram",type:"reel",title:"Mountain Wind Sounds for Sleeping",url:"https://www.instagram.com/wonderelian/reel/DciPH83p_KW/",campaign_id:"sleep_sounds",landing_url:landing("wind-sounds-for-sleeping","instagram","organic_reel","sleep_sounds","mountain_wind_sleep_reel_04")}),

  record({date:"2026-08-28",intent:"sleep",id:"yixiu-owned-underwater-white-noise-20260828",channel_id:"owned-search",type:"search_landing",title:"Underwater White Noise for Sleep",url:"https://yixiu.wonderelian.com/underwater-white-noise-for-sleep/",campaign_id:"sleep_sounds",landing_url:"https://yixiu.wonderelian.com/underwater-white-noise-for-sleep/"}),
  record({date:"2026-08-28",intent:"sleep",id:"yixiu-pinterest-underwater-white-noise-static-20260828",channel_id:"pinterest",type:"pin",title:"Deep White Noise for Sleeping — Underwater, No Music",url:"https://www.pinterest.com/pin/1147643917690288082/",campaign_id:"scene_share",landing_url:landing("underwater-white-noise-for-sleep","pinterest","organic_share","scene_share","underwater_white_noise_pinterest")}),
  record({date:"2026-08-28",intent:"sleep",id:"yixiu-pinterest-sleep-landing-static-20260828",channel_id:"pinterest",type:"pin",title:"Real Nature Sounds for Sleep — Free Timer",url:"https://www.pinterest.com/pin/1147643917690288380/",campaign_id:"scene_share",landing_url:landing("sleep-sounds","pinterest","organic_share","scene_share","sleep_landing_pinterest")}),
  record({date:"2026-08-28",intent:"sleep",id:"yixiu-pinterest-rain-window-video-20260828",channel_id:"pinterest",type:"video_pin",title:"Rain on a Window for Sleep — No Music, No Talking",url:"https://www.pinterest.com/pin/1147643917690289056/",campaign_id:"sleep_sounds",landing_url:landing("sleep-sounds","pinterest","organic_video","sleep_sounds","rain_window_sleep_video_pin_07")}),
  record({date:"2026-08-28",intent:"sleep",id:"yixiu-instagram-rain-window-reel-20260828",channel_id:"instagram",type:"reel",title:"Rain on a Window for Sleep",url:"https://www.instagram.com/wonderelian/reel/DckkNoIwNmo/",campaign_id:"sleep_sounds",landing_url:landing("sleep-sounds","instagram","organic_reel","sleep_sounds","rain_window_sleep_reel_04")}),
  record({date:"2026-08-28",intent:"sleep",id:"yixiu-owned-forest-sounds-sleep-20260828",channel_id:"owned-search",type:"search_landing",title:"Forest Sounds for Sleep",url:"https://yixiu.wonderelian.com/forest-sounds-for-sleep/",campaign_id:"sleep_sounds",landing_url:"https://yixiu.wonderelian.com/forest-sounds-for-sleep/"}),
  record({date:"2026-08-28",intent:"sleep",id:"yixiu-pinterest-forest-sleep-static-20260828",channel_id:"pinterest",type:"pin",title:"Forest Sounds for Sleep — Real Wind, No Music",url:"https://www.pinterest.com/pin/1147643917690293921/",campaign_id:"sleep_sounds",landing_url:landing("forest-sounds-for-sleep","pinterest","organic_share","sleep_sounds","forest_sleep_pin_01")}),
  record({date:"2026-08-28",id:"yixiu-pinterest-morning-birds-video-20260828",channel_id:"pinterest",type:"video_pin",title:"Morning Bird Sounds for Studying — Free Focus Timer",url:"https://www.pinterest.com/pin/1147643917690292595/",campaign_id:"focus_sounds",landing_url:landing("morning-bird-sounds-for-focus","pinterest","organic_video","focus_sounds","morning_birds_focus_video_pin_01")}),
  record({date:"2026-08-28",intent:"sleep",id:"yixiu-owned-rain-lock-screen-20260828",channel_id:"owned-search",type:"search_landing",title:"Rain Sounds When iPhone Locks",url:"https://yixiu.wonderelian.com/rain-sounds-when-iphone-locked/",campaign_id:"iphone_background_audio",landing_url:"https://yixiu.wonderelian.com/rain-sounds-when-iphone-locked/"}),
  record({date:"2026-08-28",intent:"sleep",id:"yixiu-instagram-rain-lock-post-20260828",channel_id:"instagram",type:"post",title:"Rain Stops When Your iPhone Locks?",url:"https://www.instagram.com/wonderelian/p/Dck48aLm8-_/",campaign_id:"iphone_background_audio",landing_url:"https://yixiu.wonderelian.com/rain-sounds-when-iphone-locked/"}),
  record({date:"2026-08-28",intent:"sleep",id:"yixiu-pinterest-rain-lock-static-20260828",channel_id:"pinterest",type:"pin",title:"Rain Stops When Your iPhone Locks? Check This Setting",url:"https://www.pinterest.com/pin/1147643917690295071/",campaign_id:"iphone_background_audio",landing_url:landing("rain-sounds-when-iphone-locked","pinterest","organic_share","iphone_background_audio","rain_lock_screen_pin_01")}),
  record({date:"2026-08-28",id:"yixiu-instagram-rain-reading-reel-20260828",channel_id:"instagram",type:"reel",title:"Rain Sounds for Reading — No Music, No Talking",url:"https://www.instagram.com/wonderelian/reel/DclmagSBBNS/",campaign_id:"reading_sounds",landing_url:landing("rain-sounds-for-reading","instagram","organic_reel","reading_sounds","rain_reading_reel_05")}),
  record({date:"2026-08-28",id:"yixiu-instagram-ocean-focus-reel-20260828",channel_id:"instagram",type:"reel",title:"Ocean Waves for Focus — No Music, No Talking",url:"https://www.instagram.com/wonderelian/reel/DclqWNIs6Az/",campaign_id:"focus_sounds",landing_url:landing("ocean-waves-for-focus","instagram","organic_reel","focus_sounds","ocean_waves_focus_reel_06")}),
  record({date:"2026-08-28",id:"yixiu-owned-rain-studying-20260828",channel_id:"owned-search",type:"search_landing",title:"Rain Sounds for Studying",url:"https://yixiu.wonderelian.com/rain-sounds-for-studying/",campaign_id:"focus_sounds",landing_url:"https://yixiu.wonderelian.com/rain-sounds-for-studying/"}),
  record({date:"2026-08-28",id:"yixiu-owned-white-noise-studying-20260828",channel_id:"owned-search",type:"search_landing",title:"White Noise for Studying",url:"https://yixiu.wonderelian.com/white-noise-for-studying/",campaign_id:"focus_sounds",landing_url:"https://yixiu.wonderelian.com/white-noise-for-studying/"}),
  record({date:"2026-08-28",id:"yixiu-pinterest-white-noise-studying-20260828",channel_id:"pinterest",type:"pin",title:"White Noise for Studying — Free 15/30/60 Min Timer",url:"https://www.pinterest.com/pin/1147643917690291596/",campaign_id:"focus_sounds",landing_url:landing("white-noise-for-studying","pinterest","organic_share","focus_sounds","white_noise_studying_pin_01")}),
  record({date:"2026-08-28",id:"yixiu-instagram-white-noise-studying-20260828",channel_id:"instagram",type:"post",title:"White Noise for Studying — Free Timer",url:"https://www.instagram.com/p/DcktCGqmRYG/",campaign_id:"focus_sounds",landing_url:landing("white-noise-for-studying","instagram","organic_post","focus_sounds","white_noise_studying_post_01")}),

  record({date:"2026-08-29",intent:"sleep",id:"yixiu-instagram-forest-sleep-reel-20260829",channel_id:"instagram",type:"reel",title:"Forest Sounds for Sleep — Real Wind, No Music",url:"https://www.instagram.com/wonderelian/reel/Dcl7RV9smTZ/",campaign_id:"sleep_sounds",landing_url:landing("forest-sounds-for-sleep","instagram","organic_reel","sleep_sounds","forest_sleep_reel_05")}),
  record({date:"2026-08-29",intent:"sleep",id:"yixiu-pinterest-forest-sleep-video-20260829",channel_id:"pinterest",type:"video_pin",title:"Forest Sounds for Sleep — Real Wind, No Music",url:"https://www.pinterest.com/pin/1147643917690332592/",campaign_id:"sleep_sounds",landing_url:landing("forest-sounds-for-sleep","pinterest","organic_video_pin","sleep_sounds","forest_sleep_video_pin_02")}),
  record({date:"2026-08-29",intent:"sleep",id:"yixiu-github-readme-attribution-20260829",channel_id:"github",type:"repository_update",title:"Yixiu Dark-Screen Sleep Attribution Path",url:"https://github.com/Yonge6/yixiu-meditation",campaign_id:"sleep_sounds",landing_url:landing("sleep-sounds","github","organic_referral","sleep_sounds","repository_readme_dark_screen"),app_store_campaign_url:appStore("sleep","yixiu_github_20260829")}),
  record({date:"2026-08-29",intent:"sleep",id:"yixiu-owned-guides-dark-screen-20260829",channel_id:"owned-search",type:"guide_hub_update",title:"Rain Sounds with a Dark Screen",url:"https://yixiu.wonderelian.com/guides/",campaign_id:"sleep_sounds",landing_url:"https://yixiu.wonderelian.com/sleep-sounds/"}),
  record({date:"2026-08-29",intent:"reset",id:"yixiu-owned-nature-sounds-meditation-20260829",channel_id:"owned-search",type:"search_landing",title:"Nature Sounds for Meditation",url:"https://yixiu.wonderelian.com/nature-sounds-for-meditation/",campaign_id:"one_minute_reset",landing_url:"https://yixiu.wonderelian.com/nature-sounds-for-meditation/"}),
  record({date:"2026-08-29",intent:"sleep",id:"yixiu-product-hunt-dark-screen-thread-20260829",channel_id:"product-hunt",type:"community_thread",title:"I Added a Dark-Screen Timer for Rain Sounds",url:"https://www.producthunt.com/p/yixiu/i-added-a-dark-screen-timer-for-rain-sounds-what-should-happen-when-it-ends",campaign_id:"sleep_sounds",landing_url:landing("sleep-sounds","producthunt","community_thread","sleep_sounds","dark_screen_timer_thread_01")}),
  record({date:"2026-08-29",intent:"sleep",id:"yixiu-instagram-rain-dark-screen-reel-20260829",channel_id:"instagram",type:"reel",title:"Rain Sounds for Sleeping with a Dark Screen",url:"https://www.instagram.com/wonderelian/reel/DcmRREOzabO/",campaign_id:"sleep_sounds",landing_url:"https://yixiu.wonderelian.com/sleep-sounds/"}),
  record({date:"2026-08-29",intent:"sleep",id:"yixiu-pinterest-rain-dark-screen-video-20260829",channel_id:"pinterest",type:"video_pin",title:"Rain Sounds for Sleeping with a Dark Screen — No Ads",url:"https://www.pinterest.com/pin/1147643917690341502/",campaign_id:"sleep_sounds",landing_url:landing("sleep-sounds","pinterest","organic_video","sleep_sounds","rain_dark_screen_video_pin_01")}),
  record({date:"2026-08-29",id:"yixiu-owned-study-sounds-comparison-20260829",channel_id:"owned-search",type:"guide_update",title:"Best Nature Sounds for Studying: River, Rain or Ocean?",url:"https://yixiu.wonderelian.com/best-nature-sounds-for-studying/",campaign_id:"focus_sounds",landing_url:"https://yixiu.wonderelian.com/best-nature-sounds-for-studying/"}),
  record({date:"2026-08-29",id:"yixiu-pinterest-study-sounds-comparison-20260829",channel_id:"pinterest",type:"infographic_pin",title:"Best Nature Sounds for Studying: River, Rain or Ocean?",url:"https://www.pinterest.com/pin/1147643917690337900/",campaign_id:"focus_sounds",landing_url:landing("best-nature-sounds-for-studying","pinterest","organic_infographic","focus_sounds","study_sounds_comparison_pin_01")}),
  record({date:"2026-08-29",intent:"sleep",id:"yixiu-pinterest-underwater-white-noise-video-20260829",channel_id:"pinterest",type:"video_pin",title:"Underwater White Noise for Sleep — 20 Seconds, No Talking",url:"https://www.pinterest.com/pin/1147643917690336755/",campaign_id:"sleep_sounds",landing_url:landing("underwater-white-noise-for-sleep","pinterest","organic_video","sleep_sounds","underwater_white_noise_sleep_video_pin_02")}),
  record({date:"2026-08-29",intent:"sleep",id:"yixiu-pinterest-waterfall-sleep-video-20260829",channel_id:"pinterest",type:"video_pin",title:"Waterfall Sounds for Sleep & Noise Masking — No Music",url:"https://www.pinterest.com/pin/1147643917690334213/",campaign_id:"sleep_sounds",landing_url:landing("waterfall-sounds-for-noise-masking","pinterest","organic_video_pin","sleep_sounds","waterfall_sleep_masking_video_pin_02")}),
  record({date:"2026-08-29",intent:"sleep",id:"yixiu-pinterest-mountain-wind-share-20260829",channel_id:"pinterest",type:"pin",title:"Mountain Wind Sounds for Sleep — No Music",url:"https://www.pinterest.com/pin/1147643917690327522/",campaign_id:"scene_share",landing_url:landing("wind-sounds-for-sleeping","pinterest","organic_share","scene_share","wind_sleep_pinterest")}),
  record({date:"2026-08-29",id:"yixiu-owned-llms-ai-discovery-20260829",channel_id:"owned-search",type:"ai_discovery",title:"Yixiu AI Discovery Guide",url:"https://yixiu.wonderelian.com/llms.txt",campaign_id:"product_discovery",landing_url:"https://yixiu.wonderelian.com/"}),
  record({date:"2026-08-29",id:"yixiu-youtube-focus-community-20260829",channel_id:"youtube",type:"community_post",title:"A Quieter Focus Session with Nature Sounds",url:"https://www.youtube.com/post/Ugkxl__uW_40cWZFcMZqpMEaRaFj5aYKFZL8",campaign_id:"focus_sounds",landing_url:landing("focus-sounds","youtube","organic_social","focus_sounds","community_focus_playlist_01")}),
  record({date:"2026-08-29",intent:"sleep",id:"yixiu-youtube-rain-community-20260829",channel_id:"youtube",type:"community_post",title:"Rain Sounds with a Dark Screen",url:"https://www.youtube.com/post/UgkxiMpDLzSbALhvr44BeY1SiO70MhIjs_IR",campaign_id:"sleep_sounds",landing_url:landing("sleep-sounds","youtube","organic_social","sleep_sounds","community_rain_dark_screen_02"),app_store_campaign_url:appStore("sleep","yixiu_youtube_community_20260829")}),
  record({date:"2026-08-29",intent:"sleep",id:"yixiu-youtube-sleep-playlist-20260829",channel_id:"youtube",type:"playlist",title:"Yixiu Nature Sounds for Sleep",url:"https://www.youtube.com/playlist?list=PLTKVdsllNT_o",campaign_id:"sleep_sounds",landing_url:landing("sleep-sounds","youtube","organic_playlist","sleep_sounds","yixiu_sleep_playlist_01")}),
  record({date:"2026-08-29",id:"yixiu-youtube-focus-playlist-20260829",channel_id:"youtube",type:"playlist",title:"Yixiu Nature Sounds for Focus",url:"https://www.youtube.com/playlist?list=PLWaumipIoeCM",campaign_id:"focus_sounds",landing_url:landing("focus-sounds","youtube","organic_playlist","focus_sounds","yixiu_focus_playlist_01")}),
  record({date:"2026-08-29",intent:"sleep",id:"yixiu-youtube-rain-gentle-timer-comment-20260829",channel_id:"youtube",type:"community_reply",title:"Rain Gentle-Timer Short Conversion Comment",url:"https://www.youtube.com/watch?v=w6ofxBlm1MU&lc=Ugw5_G0ENHLBVXBNI1t4AaABAg",campaign_id:"sleep_sounds",landing_url:landing("rain-sounds-when-iphone-locked","youtube","organic_comment","sleep_sounds","rain_window_gentle_timer_short_comment_01")}),
  record({date:"2026-08-29",intent:"sleep",id:"yixiu-youtube-mountain-wind-comment-20260829",channel_id:"youtube",type:"community_reply",title:"Mountain Wind Short Conversion Comment",url:"https://www.youtube.com/watch?v=iMG8YanRAnA&lc=UgwkMb1EOqwVwqA1zhh4AaABAg",campaign_id:"sleep_sounds",landing_url:landing("wind-sounds-for-sleeping","youtube","organic_comment","sleep_sounds","mountain_wind_short_comment_01")}),
  record({date:"2026-08-29",id:"yixiu-instagram-morning-birds-reel-verified-20260829",channel_id:"instagram",type:"reel_update",title:"Morning Birds Focus Reel Link Path",url:"https://www.instagram.com/wonderelian/reel/Dch8MEetcmW/",campaign_id:"focus_sounds",landing_url:landing("morning-bird-sounds-for-focus","instagram","organic_reel","focus_sounds","morning_birds_focus_reel_03")}),
  record({date:"2026-08-29",id:"yixiu-instagram-mountain-stream-reel-verified-20260829",channel_id:"instagram",type:"reel_update",title:"Mountain Stream Focus Reel Link Path",url:"https://www.instagram.com/wonderelian/reel/Dch6vZTRQR5/",campaign_id:"focus_sounds",landing_url:landing("mountain-stream-sounds-for-focus","instagram","organic_reel","focus_sounds","mountain_stream_focus_reel_02")}),
  record({date:"2026-08-29",intent:"sleep",id:"yixiu-instagram-thunder-reel-verified-20260829",channel_id:"instagram",type:"reel_update",title:"Thunderstorm Sleep Reel Link Path",url:"https://www.instagram.com/wonderelian/reel/Dcgo1SNO-QF/",campaign_id:"sleep_sounds",landing_url:landing("thunderstorm-sounds-for-sleep","instagram","organic_reel","sleep_sounds","distant_thunder_reel_01")}),
];

const canonicalUrl = (value) => String(value).replace(/^https:\/\/youtube\.com/, "https://www.youtube.com").replace(/\/$/, "");

await store.mutate((state) => {
  const channelDefinitions = [
    {id:"owned-search",name:"Owned Search",status:"active"},
    {id:"github",name:"GitHub",status:"active"},
  ];
  const channelIds = new Set((state.channels ?? []).map((item) => item.id));
  state.channels = [...(state.channels ?? []), ...channelDefinitions.filter((item) => !channelIds.has(item.id))];

  const manifestUrls = new Set();
  const duplicateManifestUrls = [];
  for (const item of records) {
    const normalized = canonicalUrl(item.publish_url);
    if (manifestUrls.has(normalized)) duplicateManifestUrls.push(item.publish_url);
    manifestUrls.add(normalized);
  }
  if (duplicateManifestUrls.length) throw new Error(`duplicate manifest URLs: ${duplicateManifestUrls.join(", ")}`);

  const ids = new Set(records.map((item) => item.id));
  const existing = (state.content ?? []).filter((item) => !ids.has(item.id));
  const existingUrls = new Set(existing.map((item) => canonicalUrl(item.publish_url ?? item.url)));
  const inserted = records.filter((item) => !existingUrls.has(canonicalUrl(item.publish_url)));
  const skippedExisting = records.filter((item) => existingUrls.has(canonicalUrl(item.publish_url)));
  state.content = [...inserted, ...existing];

  const auditId = "audit-yixiu-weekly-publications-20260829";
  state.audit = (state.audit ?? []).filter((item) => item.id !== auditId);
  state.audit.unshift({
    id:auditId,
    at:new Date().toISOString(),
    actor:"AI COO OS",
    app_id:"yixiu-meditation",
    source:"verified_yixiu_growth_repository_release_records",
    action:"sync_verified_yixiu_weekly_publications_2026_08_26_29",
    input:{external_writes:false,date_from:"2026-08-26",date_to:"2026-08-29"},
    result:{
      status:"success",
      records_inserted:inserted.length,
      records_skipped_existing:skippedExisting.length,
      permanent_urls_required:true,
      unverified_tiktok_excluded:true,
      unknown_metrics_preserved_as_null:true,
    },
    status:"success",
    error:null,
  });
});

console.log(`YIXIU_WEEKLY_PUBLICATIONS_SYNC_OK manifest=${records.length}`);
