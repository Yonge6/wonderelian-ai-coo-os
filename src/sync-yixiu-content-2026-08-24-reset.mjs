import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";

const store = new JsonStore(fileURLToPath(new URL("../data/state.json", import.meta.url)));

const records = [{
  id:"yixiu-instagram-one-minute-reset-reel-20260824",
  app_id:"yixiu-meditation",
  channel_id:"instagram",
  type:"reel",
  title:"One Quiet Minute — Water Breathing Reset",
  url:"https://www.instagram.com/reel/DcbIHxfNSO6/",
  publish_url:"https://www.instagram.com/reel/DcbIHxfNSO6/",
  status:"published",
  published_at:"2026-08-24",
  campaign_id:"one_minute_reset",
  landing_url:"https://yixiu.wonderelian.com/one-minute-reset/?utm_source=instagram&utm_medium=organic_reel&utm_campaign=one_minute_reset&utm_content=water_breathing_reel_01",
  app_store_campaign_url:"https://apps.apple.com/us/app/yixiu-white-noise-sleep/id1461182261?ppid=6c015245-76ff-4266-8837-5a0ffc289b9c",
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
}, {
  id:"yixiu-pinterest-one-minute-reset-video-20260824",
  app_id:"yixiu-meditation",
  channel_id:"pinterest",
  type:"video_pin",
  title:"A One-Minute Breathing Reset with Nature Sound",
  url:"https://www.pinterest.com/pin/1147643917689989468/",
  publish_url:"https://www.pinterest.com/pin/1147643917689989468/",
  status:"published",
  published_at:"2026-08-24",
  campaign_id:"one_minute_reset",
  landing_url:"https://yixiu.wonderelian.com/one-minute-reset/?utm_source=pinterest&utm_medium=organic_pin&utm_campaign=one_minute_reset&utm_content=water_breathing_video_pin_01",
  app_store_campaign_url:"https://apps.apple.com/us/app/yixiu-white-noise-sleep/id1461182261?ppid=6c015245-76ff-4266-8837-5a0ffc289b9c",
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
}];

await store.mutate((state)=>{
  const recordIds = new Set(records.map((record)=>record.id));
  state.content = [...records, ...(state.content??[]).filter((item)=>!recordIds.has(item.id))];

  const auditId = "audit-yixiu-one-minute-reset-video-distribution-20260824";
  const supersededAuditIds = new Set([
    auditId,
    "audit-yixiu-instagram-one-minute-reset-reel-20260824",
  ]);
  state.audit = (state.audit??[]).filter((item)=>!supersededAuditIds.has(item.id));
  state.audit.unshift({
    id:auditId,
    at:new Date().toISOString(),
    actor:"AI COO OS",
    app_id:"yixiu-meditation",
    source:"verified_public_instagram_pinterest_and_alibaba_readback",
    action:"record_one_minute_reset_video_distribution",
    input:{external_writes:false, published_date:records[0].published_at},
    result:{
      status:"success",
      records_inserted:records.length,
      public_urls:records.map((record)=>record.url),
      landing_urls:records.map((record)=>record.landing_url),
      unknown_metrics_preserved_as_null:true,
    },
    status:"success",
    error:null,
  });
});

console.log(`YIXIU_RESET_VIDEO_DISTRIBUTION_SYNC_OK records=${records.length}`);
