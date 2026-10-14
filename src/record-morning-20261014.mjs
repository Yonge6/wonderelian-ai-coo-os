import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { JsonStore } from "./store.mjs";
import { fileURLToPath } from "node:url";

const ledger = JSON.parse(await readFile(
  "/Users/yongyuan/Documents/ChatGPT/运营推广/assets/yixiu-20261013/publication-status.json",
  "utf8",
));
const store = new JsonStore(fileURLToPath(new URL("../data/state.json", import.meta.url)));

await store.mutate((state) => {
  const upstream = JSON.parse(execFileSync("git", ["show", "origin/main:data/state.json"], { maxBuffer: 30_000_000 }));
  for (const row of upstream.audit ?? []) {
    if (!state.audit.some((item) => item.id === row.id)) state.audit.push(row);
  }

  let inserted = 0;
  for (const [channel, item] of Object.entries(ledger.platforms)) {
    const url = item.public_url ?? item.url;
    if (item.status !== "published_verified" || !url || state.content.some((row) => row.url === url || row.publish_url === url)) continue;
    const landingUrl = channel === "pinterest"
      ? `https://yixiu.wonderelian.com/one-minute-reset/?utm_source=pinterest&utm_medium=organic_social&utm_campaign=one_minute_reset&utm_content=${ledger.content_id}`
      : channel === "youtube"
        ? `https://yixiu.wonderelian.com/one-minute-reset/?utm_source=youtube&utm_medium=organic_social&utm_campaign=one_minute_reset&utm_content=${ledger.content_id}`
        : null;
    state.content.push({
      id: `yixiu-${channel}-${ledger.content_id}`,
      app_id: "yixiu-meditation",
      channel_id: channel,
      type: "image_post",
      title: "OUT OF OFFICE. For one minute.",
      status: "published",
      published_at: "2026-10-13",
      url,
      publish_url: url,
      landing_url: landingUrl,
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

  state.audit.unshift({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    actor: "Codex",
    source: "2026-10-14 morning heartbeat; official GA4; October 13 four-platform public ledger",
    action: "morning_data_and_publication_reconciliation",
    result: {
      website_data_through: state.metadata.data_through.website_analytics,
      records_inserted: inserted,
      verified_publication_count: 4,
      apple_configuration_present: 0,
      apple_api_verified: false,
      apple_request_count: null,
      apple_requests_created: 0,
      app_snapshot_preserved: true,
      ga4_recovery: {
        credential_candidates: 1,
        property_candidates: 1,
        mode600: true,
        official_probe_verified: true,
      },
    },
    status: "partial",
    error: {
      code: "APPLE_CONFIGURATION_MISSING",
      message: "App Analytics not refreshed. Prior official evidence retains its independent cutoff; no request was created and missing metrics remain null.",
    },
  });
});
