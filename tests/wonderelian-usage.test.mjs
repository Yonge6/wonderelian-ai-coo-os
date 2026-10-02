import test from "node:test";
import assert from "node:assert/strict";
import { ProductAnalyticsProvider } from "../src/providers/product-analytics-provider.mjs";
import { syncProductAnalyticsState } from "../src/sync-product-analytics.mjs";
import { usageView } from "../public/product-usage.js";

const report = (dimensions, metrics, rows) => ({
  dimensionHeaders: dimensions.map(name => ({ name })),
  metricHeaders: metrics.map(name => ({ name })),
  rows: rows.map(values => ({
    dimensionValues: dimensions.map((name, index) => ({ value: String(values[index]) })),
    metricValues: metrics.map((name, index) => ({ value: String(values[dimensions.length + index]) })),
  })),
  metadata: { timeZone: "Asia/Shanghai" },
});

test("WonderElian reports stay on exact hosts and filter the dedicated schema", async () => {
  const calls = [];
  const provider = new ProductAnalyticsProvider();
  provider.runReport = async options => {
    calls.push(options);
    if (options.dimensions.includes("contentId")) return report(options.dimensions, options.metrics, [["essay-one", "wonder_v1_article_reading_time", 1, 1, 60]]);
    if (options.dimensions.includes("eventName")) return report(options.dimensions, options.metrics, [
      ...(options.dimensions.includes("date") ? [["20261001", "wonder_v1_active_time", 2, 1, 30]] : [["wonder_v1_active_time", 2, 1, 30], ["content_discovery", 8, 3, 0], ["atlas_v1_style_view", 4, 2, 0]]),
    ]);
    return { rows: [], metadata: { timeZone: "Asia/Shanghai" } };
  };
  const result = await provider.fetchWonderElianUsage({ startDate: "2026-09-04", endDate: "2026-10-01" });
  assert.ok(calls.every(call => call.dimensionFilter.filter.inListFilter.values.join(",") === "wonderelian.com,www.wonderelian.com"));
  assert.deepEqual(result.events, [{ event: "wonder_v1_active_time", count: 2, users: 1, seconds: 30 }]);
  assert.equal(result.legacy_events[0].event, "content_discovery");
  assert.equal(result.content.rows[0].content, "essay-one");
  assert.equal(result.revenue.revenue, null);
});

test("sync routes WonderElian through its dedicated provider and preserves earlier baseline", async () => {
  const calls = [];
  const generic = async ({ project }) => { calls.push(`generic:${project.id}`); return { status: "waiting_for_events", events: [] }; };
  const provider = {
    health: async () => ({ status: "configured" }),
    fetchUsage: async () => ({ status: "waiting_for_events", events: [] }),
    fetchProjectUsage: generic,
    fetchStyleAtlasUsage: async () => ({ status: "waiting_for_events", events: [] }),
    fetchBuerUsage: async () => ({ status: "waiting_for_events", events: [] }),
    fetchWonderElianUsage: async () => { calls.push("wonder:detailed"); return { status: "waiting_for_events", events: [], content: { rows: [] } }; },
  };
  const state = { audit: [], product_analytics: { projects: [{ id: "wonderelian", h5: { status: "collecting", overview: { totalUsers: 82 } } }] } };
  const result = await syncProductAnalyticsState(state, { provider, iosStreamId: null, buerIosStreamId: null, styleAtlasIosStreamId: null });
  const wonder = result.projects.find(project => project.id === "wonderelian");
  assert.ok(calls.includes("wonder:detailed"));
  assert.ok(!calls.includes("generic:wonderelian"));
  assert.equal(wonder.legacy_h5.overview.totalUsers, 82);
});

test("bilingual dashboard explains consent, real duration and unknown retention", () => {
  const data = {
    status: "collecting",
    source: "Google Analytics 4 Data API",
    events: [
      { event: "wonder_v1_visit", count: 3, users: 2 },
      { event: "wonder_v1_article_reading_time", count: 2, users: 1, seconds: 90 },
    ],
    content: { rows: [] },
    retention: { d1: null, d7: null },
    overview: { totalUsers: 82 },
  };
  const snapshot = { projects: [{ id: "wonderelian", name: "WonderElian", name_zh: "WonderElian", hostname: "wonderelian.com", web_only: true, status: "collecting", h5: data, legacy_h5: { overview: { totalUsers: 82 } } }] };
  const zh = usageView(snapshot, { locale: "zh", projectId: "wonderelian" });
  assert.match(zh, /授权统计访客/);
  assert.match(zh, /前台阅读分钟/);
  assert.match(zh, /历史基线/);
  assert.match(zh, />82<small>/);
  assert.match(zh, />—<\/strong>/);
  assert.doesNotMatch(zh, /播放质量/);
  const en = usageView(snapshot, { locale: "en", projectId: "wonderelian" });
  assert.match(en, /Only visitors who explicitly enable/);
  assert.match(en, /Reading quality/);
});
