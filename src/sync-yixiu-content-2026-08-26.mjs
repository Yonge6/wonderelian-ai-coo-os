import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";

const store = new JsonStore(fileURLToPath(new URL("../data/state.json", import.meta.url)));
const publishedAt = "2026-08-26";
const record = {
  id:"yixiu-youtube-mountain-wind-sleep-short-20260826",
  app_id:"yixiu-meditation",
  channel_id:"youtube",
  type:"short",
  title:"Wind Sounds for Sleeping — Mountain Air, No Music",
  url:"https://www.youtube.com/shorts/iMG8YanRAnA",
  publish_url:"https://www.youtube.com/shorts/iMG8YanRAnA",
  campaign_id:"sleep_sounds",
  landing_url:"https://yixiu.wonderelian.com/wind-sounds-for-sleeping/?utm_source=youtube&utm_medium=organic_video&utm_campaign=sleep_sounds&utm_content=mountain_wind_sleep_short_10_description",
  app_store_campaign_url:"https://apps.apple.com/us/app/yixiu-white-noise-sleep/id1461182261?ppid=67cb8784-2b16-4849-b940-90fdf4d99752",
  status:"published",
  published_at:publishedAt,
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

await store.mutate((state)=>{
  state.content = [record, ...(state.content??[]).filter((item)=>item.id!==record.id)];
  const auditId = "audit-yixiu-content-ledger-20260826";
  state.audit = (state.audit??[]).filter((item)=>item.id!==auditId);
  state.audit.unshift({
    id:auditId,
    at:new Date().toISOString(),
    actor:"AI COO OS",
    app_id:"yixiu-meditation",
    source:"verified_yixiu_growth_ops_log",
    action:"sync_verified_2026_08_26_content_permalinks",
    input:{external_writes:false,published_date:publishedAt},
    result:{status:"success",records_inserted:1,unknown_metrics_preserved_as_null:true,unverified_comment_excluded:true},
    status:"success",
    error:null,
  });
});

console.log(`YIXIU_CONTENT_SYNC_OK date=${publishedAt} records=1`);
