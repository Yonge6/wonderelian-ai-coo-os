import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("command center ships bilingual total and per-property daily portfolio telemetry", async () => {
  const [html,script,styles]=await Promise.all([
    readFile(new URL("../public/index.html",import.meta.url),"utf8"),
    readFile(new URL("../public/app.js",import.meta.url),"utf8"),
    readFile(new URL("../public/styles.css",import.meta.url),"utf8"),
  ]);
  assert.match(html,/20260818-web-first/);
  assert.match(script,/每日组合数据/);
  assert.match(script,/Website UV/);
  assert.match(script,/App 日活/);
  assert.match(script,/brief\.daily_portfolio/);
  assert.match(script,/data-daily-date/);
  assert.match(script,/cross-site visitors may repeat/);
  assert.match(script,/app\.app_store_url/);
  assert.match(script,/tag installed — no data yet/);
  assert.match(script,/已装标签，暂无数据/);
  assert.match(styles,/\.telemetry-rack/);
  assert.match(styles,/\.telemetry-table/);
  assert.match(styles,/\.portfolio-ledgers>\.telemetry-ledger:first-child\{order:2\}/);
  assert.match(styles,/\.portfolio-ledgers>\.telemetry-ledger:last-child\{order:1\}/);
});
