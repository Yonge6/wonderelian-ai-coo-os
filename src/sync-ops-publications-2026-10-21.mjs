import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";

const store = new JsonStore(fileURLToPath(new URL("../data/state.json", import.meta.url)));

const publications = [
  {
    "app_id": "yixiu-meditation",
    "content_id": "20261021_01-list-rest",
    "channel_id": "instagram",
    "type": "image",
    "title": "Let the List Rest",
    "url": "https://www.instagram.com/wonderelian/p/DewaY5rnfv3/",
    "landing_url": null
  },
  {
    "app_id": "yixiu-meditation",
    "content_id": "20261021_01-list-rest",
    "channel_id": "pinterest",
    "type": "image",
    "title": "Let the List Rest",
    "url": "https://www.pinterest.com/pin/1147643917694798187/",
    "landing_url": "https://yixiu.wonderelian.com/sleep-sounds/?utm_source=pinterest&utm_medium=organic_social&utm_campaign=sleep_sounds&utm_content=20261021_01-list-rest"
  },
  {
    "app_id": "yixiu-meditation",
    "content_id": "20261021_01-list-rest",
    "channel_id": "tiktok",
    "type": "image",
    "title": "Let the List Rest",
    "url": "https://www.tiktok.com/@wonderelian1/photo/7699101784941350157",
    "landing_url": null
  },
  {
    "app_id": "yixiu-meditation",
    "content_id": "20261021_01-list-rest",
    "channel_id": "youtube",
    "type": "image",
    "title": "Let the List Rest",
    "url": "https://www.youtube.com/post/Ugkxm7KGzaTw8WfKSlKa2NzmYuc38vEPPNnT",
    "landing_url": "https://yixiu.wonderelian.com/sleep-sounds/?utm_source=youtube&utm_medium=organic_social&utm_campaign=sleep_sounds&utm_content=20261021_01-list-rest"
  }
].map((item) => ({
  ...item,
  id: `${item.app_id}-${item.channel_id}-${item.content_id}`,
  publish_url: item.url,
}));

await store.mutate((state) => {
  const existing = new Set(state.content.flatMap((item) => [item.id, item.url, item.publish_url]).filter(Boolean));
  let inserted = 0;
  for (const item of publications) {
    if (existing.has(item.id) || existing.has(item.url)) continue;
    state.content.push({
      ...item,
      status: "published",
      published_at: "2026-10-21",
      impressions: null,
      engagements: null,
      outbound_clicks: null,
      first_time_downloads: null,
      views: null,
      likes: null,
      comments: null,
      shares: null,
      saves: null,
      landing_page_visits: null,
      attributed_conversions: null,
      product_page_views: null,
      measurement_status: "collecting",
      campaign_id: null,
      app_store_campaign_url: null,
    });
    inserted += 1;
  }

  const auditId = "audit-ops-publications-20261021";
  state.audit = (state.audit ?? []).filter((item) => item.id !== auditId);
  state.audit.unshift({
    id: auditId,
    at: new Date().toISOString(),
    actor: "AI COO OS",
    app_id: null,
    source: "verified_publication_status_and_durable_ops_logs",
    action: "sync_verified_publication_urls_2026_10_21",
    input: { external_writes: false, operation_date: "2026-10-21" },
    result: {
      status: "success",
      records_inserted: inserted,
      verified_publication_urls: publications.length,
      scheduled_drafts_and_unverified_items_excluded: true,
      unknown_metrics_preserved_as_null: true,
    },
    status: "success",
    error: null,
  });

  return { inserted };
});

console.log(`OPS_PUBLICATIONS_20261021_SYNC_OK verified=${publications.length}`);
