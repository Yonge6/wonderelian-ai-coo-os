import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("existing publication evidence, manual baselines and product priority remain intact",async()=>{
  const state=JSON.parse(await readFile(new URL("../public/data/state.json",import.meta.url),"utf8"));
  assert.equal(state.apps.find(x=>x.id==="yixiu-meditation").promotion_status,"active_highest_priority");
  assert.equal(state.apps.find(x=>x.id==="style-atlas").promotion_status,"paused_by_owner");
  assert.equal(state.providers.find(x=>x.id==="app_store_connect_api").status,"waiting");
  assert.ok(state.content.filter(x=>x.status==="published").every(x=>x.publish_url||x.url));
  assert.ok(state.metrics.some(x=>(x.metric??x.name)==="first_time_downloads"&&x.value===24&&x.period_end==="2026-08-12"));
});

test("operations history keeps audit and job paging without implying a live scheduler",async()=>{
  const script=await readFile(new URL("../public/app.js",import.meta.url),"utf8");
  assert.match(script,/state\.audit\.slice\(\)\.sort/);
  assert.match(script,/pages\.audit\.items\.map\(auditRow\)/);
  assert.match(script,/pages\.jobs\.items\.map\(jobRow\)/);
  assert.match(script,/<details class="archive-panel" data-activity-section="jobs">/);
  assert.match(script,/<details class="archive-panel" data-activity-section="cycles">/);
  assert.match(script,/不是实时调度器/);
  assert.match(script,/target="_blank" rel="noreferrer"/);
  assert.match(script,/item\.app_store_campaign_url/);
});
