import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";

const store = new JsonStore(fileURLToPath(new URL("../data/state.json", import.meta.url)));

const publications = [
  {
    id: "yixiu-instagram-20260928_01-quiet-needs-no-email",
    channel_id: "instagram",
    type: "image_post",
    title: "QUIET DOESN'T NEED YOUR EMAIL.",
    url: "https://www.instagram.com/wonderelian/p/Dd1Mr8GG3ii/",
    landing_url: null,
  },
  {
    id: "yixiu-pinterest-20260928_01-quiet-needs-no-email",
    channel_id: "pinterest",
    type: "image_pin",
    title: "No-Account Nature Sounds for a Quieter Night",
    url: "https://www.pinterest.com/pin/1147643917692814560/",
    landing_url: "https://yixiu.wonderelian.com/sleep-sounds/?utm_source=pinterest&utm_medium=social&utm_campaign=sleep_sounds&utm_content=20260928_01-quiet-needs-no-email",
  },
  {
    id: "yixiu-tiktok-20260928_01-quiet-needs-no-email",
    channel_id: "tiktok",
    type: "photo_post",
    title: "QUIET DOESN'T NEED YOUR EMAIL.",
    url: "https://www.tiktok.com/@wonderelian1/video/7690564853018201358",
    landing_url: null,
  },
];

await store.mutate((state) => {
  const existing = new Set(
    state.content.flatMap((item) => [item.id, item.url, item.publish_url]).filter(Boolean),
  );
  let inserted = 0;
  for (const item of publications) {
    if (existing.has(item.id) || existing.has(item.url)) continue;
    state.content.push({
      app_id: "yixiu-meditation",
      status: "published",
      published_at: "2026-09-28",
      impressions: null,
      engagements: null,
      outbound_clicks: null,
      first_time_downloads: null,
      landing_url: item.landing_url,
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
      channel_id: item.channel_id,
      type: item.type,
      title: item.title,
      url: item.url,
      publish_url: item.url,
      campaign_id: null,
      app_store_campaign_url: null,
    });
    inserted += 1;
  }

  const auditId = "audit-ops-publications-20260928";
  state.audit = (state.audit ?? []).filter((item) => item.id !== auditId);
  state.audit.unshift({
    id: auditId,
    at: new Date().toISOString(),
    actor: "AI COO OS",
    app_id: "yixiu-meditation",
    source: "verified_publication_status_and_durable_ops_logs",
    action: "sync_verified_publication_urls_2026_09_28",
    input: { external_writes: false, operation_date: "2026-09-28" },
    result: {
      status: "success",
      records_inserted: inserted,
      verified_business_publication_urls: publications.length,
      unverified_youtube_publication_excluded: true,
      publications_without_permanent_urls_excluded: true,
      unknown_metrics_preserved_as_null: true,
    },
    status: "success",
    error: null,
  });
  return { inserted };
});

console.log(`OPS_PUBLICATIONS_20260928_SYNC_OK verified=${publications.length}`);
