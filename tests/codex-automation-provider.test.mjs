import assert from "node:assert/strict";
import test from "node:test";
import {
  dailyScheduleFromRrule,
  nextShanghaiDailyRun,
  normalizeCodexAutomation,
  parsePublicAutomationMetadata,
} from "../src/providers/codex-automation-provider.mjs";

const source = `
id = "style-atlas-analytics"
kind = "heartbeat"
name = "WonderElian AI COO 一休冥想增长与 Analytics 监测"
prompt = "private operating instructions"
status = "ACTIVE"
rrule = "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=3,9,15,20;BYMINUTE=30"
target_thread_id = "private-thread"
`;

test("Codex automation adapter only reads allowlisted public metadata", () => {
  const metadata = parsePublicAutomationMetadata(source);
  assert.deepEqual(Object.keys(metadata).sort(), ["id", "kind", "name", "rrule", "status"]);
  assert.equal(JSON.stringify(metadata).includes("private"), false);
});

test("daily Beijing automation is normalized without prompt or thread metadata", () => {
  const metadata = parsePublicAutomationMetadata(source);
  const job = normalizeCodexAutomation(metadata, {
    now: new Date("2026-08-18T03:00:00.000Z"),
    lastRun: "2026-08-17T12:59:00.000Z",
    result: { verified_publications: 4, attributable_downloads: null },
  });
  assert.equal(dailyScheduleFromRrule(metadata.rrule), "daily:03:30,09:30,15:30,20:30:Asia/Shanghai");
  assert.equal(nextShanghaiDailyRun(job.schedule, new Date("2026-08-18T03:00:00.000Z")), "2026-08-18T07:30:00.000Z");
  assert.equal(job.status, "scheduled");
  assert.equal(job.name_zh, "WonderElian AI COO 一休冥想增长与 Analytics 监测");
  assert.equal(job.app_id, "yixiu-meditation");
  assert.equal(job.result.attributable_downloads, null);
  assert.equal(JSON.stringify(job).includes("private"), false);
});

test("adapter rejects unrelated Codex automations", () => {
  assert.throws(
    () => normalizeCodexAutomation({ ...parsePublicAutomationMetadata(source), id: "another-app" }),
    /Only the approved unified AI COO automation/,
  );
});
