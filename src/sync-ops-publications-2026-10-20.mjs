import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";

const store = new JsonStore(fileURLToPath(new URL("../data/state.json", import.meta.url)));

const publications = [
  {
    "app_id": "yixiu-meditation",
    "content_id": "20261020_01-turn-down",
    "channel_id": "instagram",
    "type": "image",
    "title": "Turn Down the Day",
    "url": "https://www.instagram.com/p/Det1imYnXV2/",
    "landing_url": null
  },
  {
    "app_id": "yixiu-meditation",
    "content_id": "20261020_01-turn-down",
    "channel_id": "pinterest",
    "type": "image",
    "title": "Turn Down the Day",
    "url": "https://www.pinterest.com/pin/1147643917694713615/",
    "landing_url": "https://yixiu.wonderelian.com/sleep-sounds/?utm_source=pinterest&utm_medium=organic_social&utm_campaign=sleep_sounds&utm_content=20261020_01-turn-down"
  },
  {
    "app_id": "yixiu-meditation",
    "content_id": "20261020_01-turn-down",
    "channel_id": "tiktok",
    "type": "image",
    "title": "Turn Down the Day",
    "url": "https://www.tiktok.com/@wonderelian1/photo/7698543589894180110",
    "landing_url": null
  },
  {
    "app_id": "yixiu-meditation",
    "content_id": "20261020_01-turn-down",
    "channel_id": "youtube",
    "type": "image",
    "title": "Turn Down the Day",
    "url": "https://www.youtube.com/post/UgkxO-uEQCu6R97teB-2aPFWLSJllD1SScTK",
    "landing_url": null
  },
  {
    "app_id": "wendao",
    "content_id": "20261020_wendao_every_light",
    "channel_id": "instagram",
    "type": "short_video",
    "title": "Everyone Else Is Shining",
    "url": "https://www.instagram.com/reel/Det8fZshzgS/",
    "landing_url": null
  },
  {
    "app_id": "wendao",
    "content_id": "20261020_wendao_every_light",
    "channel_id": "pinterest",
    "type": "short_video",
    "title": "Everyone Else Is Shining",
    "url": "https://www.pinterest.com/pin/1147643917694719741/",
    "landing_url": "https://wendao.wonderelian.com/?utm_source=pinterest&utm_medium=organic_social&utm_campaign=everyday_tao&utm_content=20261020_wendao_every_light"
  },
  {
    "app_id": "wendao",
    "content_id": "20261020_wendao_every_light",
    "channel_id": "tiktok",
    "type": "short_video",
    "title": "Everyone Else Is Shining",
    "url": "https://www.tiktok.com/@wonderelian1/video/7698663507021057293",
    "landing_url": null
  },
  {
    "app_id": "wendao",
    "content_id": "20261020_wendao_every_light",
    "channel_id": "youtube",
    "type": "short_video",
    "title": "Everyone Else Is Shining ✨ | Wendao #Shorts",
    "url": "https://www.youtube.com/shorts/4bfD8ekOvCA",
    "landing_url": "https://wendao.wonderelian.com/?utm_source=youtube&utm_medium=organic_social&utm_campaign=everyday_tao&utm_content=20261020_wendao_every_light"
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
      published_at: "2026-10-20",
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

  const auditId = "audit-ops-publications-20261020";
  state.audit = (state.audit ?? []).filter((item) => item.id !== auditId);
  state.audit.unshift({
    id: auditId,
    at: new Date().toISOString(),
    actor: "AI COO OS",
    app_id: null,
    source: "verified_publication_status_and_durable_ops_logs",
    action: "sync_verified_publication_urls_2026_10_20",
    input: { external_writes: false, operation_date: "2026-10-20" },
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

console.log(`OPS_PUBLICATIONS_20261020_SYNC_OK verified=${publications.length}`);
