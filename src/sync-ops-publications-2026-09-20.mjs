import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";

const store = new JsonStore(fileURLToPath(new URL("../data/state.json", import.meta.url)));
const publications = [
  { id: "wendao-xiaohongshu-w06-r01-20260920", channel_id: "xiaohongshu", title: "时钟今天请病假", url: "https://www.xiaohongshu.com/explore/6aae8d780000000011035349" },
  { id: "wendao-instagram-w06-r01-20260920", channel_id: "instagram", title: "The Clock Called In Sick", url: "https://www.instagram.com/wonderelian/p/Ddej7Q2lfV1/" },
  { id: "wendao-xiaohongshu-w06-r02-20260920", channel_id: "xiaohongshu", title: "待办清单长出了腿", url: "https://www.xiaohongshu.com/explore/6aae8dbe0000000025036116" },
  { id: "wendao-instagram-w06-r02-20260920", channel_id: "instagram", title: "The To-do List Grew Legs", url: "https://www.instagram.com/wonderelian/p/Ddfa5cClRnk/" },
  { id: "wendao-xiaohongshu-w06-r03-20260920", channel_id: "xiaohongshu", title: "月亮取关了所有人", url: "https://www.xiaohongshu.com/explore/6aae8e050000000011035696" },
  { id: "wendao-instagram-w06-r03-20260920", channel_id: "instagram", title: "The Moon Unfollowed Everyone", url: "https://www.instagram.com/wonderelian/p/DdgRzT4FbUY/" },
];

await store.mutate((state) => {
  if (!state.channels.some((item) => item.id === "xiaohongshu")) state.channels.push({ id: "xiaohongshu", name: "Xiaohongshu", status: "active" });
  const existing = new Set(state.content.flatMap((item) => [item.id, item.url, item.publish_url]).filter(Boolean));
  let inserted = 0;
  for (const item of publications) {
    if (existing.has(item.id) || existing.has(item.url)) continue;
    state.content.push({
      app_id: "wendao", status: "published", published_at: "2026-09-20",
      impressions: null, engagements: null, outbound_clicks: null, first_time_downloads: null,
      landing_url: null, views: null, likes: null, comments: null, shares: null, saves: null,
      landing_page_visits: null, attributed_conversions: null, product_page_views: null,
      measurement_status: "collecting", id: item.id, channel_id: item.channel_id, type: "image_post",
      title: item.title, url: item.url, publish_url: item.url, campaign_id: null, app_store_campaign_url: null,
    });
    inserted += 1;
  }
  const auditId = "audit-ops-publications-20260920";
  state.audit = (state.audit ?? []).filter((item) => item.id !== auditId);
  state.audit.unshift({
    id: auditId, at: "2026-09-21T00:35:00.000Z", actor: "AI COO OS", app_id: "wendao",
    source: "verified_dual_brand_scheduler_and_durable_ops_logs", action: "sync_verified_publication_urls_2026_09_20",
    input: { external_writes: false, operation_date: "2026-09-20" },
    result: { status: "success", records_inserted: inserted, verified_business_publication_urls: publications.length, tracking_query_removed_from_permanent_urls: true, unverified_attempts_excluded: true, unknown_metrics_preserved_as_null: true },
    status: "success", error: null,
  });
  return { inserted };
});

console.log("OPS_PUBLICATIONS_20260920_SYNC_OK verified=6");
