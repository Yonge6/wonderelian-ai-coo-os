import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";

const store = new JsonStore(fileURLToPath(new URL("../data/state.json", import.meta.url)));

const publications = [
  {
    app_id: "style-atlas",
    content_id: "20261016_style_atlas_bauhaus_art_deco",
    channel_id: "pinterest",
    type: "short_video",
    title: "One Rider, Two Worlds: Bauhaus vs Art Deco",
    url: "https://www.pinterest.com/pin/1147643917694432701/",
    landing_url: "https://style-atlas.wonderelian.com/?utm_source=pinterest&utm_medium=organic_social&utm_campaign=style_comparison&utm_content=20261016_video_bauhaus_art_deco",
  },
  {
    app_id: "style-atlas",
    content_id: "20261017_style_atlas_surrealism_cyberpunk",
    channel_id: "instagram",
    type: "short_video",
    title: "One Rider, Two Worlds: Surrealism vs Cyberpunk",
    url: "https://www.instagram.com/wonderelian/reel/DemOCnBBvPa/",
    landing_url: null,
  },
  {
    app_id: "style-atlas",
    content_id: "20261017_style_atlas_surrealism_cyberpunk",
    channel_id: "pinterest",
    type: "short_video",
    title: "One Rider, Two Worlds: Surrealism vs Cyberpunk",
    url: "https://www.pinterest.com/pin/1147643917694445215/",
    landing_url: "https://style-atlas.wonderelian.com/?utm_source=pinterest&utm_medium=organic_social&utm_campaign=style_comparison&utm_content=20261017_video_surrealism_cyberpunk",
  },
  {
    app_id: "style-atlas",
    content_id: "20261017_style_atlas_surrealism_cyberpunk",
    channel_id: "tiktok",
    type: "short_video",
    title: "One Rider, Two Worlds: Surrealism vs Cyberpunk",
    url: "https://www.tiktok.com/@wonderelian1/video/7697613555176049933",
    landing_url: null,
  },
  {
    app_id: "style-atlas",
    content_id: "20261017_style_atlas_surrealism_cyberpunk",
    channel_id: "youtube",
    type: "short_video",
    title: "One Rider, Two Worlds: Surrealism vs Cyberpunk",
    url: "https://youtube.com/shorts/7cEGgLSRsGw",
    landing_url: "https://style-atlas.wonderelian.com/?utm_source=youtube&utm_medium=organic_social&utm_campaign=style_comparison&utm_content=20261017_video_surrealism_cyberpunk",
  },
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
      published_at: "2026-10-17",
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

  const auditId = "audit-ops-publications-20261017";
  state.audit = (state.audit ?? []).filter((item) => item.id !== auditId);
  state.audit.unshift({
    id: auditId,
    at: new Date().toISOString(),
    actor: "AI COO OS",
    app_id: null,
    source: "verified_publication_status_and_durable_ops_logs",
    action: "sync_verified_publication_urls_2026_10_17",
    input: { external_writes: false, operation_date: "2026-10-17" },
    result: {
      status: "success",
      records_inserted: inserted,
      verified_publication_urls: publications.length,
      scheduled_or_unverified_items_excluded: true,
      unknown_metrics_preserved_as_null: true,
    },
    status: "success",
    error: null,
  });

  return { inserted };
});

console.log(`OPS_PUBLICATIONS_20261017_SYNC_OK verified=${publications.length}`);
