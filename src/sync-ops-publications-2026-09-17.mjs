import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";

const store = new JsonStore(fileURLToPath(new URL("../data/state.json", import.meta.url)));
const queue = JSON.parse(await readFile(fileURLToPath(new URL("../../ops/dual-brand-scheduler.json", import.meta.url)), "utf8"));
const manifest = JSON.parse(await readFile(fileURLToPath(new URL("../../assets/yixiu-20260917/manifest.json", import.meta.url)), "utf8"));
const operationDate = "2026-09-17";
const ppid = {
  sleep: "67cb8784-2b16-4849-b940-90fdf4d99752",
  focus: "7890afd3-dd12-4215-a5c5-17f4ebc28759",
  reset: "6c015245-76ff-4266-8837-5a0ffc289b9c",
};
const campaign = { sleep:"sleep_sounds", focus:"focus_sounds", reset:"one_minute_reset" };
const landing = {
  sleep:"https://yixiu.wonderelian.com/sleep-sounds/",
  focus:"https://yixiu.wonderelian.com/focus-sounds/",
  reset:"https://yixiu.wonderelian.com/one-minute-reset/",
};
const appStoreBase = "https://apps.apple.com/us/app/yixiu-white-noise-sleep/id1461182261";
const unknownMetrics = {
  impressions:null, engagements:null, outbound_clicks:null, first_time_downloads:null,
  views:null, likes:null, comments:null, shares:null, saves:null,
  landing_page_visits:null, attributed_conversions:null, product_page_views:null,
  trial_starts:null, paid_conversions:null, measurement_status:"collecting",
};
const manifestById = new Map(manifest.map((item) => [item.content_id, item]));
const canonicalUrl = (value) => String(value ?? "").replace(/\/$/, "");

const records = [];
for (const item of queue.days?.[operationDate]?.yixiu ?? []) {
  const source = manifestById.get(item.content_id);
  for (const channelId of ["instagram", "pinterest", "tiktok", "youtube", "xiaohongshu"]) {
    const channel = item[channelId];
    if (channel?.status !== "published_verified" || !channel.url) continue;
    const intent = source?.intent ?? "sleep";
    records.push({
      id:`${item.content_id}-${channelId}`,
      app_id:"yixiu-meditation",
      channel_id:channelId,
      type:channelId === "pinterest" ? "pin" : channelId === "youtube" ? "community_post" : "social_post",
      title:source?.title ?? source?.headline ?? item.content_id,
      url:channel.url,
      publish_url:channel.url,
      status:"published",
      published_at:operationDate,
      campaign_id:campaign[intent],
      landing_url:`${landing[intent]}?utm_source=${channelId}&utm_medium=organic_social&utm_campaign=${campaign[intent]}&utm_content=${item.content_id}`,
      app_store_campaign_url:`${appStoreBase}?ppid=${ppid[intent]}`,
      ...unknownMetrics,
    });
  }
}

const video = queue.days?.[operationDate]?.yixiu_video_policy;
if (video?.platforms?.pinterest?.status === "published_verified" && video.platforms.pinterest.url) {
  records.push({
    id:"20260917_moon-laundry-video-pinterest",
    app_id:"yixiu-meditation",
    channel_id:"pinterest",
    type:"video_pin",
    title:"Do Not Iron the Moon — Yixiu",
    url:video.platforms.pinterest.url,
    publish_url:video.platforms.pinterest.url,
    status:"published",
    published_at:operationDate,
    campaign_id:"sleep_sounds",
    landing_url:`${landing.sleep}?utm_source=pinterest&utm_medium=organic_video&utm_campaign=sleep_sounds&utm_content=20260917_moon-laundry-video`,
    app_store_campaign_url:`${appStoreBase}?ppid=${ppid.sleep}`,
    ...unknownMetrics,
  });
}

await store.mutate((state) => {
  const manifestUrls = new Set();
  for (const item of records) {
    const normalized = canonicalUrl(item.publish_url);
    if (manifestUrls.has(normalized)) throw new Error(`duplicate verified URL: ${item.publish_url}`);
    manifestUrls.add(normalized);
  }
  const ids = new Set(records.map((item) => item.id));
  const existing = (state.content ?? []).filter((item) => !ids.has(item.id));
  const existingUrls = new Set(existing.map((item) => canonicalUrl(item.publish_url ?? item.url)));
  const inserted = records.filter((item) => !existingUrls.has(canonicalUrl(item.publish_url)));
  state.content = [...inserted, ...existing];

  const auditId = "audit-ops-publications-20260917";
  state.audit = (state.audit ?? []).filter((item) => item.id !== auditId);
  state.audit.unshift({
    id:auditId,
    at:new Date().toISOString(),
    actor:"AI COO OS",
    app_id:"yixiu-meditation",
    source:"verified_dual_brand_queue_and_durable_ops_log",
    action:"sync_verified_publication_urls_2026_09_17",
    input:{external_writes:false,operation_date:operationDate},
    result:{
      status:"success",
      records_inserted:inserted.length,
      verified_permanent_urls:records.length,
      scheduled_only_and_blocked_items_excluded:true,
      unknown_metrics_preserved_as_null:true,
    },
    status:"success",
    error:null,
  });
});

console.log(`OPS_PUBLICATIONS_20260917_SYNC_OK verified=${records.length}`);
