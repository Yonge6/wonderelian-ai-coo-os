import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("command center ships an evidence-backed bilingual daily operations module", async () => {
  const [script, styles, stateText] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/styles.css", import.meta.url), "utf8"),
    readFile(new URL("../public/data/state.json", import.meta.url), "utf8"),
  ]);
  const state = JSON.parse(stateText);

  assert.match(script, /daily_operations:"Daily Operations"/);
  assert.match(script, /daily_operations:"今日运营执行"/);
  assert.match(script, /activity:"Operations Log"/);
  assert.match(script, /activity:"运营日志"/);
  assert.match(script, /function dailyOperations\(\)/);
  assert.match(script, /function latestOperatingDay\(\)/);
  assert.match(script, /function permanentContentUrl\(item\)/);
  assert.match(script, /function attributionCompleteness\(item\)/);
  assert.match(script, /\$\{dailyOperations\(\)\}\s*\$\{phaseGate\(\)\}/);
  assert.match(script, /state\.jobs\.map\(jobRow\)/);
  assert.match(script, /state\.audit\.map\(auditRow\)/);
  assert.match(script, /state\.content\.filter\(publishedWithEvidence\)/);
  assert.match(styles, /\.operations-rack/);
  assert.match(styles, /\.operation-timeline/);
  assert.match(styles, /\.distribution-ledger/);

  assert.ok(state.jobs.length > 0);
  assert.ok(state.audit.length > 0);
  const published = state.content.filter((item) => item.status === "published");
  assert.ok(published.length > 0);
  assert.equal(published.every((item) => item.publish_url || item.url), true);
});

test("operations log exposes schedules, verified outcomes, permanent URLs, and null-safe attribution", async () => {
  const script = await readFile(new URL("../public/app.js", import.meta.url), "utf8");

  assert.match(script, /scheduled_tasks:"Scheduled tasks"/);
  assert.match(script, /scheduled_tasks:"定时任务"/);
  assert.match(script, /verified_outcomes:"Verified outcomes"/);
  assert.match(script, /verified_outcomes:"已验证成果"/);
  assert.match(script, /content_distribution:"Content distribution"/);
  assert.match(script, /content_distribution:"内容分发"/);
  assert.match(script, /permanent_url:"Permanent URL"/);
  assert.match(script, /permanent_url:"永久公开链接"/);
  assert.match(script, /attribution_path:"Attribution path"/);
  assert.match(script, /attribution_path:"归因链路"/);
  assert.match(script, /target="_blank" rel="noreferrer"/);
  assert.match(script, /fmt\(item\.first_time_downloads\)/);
  assert.doesNotMatch(script, /item\.first_time_downloads\s*\?\?\s*0/);
});
