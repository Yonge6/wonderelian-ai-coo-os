import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";

const store = new JsonStore(fileURLToPath(new URL("../data/state.json", import.meta.url)));

const publications = [
  {
    app_id: "yixiu-meditation",
    content_id: "20261018_yixiu_office_nap_30min",
    channel_id: "instagram",
    type: "short_video",
    title: "The Office Is Still at War. I’m Taking a Nap.",
    url: "https://www.instagram.com/wonderelian/reel/DeoeNeHBwyk/",
    landing_url: null,
  },
  {
    app_id: "yixiu-meditation",
    content_id: "20261018_yixiu_office_nap_30min",
    channel_id: "pinterest",
    type: "short_video",
    title: "The Office Is Still at War. I’m Taking a Nap.",
    url: "https://www.pinterest.com/pin/1147643917694528172/",
    landing_url: "https://yixiu.wonderelian.com/sleep-sounds/?utm_source=pinterest&utm_medium=organic_social&utm_campaign=sleep_sounds&utm_content=20261018_yixiu_office_nap_30min",
  },
  {
    app_id: "yixiu-meditation",
    content_id: "20261018_01-day-drawer",
    channel_id: "instagram",
    type: "image",
    title: "Put the Day in a Drawer",
    url: "https://www.instagram.com/p/DeosAuCDXJW/",
    landing_url: null,
  },
  {
    app_id: "yixiu-meditation",
    content_id: "20261018_01-day-drawer",
    channel_id: "tiktok",
    type: "image",
    title: "Put the Day in a Drawer",
    url: "https://www.tiktok.com/@wonderelian1/photo/7697803833358945549",
    landing_url: null,
  },
  {
    app_id: "yixiu-meditation",
    content_id: "20261018_01-day-drawer",
    channel_id: "youtube",
    type: "image",
    title: "Put the Day in a Drawer",
    url: "https://www.youtube.com/post/UgkxMBaClI-C0eCo7ALcTlgGA0MwgkNjpd-W",
    landing_url: "https://yixiu.wonderelian.com/sleep-sounds/?utm_source=youtube&utm_medium=organic_social&utm_campaign=sleep_sounds&utm_content=20261018_01-day-drawer",
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
      published_at: "2026-10-18",
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

  const auditId = "audit-ops-publications-20261018";
  state.audit = (state.audit ?? []).filter((item) => item.id !== auditId);
  state.audit.unshift({
    id: auditId,
    at: new Date().toISOString(),
    actor: "AI COO OS",
    app_id: null,
    source: "verified_publication_status_and_durable_ops_logs",
    action: "sync_verified_publication_urls_2026_10_18",
    input: { external_writes: false, operation_date: "2026-10-18" },
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

console.log(`OPS_PUBLICATIONS_20261018_SYNC_OK verified=${publications.length}`);
