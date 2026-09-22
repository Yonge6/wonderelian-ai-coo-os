import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";

const store = new JsonStore(fileURLToPath(new URL("../data/state.json", import.meta.url)));
const publications = [
  { id: "yixiu-pinterest-20260921_01-upward-rain", title: "LET THE RAIN FALL UP. — Yixiu", url: "https://www.pinterest.com/pin/1147643917692230709/", landing_url: "https://yixiu.wonderelian.com/one-minute-reset/?utm_source=pinterest&utm_medium=social&utm_campaign=one_minute_reset&utm_content=20260921_01-upward-rain" },
  { id: "yixiu-pinterest-20260921_02-library-river", title: "CHECK OUT A QUIETER NIGHT. — Yixiu", url: "https://www.pinterest.com/pin/1147643917692230735/", landing_url: "https://yixiu.wonderelian.com/sleep-sounds/?utm_source=pinterest&utm_medium=social&utm_campaign=sleep_sounds&utm_content=20260921_02-library-river" },
  { id: "yixiu-pinterest-20260921_03-forest-headphones", title: "PUT A FOREST OVER THE NOISE. — Yixiu", url: "https://www.pinterest.com/pin/1147643917692230737/", landing_url: "https://yixiu.wonderelian.com/focus-sounds/?utm_source=pinterest&utm_medium=social&utm_campaign=focus_sounds&utm_content=20260921_03-forest-headphones" },
  { id: "yixiu-pinterest-20260921_04-cloud-chair", title: "GIVE THE CLOUD YOUR CHAIR. — Yixiu", url: "https://www.pinterest.com/pin/1147643917692230739/", landing_url: "https://yixiu.wonderelian.com/sleep-sounds/?utm_source=pinterest&utm_medium=social&utm_campaign=sleep_sounds&utm_content=20260921_04-cloud-chair" },
  { id: "yixiu-pinterest-20260921_05-notebook-terraces", title: "LET THE PAGE GROW WATER. — Yixiu", url: "https://www.pinterest.com/pin/1147643917692230745/", landing_url: "https://yixiu.wonderelian.com/focus-sounds/?utm_source=pinterest&utm_medium=social&utm_campaign=focus_sounds&utm_content=20260921_05-notebook-terraces" },
  { id: "yixiu-pinterest-20260921_06-private-tree-cabin", title: "KEEP THIS PAUSE TO YOURSELF. — Yixiu", url: "https://www.pinterest.com/pin/1147643917692230749/", landing_url: "https://yixiu.wonderelian.com/?utm_source=pinterest&utm_medium=social&utm_campaign=sleep_sounds&utm_content=20260921_06-private-tree-cabin" },
  { id: "yixiu-pinterest-20260921_07-water-next-move", title: "PAUSE BEFORE THE NEXT MOVE. — Yixiu", url: "https://www.pinterest.com/pin/1147643917692230750/", landing_url: "https://yixiu.wonderelian.com/one-minute-reset/?utm_source=pinterest&utm_medium=social&utm_campaign=one_minute_reset&utm_content=20260921_07-water-next-move" },
  { id: "yixiu-pinterest-20260921_08-stream-home", title: "TAKE THE STREAM HOME. — Yixiu", url: "https://www.pinterest.com/pin/1147643917692230753/", landing_url: "https://yixiu.wonderelian.com/focus-sounds/?utm_source=pinterest&utm_medium=social&utm_campaign=focus_sounds&utm_content=20260921_08-stream-home" },
  { id: "yixiu-pinterest-20260921_09-duvet-sailboat", title: "SAIL INTO THE SLOWER HOUR. — Yixiu", url: "https://www.pinterest.com/pin/1147643917692230755/", landing_url: "https://yixiu.wonderelian.com/sleep-sounds/?utm_source=pinterest&utm_medium=social&utm_campaign=sleep_sounds&utm_content=20260921_09-duvet-sailboat" },
];

await store.mutate((state) => {
  const existing = new Set(state.content.flatMap((item) => [item.id, item.url, item.publish_url]).filter(Boolean));
  let inserted = 0;
  for (const item of publications) {
    if (existing.has(item.id) || existing.has(item.url)) continue;
    state.content.push({
      app_id: "yixiu-meditation", status: "published", published_at: "2026-09-21",
      impressions: null, engagements: null, outbound_clicks: null, first_time_downloads: null,
      landing_url: item.landing_url, views: null, likes: null, comments: null, shares: null, saves: null,
      landing_page_visits: null, attributed_conversions: null, product_page_views: null,
      measurement_status: "collecting", id: item.id, channel_id: "pinterest", type: "image_post",
      title: item.title, url: item.url, publish_url: item.url, campaign_id: null, app_store_campaign_url: null,
    });
    inserted += 1;
  }
  const auditId = "audit-ops-publications-20260921";
  state.audit = (state.audit ?? []).filter((item) => item.id !== auditId);
  state.audit.unshift({
    id: auditId, at: "2026-09-21T12:50:40.000Z", actor: "AI COO OS", app_id: "yixiu-meditation",
    source: "verified_publication_status_and_durable_ops_logs", action: "sync_verified_publication_urls_2026_09_21",
    input: { external_writes: false, operation_date: "2026-09-21" },
    result: { status: "success", records_inserted: inserted, verified_business_publication_urls: publications.length, unverified_attempts_excluded: true, publications_without_permanent_urls_excluded: true, unknown_metrics_preserved_as_null: true },
    status: "success", error: null,
  });
  return { inserted };
});

console.log(`OPS_PUBLICATIONS_20260921_SYNC_OK verified=${publications.length}`);
