import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";

const store = new JsonStore(fileURLToPath(new URL("../data/state.json", import.meta.url)));

const publications = [
  {
    id: "yixiu-instagram-20260926_01-one-drop-answer",
    channel_id: "instagram",
    type: "image_post",
    title: "LET ONE DROP ANSWER FOR YOU.",
    url: "https://www.instagram.com/p/DdwCgewgPNj/",
    landing_url: null,
  },
  {
    id: "yixiu-pinterest-20260926_01-one-drop-answer",
    channel_id: "pinterest",
    type: "image_pin",
    title: "LET ONE DROP ANSWER FOR YOU. — Yixiu",
    url: "https://www.pinterest.com/pin/1147643917692635387/",
    landing_url: "https://yixiu.wonderelian.com/one-minute-reset/?utm_source=pinterest&utm_medium=social&utm_campaign=one_minute_reset&utm_content=20260926_01-one-drop-answer",
  },
  {
    id: "yixiu-tiktok-20260926_01-one-drop-answer",
    channel_id: "tiktok",
    type: "photo_post",
    title: "LET ONE DROP ANSWER FOR YOU.",
    url: "https://www.tiktok.com/@wonderelian1/photo/7689821746299522317",
    landing_url: null,
  },
  {
    id: "yixiu-youtube-20260926_01-one-drop-answer",
    channel_id: "youtube",
    type: "community_post",
    title: "LET ONE DROP ANSWER FOR YOU.",
    url: "https://www.youtube.com/post/UgkxrVTrKP1xO-B9sYT28cBQ3FAkdCCGIcxi",
    landing_url: "https://yixiu.wonderelian.com/one-minute-reset/?utm_source=youtube&utm_medium=community&utm_campaign=one_minute_reset&utm_content=20260926_01-one-drop-answer",
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
      published_at: "2026-09-26",
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

  const auditId = "audit-ops-publications-20260926";
  state.audit = (state.audit ?? []).filter((item) => item.id !== auditId);
  state.audit.unshift({
    id: auditId,
    at: new Date().toISOString(),
    actor: "AI COO OS",
    app_id: "yixiu-meditation",
    source: "verified_publication_status_and_durable_ops_logs",
    action: "sync_verified_publication_urls_2026_09_26",
    input: { external_writes: false, operation_date: "2026-09-26" },
    result: {
      status: "success",
      records_inserted: inserted,
      verified_business_publication_urls: publications.length,
      unverified_attempts_excluded: true,
      publications_without_permanent_urls_excluded: true,
      unknown_metrics_preserved_as_null: true,
    },
    status: "success",
    error: null,
  });
  return { inserted };
});

console.log(`OPS_PUBLICATIONS_20260926_SYNC_OK verified=${publications.length}`);
