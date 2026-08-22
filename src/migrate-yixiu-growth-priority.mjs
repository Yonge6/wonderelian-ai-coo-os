import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";

const store = new JsonStore(fileURLToPath(new URL("../data/state.json", import.meta.url)));
const at = "2026-08-21T23:57:57.000Z";
const sourceReference = "https://itunes.apple.com/lookup?id=1461182261&country=us";
const appStoreUrl = "https://apps.apple.com/us/app/yixiu-white-noise-sleep/id1461182261";

await store.mutate((state) => {
  const yixiu = state.apps.find((app) => app.id === "yixiu-meditation");
  const styleAtlas = state.apps.find((app) => app.id === "style-atlas");
  if (!yixiu || !styleAtlas) throw new Error("Required portfolio apps are missing");

  Object.assign(yixiu, {
    description: "Nature sounds, immersive scenes and water breathing for sleep, focus and quiet pauses.",
    category: "Health & Fitness",
    app_store_url: appStoreUrl,
    app_store_version: "1.3",
    app_store_release_date: at,
    primary_market: "global",
    target_audience: "People seeking nature sounds for sleep, focus and quiet pauses.",
    positioning: "A no-account, no-ad nature-sound space for sleep, focus and breathing at your own pace.",
    monetization_model: "freemium with monthly and annual Yixiu Plus subscriptions",
    acquisition_channels: ["search", "social", "owned_web", "community"],
    keywords: ["nature sounds", "white noise", "sleep", "focus", "water breathing"],
    kpis: ["first_time_downloads", "product_page_views", "trial_starts", "paid_conversions"],
    content_themes: ["sleep rituals", "focus soundscapes", "water breathing", "quiet product trust", "Yixiu Plus value"],
    promotion_priority: 1,
    promotion_status: "active_highest_priority",
    updated_at: at,
  });
  Object.assign(styleAtlas, {
    promotion_priority: null,
    promotion_status: "paused_by_owner",
    updated_at: at,
  });

  const job = state.jobs.find((item) => item.id === "job-codex-ai-coo-unified");
  if (job) Object.assign(job, {
    app_id: "yixiu-meditation",
    name: "WonderElian AI COO Yixiu Growth and Analytics Monitoring",
    name_zh: "WonderElian AI COO 一休冥想增长与 Analytics 监测",
    result: {
      growth_priority: "yixiu_highest",
      style_atlas_promotion: "paused",
      verified_publications: 0,
      community_replies: 0,
      attributable_downloads: null,
      trial_starts: null,
      paid_conversions: null,
    },
  });

  state.events = state.events.filter((event) => event.id !== "event-yixiu-v1-3-live-20260822");
  state.events.unshift({
    id: "event-yixiu-v1-3-live-20260822",
    type: "app_store_release",
    app_id: "yixiu-meditation",
    entity_id: "yixiu-v1-3",
    at,
    source: "official_apple_itunes_lookup_api",
    payload: { version: "1.3", url: appStoreUrl },
  });

  state.detections = state.detections.filter((item) => item.id !== "operational-change-yixiu-v1-3-live-20260822");
  state.detections.unshift({
    id: "operational-change-yixiu-v1-3-live-20260822",
    app_id: "yixiu-meditation",
    type: "operational_change",
    metric: "app_store_version_release",
    label: "Yixiu v1.3 is live on the App Store",
    label_zh: "一休冥想 v1.3 已在 App Store 上线",
    current_value: "1.3",
    previous_baseline: "1.2",
    absolute_change: null,
    percentage_change: null,
    sample_size: null,
    confidence: 1,
    severity: "high",
    direction: "neutral",
    detected_at: at,
    evidence: "Apple's official lookup returns version 1.3, the public product URL and the current release notes.",
    evidence_zh: "Apple 官方 Lookup API 已返回版本 1.3、公开产品地址与当前版本说明。",
    source_reference: sourceReference,
    verification_type: "api_verified",
  });

  const auditId = "audit-yixiu-v1-3-growth-priority-20260822";
  state.audit = state.audit.filter((item) => item.id !== auditId);
  state.audit.unshift({
    id: auditId,
    at,
    actor: "Codex COO",
    app_id: "yixiu-meditation",
    source: "explicit_user_priority + official_apple_itunes_lookup_api",
    action: "verify_yixiu_v1_3_and_make_yixiu_highest_growth_priority",
    input: { external_writes: false, style_atlas_active_promotion: false },
    result: {
      version: "1.3",
      app_store_url: appStoreUrl,
      yixiu_promotion: "active_highest_priority",
      style_atlas_promotion: "paused_by_owner",
      automation_updated_in_place: true,
      first_time_downloads: null,
      trial_starts: null,
      paid_conversions: null,
    },
    status: "success",
    error: null,
  });
});

console.log("YIXIU_GROWTH_PRIORITY_OK version=1.3 priority=highest style_atlas=paused");
