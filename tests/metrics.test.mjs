import test from "node:test";
import assert from "node:assert/strict";
import { calculateAttributionCoverage, calculateDataHealth, normalizeMetricRecord, observationAge, validateAttributionRecord } from "../src/metrics.mjs";

const metric=(overrides={})=>normalizeMetricRecord({ app_id:"a",metric:"first_time_downloads",value:null,unit:"count",period_start:"2026-08-01",period_end:"2026-08-07",source:"verified snapshot",provider:"manual",source_reference:"report:1",imported_at:"2026-08-08T00:00:00Z",verified_at:"2026-08-08T00:00:00Z",freshness:"manual",confidence:1,notes:null,...overrides },{id:overrides.id??"m",now:"2026-08-08T00:00:00Z"});

test("normalized metrics preserve missing as null and require provenance",()=>{
  const row=metric();assert.equal(row.value,null);assert.equal(row.metric,"first_time_downloads");assert.equal(row.source_reference,"report:1");
  assert.throws(()=>normalizeMetricRecord({app_id:"a",metric:"x",value:0,period_start:"2026-01-01",period_end:"2026-01-02",provider:"p"}),/source provenance/);
});

test("observation age distinguishes fresh and stale records",()=>{
  assert.equal(observationAge(metric(),new Date("2026-08-09T00:00:00Z")).age_state,"fresh");
  assert.equal(observationAge(metric(),new Date("2026-08-20T00:00:00Z")).age_state,"stale");
});

test("data health reports missing critical metrics and does not call them zero",()=>{
  const state={apps:[{id:"a",platforms:["iOS"],kpis:["first_time_downloads","revenue"]}],metrics:[metric()],content:[],providers:[{id:"manual",app_ids:["a"],status:"available",freshness:"manual"}],jobs:[]};
  const health=calculateDataHealth(state,{now:new Date("2026-08-09T00:00:00Z")})[0];
  assert.deepEqual(health.missing_critical_metrics,["first_time_downloads","revenue"]);assert.equal(health.coverage_score<100,true);
});

test("attribution tracks linked and measured coverage independently",()=>{
  const state={content:[{app_id:"a",status:"published",campaign_id:"c",landing_url:"https://landing",app_store_campaign_url:"https://store",publish_url:"https://post",first_time_downloads:null},{app_id:"a",status:"published",campaign_id:null,first_time_downloads:null}]};
  assert.deepEqual(calculateAttributionCoverage(state,"a"),{published_assets:2,linked_assets:1,measured_assets:0,link_coverage:50,outcome_coverage:0});
  assert.doesNotThrow(()=>validateAttributionRecord({content_id:"x",campaign_id:"c",source:"x",medium:"organic",content:"a",landing_url:"https://a",app_store_campaign_url:"https://b",publish_url:"https://c",first_time_downloads:null}));
});
