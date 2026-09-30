import { Ga4WebsiteProvider } from "./ga4-website-provider.mjs";

export const PRODUCT_PROJECTS = [
  { id: "yixiu", name: "Yixiu Meditation", name_zh: "一休冥想", hostname: "yixiu.wonderelian.com", website_id: "site-yixiu" },
  { id: "wendao", name: "Wendao", name_zh: "三慢问道" },
  { id: "xiazi", name: "Xiazi", name_zh: "虾子曰" },
  { id: "style-atlas", name: "Style Atlas", name_zh: "艺术风格图鉴" },
  { id: "maker", name: "Maker Business Lab", name_zh: "Maker Business Lab" },
  { id: "wonderelian", name: "WonderElian", name_zh: "WonderElian" },
];
const numeric = value => value === undefined || value === null || value === "" ? null : Number.isFinite(Number(value)) ? Number(value) : null;
export function reportRows(report) {
  return (report.rows ?? []).map(row => Object.fromEntries([
    ...(report.dimensionHeaders ?? []).map((key, i) => [key.name, row.dimensionValues?.[i]?.value ?? null]),
    ...(report.metricHeaders ?? []).map((key, i) => [key.name, numeric(row.metricValues?.[i]?.value)]),
  ]));
}
export function normalizeUsageEvents(report) {
  return reportRows(report).filter(row => /^yixiu_v2_[a-z_]+$/.test(row.eventName)).map(row => ({
    event: row.eventName, count: row.eventCount, users: row.totalUsers,
    seconds: row.eventName === "yixiu_v2_listen_time" ? row.eventValue : null,
  }));
}
export function pendingProductSnapshot(now = new Date().toISOString()) {
  return { schema_version: 1, generated_at: now, source: "Google Analytics 4 Data API", projects: PRODUCT_PROJECTS.map(project => ({ ...project, status: "planned", h5: null, ios: null })) };
}
export class ProductAnalyticsProvider extends Ga4WebsiteProvider {
  async fetchUsage({ startDate, endDate, iosStreamId }) {
    if (iosStreamId && !/^\d+$/.test(iosStreamId)) throw Object.assign(new Error("Invalid stream ID"), {code:"INVALID_STREAM"});
    const scope = iosStreamId ? {andGroup:{expressions:[
      {filter:{fieldName:"streamId",stringFilter:{matchType:"EXACT",value:iosStreamId}}},
      {filter:{fieldName:"platform",stringFilter:{matchType:"EXACT",value:"iOS"}}},
    ]}} : { filter: { fieldName: "hostName", stringFilter: { matchType: "EXACT", value: "yixiu.wonderelian.com", caseSensitive: true } } };
    const options = { startDate, endDate, dimensionFilter: scope };
    const events = await this.runReport({ ...options, dimensions: ["eventName"], metrics: ["eventCount", "totalUsers", "eventValue"] });
    const daily = await this.runReport({ ...options, dimensions: ["date", "eventName"], metrics: ["eventCount", "totalUsers", "eventValue"] });
    const overview = await this.runReport({ ...options, dimensions: [], metrics: ["totalUsers", "sessions"] });
    const normalized = normalizeUsageEvents(events);
    const result = {
      status: normalized.length ? "collecting" : "waiting_for_events",
      period_start: startDate, period_end: endDate,
      timezone: events.metadata?.timeZone ?? null,
      verified_at: new Date().toISOString(), source: "Google Analytics 4 Data API",
      data_quality: { thresholded: Boolean(events.metadata?.subjectToThresholding), sampled: Boolean(events.metadata?.samplingMetadatas?.length) },
      overview: reportRows(overview)[0] ?? null,
      events: normalized,
      legacy_events: reportRows(events).filter(row => ["yixiu_playback_start", "yixiu_download_click"].includes(row.eventName)).map(row => ({ event: row.eventName, count: row.eventCount, users: row.totalUsers })),
      daily: reportRows(daily).filter(row => row.eventName.startsWith("yixiu_v2_")).map(row => ({ date: row.date, event: row.eventName, count: row.eventCount, users: row.totalUsers, seconds: row.eventName === "yixiu_v2_listen_time" ? row.eventValue : null })),
      content: { status: "waiting_for_custom_dimension", rows: [] },
      retention: { status: "cohort_integration_pending", d1: null, d7: null },
      revenue: { status: "waiting_for_apple", paid_conversions: null, trial_starts: null, revenue: null },
    };
    try {
      const scenes = await this.runReport({ ...options, dimensions: ["customEvent:scene_id", "eventName"], metrics: ["eventCount", "totalUsers", "eventValue"] });
      const rows = reportRows(scenes).filter(row => row["customEvent:scene_id"] && row["customEvent:scene_id"] !== "(not set)" && row.eventName.startsWith("yixiu_v2_")).map(row => ({ scene: row["customEvent:scene_id"], event: row.eventName, count: row.eventCount, users: row.totalUsers, seconds: row.eventName === "yixiu_v2_listen_time" ? row.eventValue : null }));
      result.content = { status: rows.length ? "collecting" : "waiting_for_events", rows };
    } catch (error) { result.content.error_code = error.code ?? "CUSTOM_DIMENSION_UNAVAILABLE"; }
    return result;
  }
}
