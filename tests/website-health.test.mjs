import assert from "node:assert/strict";
import test from "node:test";
import { inspectWebsiteHtml, WebsiteHealthProvider } from "../src/providers/website-health-provider.mjs";
import { generateBrief, validateState } from "../src/domain.mjs";
import { readFile } from "node:fs/promises";

test("website HTML inspection separates SEO readiness from analytics availability", () => {
  const result = inspectWebsiteHtml(`<!doctype html><html lang="en"><head>
    <title>Example</title><meta name="description" content="Useful page">
    <link href="https://example.com/" rel="canonical">
    <meta content="Example share" property="og:title"><script type="application/ld+json">{}</script>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-TEST"></script>
  </head><body><h1>Example heading</h1><a href="https://apps.apple.com/app/id1">Download</a></body></html>`);
  assert.equal(result.lang, "en");
  assert.equal(result.canonical, "https://example.com/");
  assert.equal(result.analytics_detected, true);
  assert.equal(result.app_store_link_count, 1);
});

test("website provider records unavailable values without inventing traffic", async () => {
  const responses = new Map([
    ["https://example.com/", new Response("<html lang='en'><title>Example</title><h1>Example</h1></html>", { status:200, headers:{"content-type":"text/html"} })],
    ["https://example.com/robots.txt", new Response("User-agent: *\nAllow: /", { status:200 })],
    ["https://example.com/sitemap.xml", new Response("<urlset></urlset>", { status:200 })],
  ]);
  const provider = new WebsiteHealthProvider({ fetchFn:async (url) => responses.get(String(url)) });
  const result = await provider.fetchAll([{id:"example", app_id:null, url:"https://example.com/"}], {now:"2026-08-14T23:30:00.000Z"});
  assert.equal(result.data_through, "2026-08-15");
  assert.equal(result.observations[0].reachable, true);
  assert.equal(result.observations[0].analytics_detected, false);
  assert.equal("page_views" in result.observations[0], false);
});

test("production state registers six operated websites and preserves traffic as unavailable", async () => {
  const state = validateState(JSON.parse(await readFile(new URL("../data/state.json", import.meta.url), "utf8")));
  assert.equal(state.websites.length, 6);
  assert.equal(state.website_operations.length, 6);
  assert.equal(state.website_metrics.length, 0);
  assert.equal(state.providers.find((row) => row.id === "public_website_health")?.status, "live");
  assert.equal(state.providers.find((row) => row.id === "website_analytics_api")?.status, "not_connected");
  const brief = generateBrief(state);
  assert.deepEqual(brief.website_summary, {
    sites_tracked:6,
    sites_live:6,
    analytics_connected:0,
    traffic_metrics_available:0,
    data_through:"2026-08-15",
  });
  assert.equal(brief.portfolio_summary, "5 apps and 6 websites are tracked. 1 of 5 apps currently reports the primary outcome; recommendations are qualified by data coverage.");
  assert.equal(brief.portfolio_summary_zh, "已追踪 5 个应用和 6 个网站。目前 1 个应用上报北极星指标；所有建议均受数据覆盖度约束。");
});
