import test from "node:test";
import assert from "node:assert/strict";
import { attributionConfidence, detectSearchOpportunities, ingestMetrics, instrumentationMaturity, providerFreshness, reconcileMetrics, reviewOpportunities } from "../src/growth-data.mjs";

const metric=(type,value,provider="p")=>({app_id:"a",metric:"first_time_downloads",name:"first_time_downloads",value,unit:"count",period_start:"2026-08-01",period_end:"2026-08-12",source:type,provider,source_reference:`${type}:1`,imported_at:"2026-08-14T00:00:00Z",verified_at:"2026-08-14T00:00:00Z",freshness:type==="manual_verified"?"manual":"fresh",confidence:1,verification_type:type,notes:null});

test("metric ingestion is idempotent on stable provenance identity",()=>{
  const state={metrics:[]};const first=ingestMetrics(state,[metric("api_verified",3)]),second=ingestMetrics(state,[metric("api_verified",3)]);
  assert.equal(first.inserted,1);assert.equal(second.unchanged,1);assert.equal(state.metrics.length,1);
});

test("manual and API observations reconcile explicitly without overwrite",()=>{
  const state={metrics:[],reconciliations:[]};ingestMetrics(state,[metric("manual_verified",24,"manual"),metric("api_verified",25,"app_store_connect_api")]);const result=reconcileMetrics(state,{appId:"a"});
  assert.equal(result.mismatches,1);assert.equal(state.metrics.length,2);assert.equal(state.reconciliations[0].delta,1);
});

test("freshness distinguishes expected delay from stale and blocked",()=>{
  const sla={expected_latency_hours:48,stale_after_hours:96},now=new Date("2026-08-14T00:00:00Z");
  assert.equal(providerFreshness({dataThrough:"2026-08-12T12:00:00Z",now,sla}).status,"healthy");
  assert.equal(providerFreshness({dataThrough:"2026-08-11T00:00:00Z",now,sla}).status,"delayed");
  assert.equal(providerFreshness({dataThrough:null,status:"blocked",now,sla}).status,"blocked");
});

test("search opportunities require evidence thresholds",()=>{
  const small=[{query:"q",page:"p",impressions:10,clicks:0,ctr:0,position:8}];assert.equal(detectSearchOpportunities(small).length,0);
  const enough=[{query:"q",page:"p",impressions:100,clicks:1,ctr:.01,position:8}];assert.deepEqual(detectSearchOpportunities(enough).map((x)=>x.type),["high_impressions_low_ctr","position_5_15"]);
});

test("isolated negative review does not create a product opportunity",()=>{
  const one=[{id:"1",app_id:"a",rating:1,title:"Crash",text:"crash",source_reference:"r1"}];assert.equal(reviewOpportunities(one).length,0);
  const two=[...one,{id:"2",app_id:"a",rating:2,title:"Bug",text:"broken",source_reference:"r2"}];assert.equal(reviewOpportunities(two).length,1);
});

test("attribution confidence and instrumentation never overstate missing outcomes",()=>{
  assert.equal(attributionConfidence({publish_url:"p",landing_url:"l",app_store_campaign_url:"s",first_time_downloads:null}),"partial");
  const state={metrics:[metric("manual_verified",24,"manual")],search_observations:[],attributions:[],learnings:[]};assert.equal(instrumentationMaturity(state,"a"),1);
});
