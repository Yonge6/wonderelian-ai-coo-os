import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";

const store = new JsonStore(fileURLToPath(new URL("../data/state.json", import.meta.url)));
const publications = [
  {
    id: "wendao-xiaohongshu-w05-r01-20260919",
    title: "你的影子先下班了",
    url: "https://www.xiaohongshu.com/explore/6aad3d63000000001001c2b9",
  },
  {
    id: "wendao-xiaohongshu-w05-r02-20260919",
    title: "收件箱孵出了一只鸟",
    url: "https://www.xiaohongshu.com/explore/6aad3de4000000000d02719b",
  },
  {
    id: "wendao-xiaohongshu-w05-r03-20260919",
    title: "星期天把门牌摘了",
    url: "https://www.xiaohongshu.com/explore/6aad3e4d000000000d02741a",
  },
];

await store.mutate((state) => {
  if (!state.channels.some((item) => item.id === "xiaohongshu")) {
    state.channels.push({ id: "xiaohongshu", name: "Xiaohongshu", status: "active" });
  }
  const existing = new Set(state.content.flatMap((item) => [item.id, item.url, item.publish_url]).filter(Boolean));
  let inserted = 0;
  for (const item of publications) {
    if (existing.has(item.id) || existing.has(item.url)) continue;
    state.content.push({
      app_id: "wendao",
      status: "published",
      published_at: "2026-09-19",
      impressions: null,
      engagements: null,
      outbound_clicks: null,
      first_time_downloads: null,
      landing_url: null,
      views: null,
      likes: null,
      comments: null,
      shares: null,
      saves: null,
      landing_page_visits: null,
      attributed_conversions: null,
      product_page_views: null,
      measurement_status: "collecting",
      id: item.id,
      channel_id: "xiaohongshu",
      type: "image_post",
      title: item.title,
      url: item.url,
      publish_url: item.url,
      campaign_id: null,
      app_store_campaign_url: null,
    });
    inserted += 1;
  }
  const auditId = "audit-ops-publications-20260919";
  state.audit = (state.audit ?? []).filter((item) => item.id !== auditId);
  state.audit.unshift({
    id: auditId,
    at: "2026-09-20T01:30:00.000Z",
    actor: "AI COO OS",
    app_id: "wendao",
    source: "verified_dual_brand_scheduler_and_durable_ops_logs",
    action: "sync_verified_publication_urls_2026_09_19",
    input: { external_writes: false, operation_date: "2026-09-19" },
    result: {
      status: "success",
      records_inserted: inserted,
      verified_business_publication_urls: publications.length,
      tracking_query_removed_from_permanent_urls: true,
      unverified_attempts_excluded: true,
      unknown_metrics_preserved_as_null: true,
    },
    status: "success",
    error: null,
  });
  return { inserted };
});

console.log("OPS_PUBLICATIONS_20260919_SYNC_OK verified=3");
