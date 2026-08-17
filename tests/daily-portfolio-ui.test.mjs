import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("command center ships bilingual total and per-property daily portfolio telemetry", async () => {
  const [html,script,styles]=await Promise.all([
    readFile(new URL("../public/index.html",import.meta.url),"utf8"),
    readFile(new URL("../public/app.js",import.meta.url),"utf8"),
    readFile(new URL("../public/styles.css",import.meta.url),"utf8"),
  ]);
  assert.match(html,/20260817-daily-portfolio/);
  assert.match(script,/每日组合数据/);
  assert.match(script,/Website UV/);
  assert.match(script,/App 日活/);
  assert.match(script,/brief\.daily_portfolio/);
  assert.match(script,/data-daily-date/);
  assert.match(script,/cross-site visitors may repeat/);
  assert.match(styles,/\.telemetry-rack/);
  assert.match(styles,/\.telemetry-table/);
});
