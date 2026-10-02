import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { assertPublicDataSafe, sanitizePublicData } from "../src/public-sanitize.mjs";

const output = resolve("build/wonderelian-usage-20261002");
const hash = value => createHash("sha256").update(value).digest("hex");
const baseline = {};
async function live(file) {
  const response = await fetch(`https://ops.wonderelian.com/${file}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Live read failed: ${file} (${response.status})`);
  const body = await response.text();
  baseline[file] = hash(body);
  return body;
}

const state = JSON.parse(await live("data/state.json"));
const before = JSON.stringify(state.product_analytics.projects.filter(project => project.id !== "wonderelian"));
const wonder = state.product_analytics.projects.find(project => project.id === "wonderelian");
if (!wonder) throw new Error("WonderElian product usage slot is missing");
if (!wonder.legacy_h5 && wonder.h5 && !wonder.h5.surface) wonder.legacy_h5 = wonder.h5;
wonder.status = "waiting_for_events";
delete wonder.web_only;
wonder.h5 = {
  status: "waiting_for_events",
  source: "Google Analytics 4 Data API",
  surface: "h5",
  hostname: "wonderelian.com",
  period_start: null,
  period_end: null,
  verified_at: null,
  timezone: "Asia/Shanghai",
  events: [],
  daily: [],
  overview: null,
  legacy_events: [],
  data_quality: { thresholded: false, sampled: false },
  content: { status: "waiting_for_custom_dimension", rows: [] },
  retention: { d1: null, d7: null },
  revenue: { revenue: null, paid_conversions: null },
};
wonder.ios = {
  status: "waiting_for_events",
  source: "Google Analytics 4 Data API",
  surface: "ios",
  hostname: "wonderelian.com",
  period_start: null,
  period_end: null,
  verified_at: null,
  timezone: "Asia/Shanghai",
  events: [],
  daily: [],
  overview: null,
  legacy_events: [],
  data_quality: { thresholded: false, sampled: false },
  content: { status: "waiting_for_custom_dimension", rows: [] },
  retention: { d1: null, d7: null },
  revenue: { revenue: null, paid_conversions: null },
};
state.product_analytics.generated_at = new Date().toISOString();
state.audit.unshift({
  id: randomUUID(),
  at: new Date().toISOString(),
  actor: "AI COO OS",
  app_id: null,
  source: "wonderelian_product_usage",
  action: "activate_wonderelian_usage_reporting",
  result: { status: "waiting_for_events", surfaces: ["h5", "ios"] },
  status: "success",
});
if (JSON.stringify(state.product_analytics.projects.filter(project => project.id !== "wonderelian")) !== before) throw new Error("Unrelated project changed");

const safeState = sanitizePublicData(state);
assertPublicDataSafe(safeState);
const index = (await live("index.html")).replace(/app\.js\?v=[^"']+/, "app.js?v=20261002-wonder-ios-usage");
const app = (await live("app.js")).replace(/product-usage\.js\?v=[^"']+/, "product-usage.js?v=20261002-wonder-ios-usage");
const files = {
  "data/state.json": `${JSON.stringify(safeState, null, 2)}\n`,
  "index.html": index,
  "app.js": app,
  "product-usage.js": await readFile("public/product-usage.js", "utf8"),
};
await live("product-usage.js");
await mkdir(output, { recursive: true });
for (const [file, body] of Object.entries(files)) {
  await mkdir(dirname(resolve(output, file)), { recursive: true });
  await writeFile(resolve(output, file), body);
}
await writeFile(resolve(output, "SHA256SUMS"), `${Object.entries(files).map(([file, body]) => `${hash(body)}  ${file}`).join("\n")}\n`);
await writeFile(resolve(output, "BASELINE"), `${Object.entries(baseline).map(([file, digest]) => `${digest}  ${file}`).join("\n")}\n`);
console.log(`WONDERELIAN_USAGE_STAGE_READY files=${Object.keys(files).length} h5=${wonder.h5.status} ios=${wonder.ios.status}`);
