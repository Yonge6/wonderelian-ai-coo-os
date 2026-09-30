import test from "node:test";
import assert from "node:assert/strict";
import { normalizeUsageEvents, pendingProductSnapshot, ProductAnalyticsProvider } from "../src/providers/product-analytics-provider.mjs";
import { syncProductAnalyticsState } from "../src/sync-product-analytics.mjs";
test("six projects, no fabricated metrics", () => {
  const snapshot = pendingProductSnapshot();
  assert.equal(snapshot.projects.length, 6);
  assert.ok(snapshot.projects.every(p => p.h5 === null && p.ios === null));
});
test("old playback clicks never become confirmed starts or seconds", () => {
  const report = { dimensionHeaders: [{name:"eventName"}], metricHeaders: [{name:"eventCount"},{name:"totalUsers"},{name:"eventValue"}], rows: [
    {dimensionValues:[{value:"yixiu_playback_start"}],metricValues:[{value:"100"},{value:"10"},{value:"0"}]},
    {dimensionValues:[{value:"yixiu_v2_listen_time"}],metricValues:[{value:"2"},{value:"1"},{value:"45.5"}]},
  ] };
  assert.deepEqual(normalizeUsageEvents(report), [{event:"yixiu_v2_listen_time",count:2,users:1,seconds:45.5}]);
});
test("failure preserves last evidence and never invents zero", async () => {
  const state = {audit:[],product_analytics:{projects:[{id:"yixiu",h5:{events:[{event:"x",count:3}],verified_at:"2026-09-01"}}]}};
  const result = await syncProductAnalyticsState(state,{provider:{health:async()=>({status:"blocked"})},now:new Date("2026-09-30T04:00:00Z")});
  assert.equal(result.projects[0].h5.status,"unavailable");
  assert.equal(result.projects[0].h5.events[0].count,3);
  assert.equal(result.projects[0].h5.verified_at,"2026-09-01");
});
test("every report scopes to exact Yixiu hostname", async () => {
  const calls=[]; const provider=new ProductAnalyticsProvider();
  provider.runReport=async options=>{calls.push(options);return {rows:[],metadata:{timeZone:"Asia/Shanghai"}};};
  const r=await provider.fetchUsage({startDate:"2026-09-01",endDate:"2026-09-29"});
  assert.ok(calls.every(c=>c.dimensionFilter.filter.stringFilter.matchType==="EXACT" && c.dimensionFilter.filter.stringFilter.value==="yixiu.wonderelian.com"));
  assert.equal(r.status,"waiting_for_events");
  assert.equal(r.retention.d7,null);
});
test("native reports are restricted to the configured iOS stream", async () => {
  const calls=[]; const provider=new ProductAnalyticsProvider();
  provider.runReport=async options=>{calls.push(options);return {rows:[]};};
  await provider.fetchUsage({startDate:"2026-09-01",endDate:"2026-09-29",iosStreamId:"12345"});
  assert.ok(calls.every(c=>c.dimensionFilter.andGroup.expressions.some(e=>e.filter.fieldName==="streamId"&&e.filter.stringFilter.value==="12345")));
  assert.ok(calls.every(c=>c.dimensionFilter.andGroup.expressions.some(e=>e.filter.fieldName==="platform"&&e.filter.stringFilter.value==="iOS")));
  await assert.rejects(provider.fetchUsage({iosStreamId:"not-an-id"}),{code:"INVALID_STREAM"});
});
test("failed content dimension query preserves previous sound observations", async () => {
  const state={audit:[],product_analytics:{projects:[{id:"yixiu",h5:{content:{rows:[{scene:"rain",seconds:45}]}}}]}};
  const provider={health:async()=>({status:"configured"}),fetchUsage:async()=>({status:"waiting_for_events",content:{error_code:"DENIED",rows:[]}})};
  const result=await syncProductAnalyticsState(state,{provider,iosStreamId:null});
  assert.equal(result.projects[0].h5.content.rows[0].seconds,45);
  assert.equal(result.projects[0].h5.content.status,"unavailable");
});
