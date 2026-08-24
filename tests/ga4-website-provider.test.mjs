import assert from "node:assert/strict";
import test from "node:test";
import { Ga4WebsiteProvider, normalizeGa4Reports } from "../src/providers/ga4-website-provider.mjs";
import { syncWebsiteAnalyticsState } from "../src/sync-website-analytics.mjs";

const websites=[{id:"site-style-atlas",url:"https://style-atlas.wonderelian.com/",analytics_status:"tag_detected",primary_conversion:"app_store_download"}];
const report=(dimensions,metrics,rows)=>({dimensionHeaders:dimensions.map((name)=>({name})),metricHeaders:metrics.map((name)=>({name,type:"TYPE_INTEGER"})),rows:rows.map(([dimensionValues,metricValues])=>({dimensionValues:dimensionValues.map((value)=>({value})),metricValues:metricValues.map((value)=>({value:String(value)}))}))});

test("GA4 normalization keeps hostname dimensions and verified primary events",()=>{
  const observations=normalizeGa4Reports({
    overview:report(["date","hostName"],["screenPageViews","activeUsers","sessions"],[[["20260815","style-atlas.wonderelian.com"],[12,8,9]]]),
    sources:report(["date","hostName","sessionSourceMedium"],["sessions"],[[["20260815","style-atlas.wonderelian.com","google / organic"],[4]]]),
    landing_pages:report(["date","hostName","landingPagePlusQueryString"],["sessions"],[]),
    geo_device:report(["date","hostName","country","deviceCategory"],["activeUsers"],[]),
    events:report(["date","hostName","eventName"],["eventCount"],[[["20260815","style-atlas.wonderelian.com","app_store_download"],[3]],[ ["20260815","unknown.example","page_view"],[99]]]),
  },{websites,propertyId:"123",now:"2026-08-16T00:00:00.000Z"});
  assert.deepEqual(observations.filter((row)=>["page_views","active_users","sessions"].includes(row.metric)).map((row)=>[row.metric,row.value]),[["page_views",12],["active_users",8],["sessions",9]]);
  assert.equal(observations.find((row)=>row.metric==="traffic_source_sessions")?.dimensions.source_medium,"google / organic");
  assert.equal(observations.find((row)=>row.metric==="app_store_download")?.value,3);
  assert.equal(observations.find((row)=>row.metric==="cta_clicks")?.value,3);
  assert.equal(observations.every((row)=>row.verification_type==="api_verified"),true);
});

test("GA4 normalization supports the Maker Business Lab recommendation event",()=>{
  const makerWebsites=[{id:"site-maker-business-lab",url:"https://maker.wonderelian.com/",analytics_status:"tag_detected",primary_conversion:"recommendation_click"}];
  const observations=normalizeGa4Reports({
    events:report(["date","hostName","eventName"],["eventCount"],[[["20260821","maker.wonderelian.com","recommendation_click"],[2]]]),
  },{websites:makerWebsites,propertyId:"123",now:"2026-08-21T10:00:00.000Z"});
  assert.equal(observations.find((row)=>row.metric==="recommendation_click")?.value,2);
  assert.equal(observations.find((row)=>row.metric==="cta_clicks")?.value,2);
});

test("GA4 normalization counts the Yixiu App Store click as a primary CTA",()=>{
  const yixiuWebsites=[{id:"site-yixiu",url:"https://yixiu.wonderelian.com/",analytics_status:"connected",primary_conversion:"app_discovery"}];
  const observations=normalizeGa4Reports({
    events:report(["date","hostName","eventName"],["eventCount"],[[["20260823","yixiu.wonderelian.com","yixiu_download_click"],[4]]]),
  },{websites:yixiuWebsites,propertyId:"123",now:"2026-08-24T00:00:00.000Z"});
  assert.equal(observations.find((row)=>row.metric==="yixiu_download_click")?.value,4);
  assert.equal(observations.find((row)=>row.metric==="cta_clicks")?.value,4);
});

test("GA4 provider uses the official endpoint and a read-only report body",async()=>{
  const requests=[];const fetchFn=async(url,options)=>{requests.push({url,body:JSON.parse(options.body)});return new Response(JSON.stringify(report(["date","hostName"],["screenPageViews"],[])),{status:200,headers:{"content-type":"application/json"}});};
  const provider=new Ga4WebsiteProvider({config:{propertyId:"123",accessToken:"test-token",credentialsPath:null},fetchFn,tokenFactory:async()=>"test-token"});
  assert.equal((await provider.health()).status,"configured");
  await provider.runReport({dimensions:["date","hostName"],metrics:["screenPageViews"],startDate:"2026-08-01",endDate:"2026-08-15"});
  assert.equal(requests[0].url,"https://analyticsdata.googleapis.com/v1beta/properties/123:runReport");
  assert.equal(requests[0].body.offset,"0");
  assert.equal(requests[0].body.keepEmptyRows,false);
});

test("website sync waits on empty reports and never invents zero",async()=>{
  const state={metadata:{data_through:{}},websites:structuredClone(websites),website_metrics:[],provider_syncs:[],providers:[{id:"website_analytics_api",status:"not_connected"}],jobs:[{provider:"website_analytics_api",status:"blocked"}],audit:[]};
  const provider={health:async()=>({status:"configured"}),fetchPerformance:async()=>({observations:[],data_through:null})};
  const result=await syncWebsiteAnalyticsState(state,{provider,now:new Date("2026-08-16T00:00:00.000Z")});
  assert.equal(result.status,"waiting");
  assert.equal(state.website_metrics.length,0);
  assert.equal(state.providers[0].status,"waiting");
  assert.equal(state.websites[0].analytics_status,"tag_detected");
  assert.equal(state.provider_syncs[0].records_received,0);
});

test("website sync uses the latest complete Beijing calendar day",async()=>{
  const state={metadata:{data_through:{}},websites:structuredClone(websites),website_metrics:[],provider_syncs:[],providers:[{id:"website_analytics_api",status:"not_connected"}],jobs:[{provider:"website_analytics_api",status:"blocked"}],audit:[]};
  let requested=null;
  const provider={
    health:async()=>({status:"configured"}),
    fetchPerformance:async(input)=>{requested=input;return{observations:[],data_through:null};},
  };
  await syncWebsiteAnalyticsState(state,{provider,now:new Date("2026-08-19T23:30:00.000Z")});
  assert.equal(requested.startDate,"2026-05-22");
  assert.equal(requested.endDate,"2026-08-19");
  assert.equal(state.provider_syncs[0].period_end,"2026-08-19");
});

test("website sync records rejected property access without overwriting unknown metrics",async()=>{
  const state={metadata:{data_through:{}},websites:structuredClone(websites),website_metrics:[],provider_syncs:[],providers:[{id:"website_analytics_api",status:"not_connected"}],jobs:[{provider:"website_analytics_api",status:"blocked"}],audit:[]};
  const provider={health:async()=>({status:"configured"}),fetchPerformance:async()=>{const error=new Error("forbidden");error.code="AUTH_REJECTED";throw error;}};
  const result=await syncWebsiteAnalyticsState(state,{provider,now:new Date("2026-08-16T00:00:00.000Z")});
  assert.equal(result.status,"blocked");
  assert.equal(state.website_metrics.length,0);
  assert.equal(state.providers[0].status,"blocked");
  assert.equal(state.providers[0].error,"BLOCKED — GA4 PROPERTY VIEWER ACCESS REQUIRED");
  assert.equal(state.websites[0].analytics_status,"tag_detected");
  assert.equal(state.provider_syncs[0].records_received,0);
  assert.equal(state.audit[0].status,"blocked");
});

test("website sync imports observations idempotently and connects only observed hosts",async()=>{
  const row={website_id:"site-style-atlas",metric:"page_views",name:"page_views",value:12,unit:"count",period_start:"2026-08-15",period_end:"2026-08-15",dimensions:{hostname:"style-atlas.wonderelian.com"},provider:"website_analytics_api",source:"Google Analytics 4 Data API",source_reference:"ga4:overview",imported_at:"2026-08-16T00:00:00.000Z",verified_at:"2026-08-16T00:00:00.000Z",verification_type:"api_verified",freshness:"fresh",confidence:1};
  const state={metadata:{data_through:{}},websites:structuredClone(websites),website_metrics:[],provider_syncs:[],providers:[{id:"website_analytics_api",status:"not_connected"}],jobs:[{provider:"website_analytics_api",status:"blocked",retry_count:0}],audit:[]};
  const provider={health:async()=>({status:"configured"}),fetchPerformance:async()=>({observations:[row],data_through:"2026-08-15"})};
  const first=await syncWebsiteAnalyticsState(state,{provider,now:new Date("2026-08-16T00:00:00.000Z")});const second=await syncWebsiteAnalyticsState(state,{provider,now:new Date("2026-08-16T01:00:00.000Z")});
  assert.equal(first.inserted,1);assert.equal(second.unchanged,1);assert.equal(state.website_metrics.length,1);assert.equal(state.providers[0].status,"live");assert.equal(state.websites[0].analytics_status,"connected");assert.equal(state.metadata.data_through.website_analytics,"2026-08-15");
});
