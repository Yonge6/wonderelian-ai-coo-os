import { homedir } from "node:os";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";
import { normalizeCodexAutomation, parsePublicAutomationMetadata } from "./providers/codex-automation-provider.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const automationFile = process.env.CODEX_AUTOMATION_FILE
  ?? join(homedir(), ".codex", "automations", "style-atlas-analytics", "automation.toml");
const metadata = parsePublicAutomationMetadata(await readFile(automationFile, "utf8"));
const now = new Date();
const verifiedAt = "2026-08-19T12:31:39.368Z";
const job = normalizeCodexAutomation(metadata, {
  now,
  lastRun: verifiedAt,
  result: {
    verified_publications: 4,
    community_replies: 3,
    seo_endpoints_verified: 0,
    attributable_downloads: null,
  },
});

const contentDefaults = {
  app_id: "style-atlas",
  status: "published",
  published_at: "2026-08-19",
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
};

const verifiedContent = [
  {
    id: "sa-instagram-bauhaus-20260819",
    channel_id: "instagram",
    type: "carousel",
    title: "Bauhaus Beyond Primary Colors",
    url: "https://www.instagram.com/wonderelian/p/DcONtQ0lfzX/",
    publish_url: "https://www.instagram.com/wonderelian/p/DcONtQ0lfzX/",
    campaign_id: "sa-instagram-organic",
    app_store_campaign_url: "https://apps.apple.com/app/apple-store/id6787447019?pt=120014121&ct=Instagram%20Organic&mt=8",
  },
  {
    id: "sa-pinterest-bauhaus-1-20260819",
    channel_id: "pinterest",
    type: "pin",
    title: "Bauhaus Is Not Just Red, Yellow and Blue",
    url: "https://www.pinterest.com/pin/1147643917689592691/",
    publish_url: "https://www.pinterest.com/pin/1147643917689592691/",
    campaign_id: "sa-pinterest-organic",
    app_store_campaign_url: "https://apps.apple.com/app/apple-store/id6787447019?pt=120014121&ct=Pinterest%20Organic&mt=8",
  },
  {
    id: "sa-pinterest-bauhaus-2-20260819",
    channel_id: "pinterest",
    type: "pin",
    title: "How to Read Bauhaus Through Structure",
    url: "https://www.pinterest.com/pin/1147643917689592720/",
    publish_url: "https://www.pinterest.com/pin/1147643917689592720/",
    campaign_id: "sa-pinterest-organic",
    app_store_campaign_url: "https://apps.apple.com/app/apple-store/id6787447019?pt=120014121&ct=Pinterest%20Organic&mt=8",
  },
  {
    id: "sa-pinterest-bauhaus-3-20260819",
    channel_id: "pinterest",
    type: "pin",
    title: "Apply Bauhaus to a Creator Cover",
    url: "https://www.pinterest.com/pin/1147643917689592731/",
    publish_url: "https://www.pinterest.com/pin/1147643917689592731/",
    campaign_id: "sa-pinterest-organic",
    app_store_campaign_url: "https://apps.apple.com/app/apple-store/id6787447019?pt=120014121&ct=Pinterest%20Organic&mt=8",
  },
  {
    id: "sa-tiktok-reply-kat-hernden-20260819",
    channel_id: "tiktok",
    type: "community_reply",
    title: "Bauhaus geometry translated into fabric",
    url: "https://www.tiktok.com/@katherndenartist/video/7668319903765613840",
    publish_url: "https://www.tiktok.com/@katherndenartist/video/7668319903765613840",
    campaign_id: null,
    app_store_campaign_url: null,
  },
  {
    id: "sa-tiktok-reply-beans-20260819",
    channel_id: "tiktok",
    type: "community_reply",
    title: "Bauhaus proportions across apparel identity",
    url: "https://www.tiktok.com/@beanswithoutborders/video/7667188122605636894",
    publish_url: "https://www.tiktok.com/@beanswithoutborders/video/7667188122605636894",
    campaign_id: null,
    app_store_campaign_url: null,
  },
  {
    id: "sa-tiktok-reply-liorzh-20260819",
    channel_id: "tiktok",
    type: "community_reply",
    title: "Bauhaus modular grid as theatrical rhythm",
    url: "https://www.tiktok.com/@liorzh_/photo/7653045175224159520",
    publish_url: "https://www.tiktok.com/@liorzh_/photo/7653045175224159520",
    campaign_id: null,
    app_store_campaign_url: null,
  },
].map((item) => ({ ...contentDefaults, ...item }));

const store = new JsonStore(join(root, "data", "state.json"));
await store.mutate((state) => {
  state.jobs = state.jobs.filter((item) => item.id !== "job-codex-style-atlas-growth");
  const index = state.jobs.findIndex((item) => item.id === job.id);
  if (index === -1) state.jobs.push(job);
  else state.jobs[index] = job;
  for (const item of verifiedContent) {
    const contentIndex = state.content.findIndex((existing) => existing.id === item.id);
    if (contentIndex === -1) state.content.push(item);
    else state.content[contentIndex] = item;
  }
  const xChannel = state.channels.find((item) => item.id === "x");
  if (xChannel) xChannel.status = "blocked_platform_suspension";
  state.audit = state.audit.filter((item) => item.id !== "audit-sync-codex-style-atlas-automation-20260818");
  const auditId = "audit-sync-unified-ai-coo-automation-20260818";
  if (!state.audit.some((item) => item.id === auditId)) {
    state.audit.unshift({
      id: auditId,
      at: now.toISOString(),
      actor: "AI COO OS",
      app_id: "style-atlas",
      source: "codex_automation_metadata_and_verified_ops_log",
      action: "sync_unified_codex_automation_registry",
      input: { external_writes: false },
      result: "Registered the single active AI COO heartbeat in the current task: Analytics checks at 03:30, 09:30, 15:30 and 20:30 Beijing, with growth operations only at 20:30; the old task target was removed.",
      status: "success",
      error: null,
    });
  }
  const growthAuditId = "audit-sync-style-atlas-growth-20260819";
  state.audit = state.audit.filter((item) => item.id !== growthAuditId);
  state.audit.unshift({
    id: growthAuditId,
    at: verifiedAt,
    actor: "AI COO OS",
    app_id: "style-atlas",
    source: "verified_ops_log_and_public_url_readback",
    action: "sync_verified_style_atlas_growth_outcomes",
    input: { external_writes: false },
    result: {
      verified_publications: 4,
      community_replies: 3,
      permanent_urls: 7,
      tiktok_self_post: "blocked_blank_studio",
      x_self_post: "blocked_platform_suspension",
      attributable_downloads: null,
    },
    status: "success",
    error: null,
  });
  return job;
});

console.log(`CODEX_AUTOMATION_SYNC_OK jobs=1 content=${verifiedContent.length} status=${job.status} schedule=${job.schedule}`);
