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
  const growthAutomation = state.jobs.find((item) => item.id === "job-codex-ai-coo-unified");
  assert.ok(growthAutomation);
  assert.equal(growthAutomation.name_zh, "WonderElian AI COO 统一运营与 Analytics 监测");
  assert.equal(growthAutomation.schedule, "daily:03:30,09:30,15:30,20:30:Asia/Shanghai");
  assert.equal(growthAutomation.last_run, "2026-08-19T12:31:39.368Z");
  assert.equal(growthAutomation.result.verified_publications, 4);
  assert.equal(growthAutomation.result.community_replies, 3);
  assert.equal(growthAutomation.result.attributable_downloads, null);
  assert.match(script, /每天 \$\{times\}（北京时间）/);
  assert.ok(state.audit.length > 0);
  const published = state.content.filter((item) => item.status === "published");
  assert.ok(published.length > 0);
  assert.equal(published.every((item) => item.publish_url || item.url), true);
  const currentRun = published.filter((item) => item.published_at === "2026-08-19");
  assert.equal(currentRun.length, 7);
  assert.deepEqual(
    currentRun.map((item) => item.channel_id).sort(),
    ["instagram", "pinterest", "pinterest", "pinterest", "tiktok", "tiktok", "tiktok"],
  );
  assert.equal(currentRun.every((item) => item.first_time_downloads === null), true);
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
  assert.match(script, /class="evidence-url"/);
  assert.match(script, /new URL\(url\)\.hostname/);
  assert.match(script, /fmt\(item\.first_time_downloads\)/);
  assert.doesNotMatch(script, /item\.first_time_downloads\s*\?\?\s*0/);
  assert.match(script, /const contentPageSize=10/);
  assert.match(script, /function sortedPublishedContent\(\)/);
  assert.match(script, /String\(b\.published_at\?\?""\)\.localeCompare\(String\(a\.published_at\?\?""\)\)/);
  assert.match(script, /String\(b\.id\)\.localeCompare\(String\(a\.id\)\)/);
  assert.match(script, /pageItems=published\.slice\(\(contentPage-1\)\*contentPageSize,contentPage\*contentPageSize\)/);
  assert.match(script, /data-content-page=/);
  assert.match(script, /previous_page:"Previous"/);
  assert.match(script, /previous_page:"上一页"/);
  assert.ok(script.indexOf('<span>01</span><h3>${t("content_distribution")}') < script.indexOf('<span>02</span><h3>${t("scheduled_tasks")}'));
});
