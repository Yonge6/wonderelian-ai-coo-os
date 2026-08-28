import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";

const store = new JsonStore(fileURLToPath(new URL("../data/state.json", import.meta.url)));
const publishedAt = "2026-08-28";
const focusProductPage = "https://apps.apple.com/us/app/yixiu-white-noise-sleep/id1461182261?ppid=7890afd3-dd12-4215-a5c5-17f4ebc28759";
const records = [
  {
    id:"yixiu-instagram-plus-focus-carousel-20260828",
    app_id:"yixiu-meditation",
    channel_id:"instagram",
    type:"carousel",
    title:"Longer Focus Sessions with Yixiu Plus",
    url:"https://www.instagram.com/wonderelian/p/DclicEam6q-/",
    publish_url:"https://www.instagram.com/wonderelian/p/DclicEam6q-/",
    campaign_id:"focus_sounds",
    landing_url:"https://yixiu.wonderelian.com/focus-sounds/?utm_source=instagram&utm_medium=organic_social&utm_campaign=focus_sounds&utm_content=plus_focus_trial_carousel_01",
    app_store_campaign_url:focusProductPage,
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
  },
  {
    id:"yixiu-pinterest-plus-focus-pin-20260828",
    app_id:"yixiu-meditation",
    channel_id:"pinterest",
    type:"pin",
    title:"Longer Focus Sessions with Yixiu Plus",
    url:"https://www.pinterest.com/pin/1147643917690317384/",
    publish_url:"https://www.pinterest.com/pin/1147643917690317384/",
    campaign_id:"focus_sounds",
    landing_url:"https://yixiu.wonderelian.com/focus-sounds/?utm_source=pinterest&utm_medium=organic_pin&utm_campaign=focus_sounds&utm_content=plus_focus_trial_pin_01",
    app_store_campaign_url:focusProductPage,
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
  },
];

await store.mutate((state)=>{
  const ids = new Set(records.map((record)=>record.id));
  state.content = [...records, ...(state.content??[]).filter((item)=>!ids.has(item.id))];
  const auditId = "audit-yixiu-content-ledger-20260828";
  state.audit = (state.audit??[]).filter((item)=>item.id!==auditId);
  state.audit.unshift({
    id:auditId,
    at:new Date().toISOString(),
    actor:"AI COO OS",
    app_id:"yixiu-meditation",
    source:"verified_yixiu_growth_ops_log",
    action:"sync_verified_2026_08_28_content_permalinks",
    input:{external_writes:false,published_date:publishedAt},
    result:{status:"success",records_inserted:records.length,unknown_metrics_preserved_as_null:true},
    status:"success",
    error:null,
  });
});

console.log(`YIXIU_CONTENT_SYNC_OK date=${publishedAt} records=${records.length}`);
