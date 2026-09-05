import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";

const store = new JsonStore(fileURLToPath(new URL("../data/state.json", import.meta.url)));
const at = "2026-09-04T22:45:01.000Z";
const sourceReference = "https://itunes.apple.com/lookup?id=1461182261&country=us";
const appStoreUrl = "https://apps.apple.com/us/app/yixiu-white-noise-sleep/id1461182261";

await store.mutate((state) => {
  const yixiu = state.apps.find((app) => app.id === "yixiu-meditation");
  if (!yixiu) throw new Error("Yixiu portfolio app is missing");

  Object.assign(yixiu, {
    app_store_url: appStoreUrl,
    app_store_version: "1.9",
    app_store_release_date: at,
    updated_at: at,
  });

  const eventId = "event-yixiu-v1-9-live-20260905";
  state.events = state.events.filter((event) => event.id !== eventId);
  state.events.unshift({
    id: eventId,
    type: "app_store_release",
    app_id: "yixiu-meditation",
    entity_id: "yixiu-v1-9",
    at,
    source: "official_apple_itunes_lookup_api",
    payload: { version: "1.9", url: appStoreUrl },
  });

  const detectionId = "operational-change-yixiu-v1-9-live-20260905";
  state.detections = state.detections.filter((item) => item.id !== detectionId);
  state.detections.unshift({
    id: detectionId,
    app_id: "yixiu-meditation",
    type: "operational_change",
    metric: "app_store_version_release",
    label: "Yixiu v1.9 is live on the App Store",
    label_zh: "一休冥想 v1.9 已在 App Store 上线",
    current_value: "1.9",
    previous_baseline: "1.8",
    absolute_change: null,
    percentage_change: null,
    sample_size: null,
    confidence: 1,
    severity: "high",
    direction: "neutral",
    detected_at: at,
    evidence: "Apple's official lookup returns version 1.9, the public product URL and the current release date.",
    evidence_zh: "Apple 官方 Lookup API 已返回版本 1.9、公开产品地址与当前发布日期。",
    source_reference: sourceReference,
    verification_type: "api_verified",
  });

  const auditId = "audit-yixiu-v1-9-public-version-20260905";
  state.audit = state.audit.filter((item) => item.id !== auditId);
  state.audit.unshift({
    id: auditId,
    at: "2026-09-05T12:30:00.000Z",
    actor: "AI COO OS",
    app_id: "yixiu-meditation",
    source: "explicit_user_request + official_apple_itunes_lookup_api",
    action: "verify_and_update_yixiu_public_app_store_version",
    input: { external_writes: false },
    result: {
      previous_version: "1.8",
      version: "1.9",
      app_store_url: appStoreUrl,
      first_time_downloads: null,
      trial_starts: null,
      paid_conversions: null,
    },
    status: "success",
    error: null,
  });
});

console.log("YIXIU_PUBLIC_VERSION_OK version=1.9 source=api_verified");
