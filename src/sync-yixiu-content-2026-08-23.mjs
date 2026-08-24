import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";

const store = new JsonStore(fileURLToPath(new URL("../data/state.json", import.meta.url)));
const publishedAt = "2026-08-23";
const appStoreUrl = "https://apps.apple.com/app/id1461182261";

const metrics = {
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

const records = [
  {
    id:"yixiu-instagram-rain-focus-20260823",
    channel_id:"instagram",
    type:"carousel",
    title:"Rain on Eaves for Focused Work",
    url:"https://www.instagram.com/wonderelian/p/DcYhgdnm3_f/",
    app_store_campaign_url:appStoreUrl,
  },
  {
    id:"yixiu-pinterest-rain-focus-20260823",
    channel_id:"pinterest",
    type:"pin",
    title:"Rain on Eaves for Focused Work",
    url:"https://www.pinterest.com/pin/1147643917689905371/",
    app_store_campaign_url:appStoreUrl,
  },
  {
    id:"yixiu-pinterest-focus-timer-20260823",
    channel_id:"pinterest",
    type:"pin",
    title:"Choose a Focus Timer: 15, 30, 60 or Unlimited",
    url:"https://www.pinterest.com/pin/1147643917689905429/",
    app_store_campaign_url:appStoreUrl,
  },
  {
    id:"yixiu-pinterest-background-playback-20260823",
    channel_id:"pinterest",
    type:"pin",
    title:"Keep Nature Sounds Playing While You Work",
    url:"https://www.pinterest.com/pin/1147643917689905455/",
    app_store_campaign_url:appStoreUrl,
  },
  {
    id:"yixiu-instagram-reply-rain-silence-20260823",
    channel_id:"instagram",
    type:"community_reply",
    title:"Restrained rain and silence discussion",
    url:"https://www.instagram.com/p/DcQhhj3Pn2s/c/17930524623382348/",
    app_store_campaign_url:null,
  },
  {
    id:"yixiu-instagram-reply-tactile-sound-20260823",
    channel_id:"instagram",
    type:"community_reply",
    title:"Tactile sound and focus-prompt discussion",
    url:"https://www.instagram.com/p/DcWqDnlJ9y2/c/17899496802561122/",
    app_store_campaign_url:null,
  },
  {
    id:"yixiu-instagram-reply-reading-routine-20260823",
    channel_id:"instagram",
    type:"community_reply",
    title:"Reading routine and ambient-sound discussion",
    url:"https://www.instagram.com/p/DcXFiCGksaO/c/18093628889530594/",
    app_store_campaign_url:null,
  },
].map((record)=>({
  ...record,
  app_id:"yixiu-meditation",
  publish_url:record.url,
  status:"published",
  published_at:publishedAt,
  campaign_id:null,
  landing_url:null,
  ...metrics,
}));

await store.mutate((state)=>{
  const ids = new Set(records.map((record)=>record.id));
  state.content = [...records, ...(state.content??[]).filter((record)=>!ids.has(record.id))];

  const auditId = "audit-yixiu-content-ledger-20260823";
  state.audit = (state.audit??[]).filter((record)=>record.id!==auditId);
  state.audit.unshift({
    id:auditId,
    at:new Date().toISOString(),
    actor:"AI COO OS",
    app_id:"yixiu-meditation",
    source:"verified_yixiu_growth_ops_log",
    action:"sync_verified_2026_08_23_content_permalinks",
    input:{external_writes:false, published_date:publishedAt},
    result:{status:"success", records_inserted:records.length, unknown_metrics_preserved_as_null:true},
    status:"success",
    error:null,
  });
});

console.log(`YIXIU_CONTENT_SYNC_OK date=${publishedAt} records=${records.length}`);
