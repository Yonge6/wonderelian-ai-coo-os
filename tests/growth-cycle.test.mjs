import test from "node:test";
import assert from "node:assert/strict";
import { runGrowthDataCycle } from "../src/growth-cycle.mjs";
import { AppStoreConnectProvider } from "../src/providers/app-store-connect-provider.mjs";
import { SearchConsoleProvider } from "../src/providers/search-console-provider.mjs";
import { ProviderUnavailableError } from "../src/providers/contracts.mjs";

function state(){return {metadata:{schema_version:"3.0.0",primary_outcome:"downloads"},apps:[{id:"style-atlas",name:"Style Atlas"}],metrics:[{id:"m",app_id:"style-atlas",metric:"first_time_downloads",name:"first_time_downloads",value:24,unit:"count",period_start:"2026-05-15",period_end:"2026-08-12",source:"manual",provider:"manual",source_reference:"baseline",imported_at:"2026-08-14T00:00:00Z",verified_at:"2026-08-14T00:00:00Z",freshness:"manual",confidence:1,verification_type:"manual_verified",notes:null}],channels:[],campaigns:[],content:[],attributions:[],insights:[],actions:[],feedback:[],opportunities:[],experiments:[],providers:["app_store_connect_api","app_store_reviews_api","google_search_console_api"].map((id)=>({id,name:id,status:"blocked"})),jobs:["app_store_connect_api","app_store_reviews_api","google_search_console_api"].map((provider,index)=>({id:`job-${index}`,provider,status:"scheduled",next_run:"2026-08-15T00:00:00Z",retry_count:0})),events:[],audit:[],detections:[],executions:[],approvals:[],action_outcomes:[],learnings:[],operating_memory:[],ingestion_runs:[],cycles:[],provider_syncs:[],reconciliations:[],search_observations:[],geo_observations:[],instrumentation:[]};}

test("growth cycle isolates missing auth, retains baseline, and audits BLOCKED",async()=>{
  const current=state();const appStoreProvider=new AppStoreConnectProvider({config:{issuerId:null,keyId:null,privateKeyPath:null,bundleId:"x"}});const searchProvider=new SearchConsoleProvider({config:{siteUrl:null,accessToken:null,credentialsPath:null}});
  const result=await runGrowthDataCycle(current,{now:new Date("2026-08-14T12:00:00Z"),appStoreProvider,searchProvider});
  assert.equal(result.cycle.status,"blocked");assert.deepEqual(result.syncs.map((x)=>x.status),["blocked","blocked","blocked"]);assert.equal(current.metrics[0].value,24);assert.equal(current.detections.length,0);assert.equal(current.instrumentation[0].level,1);assert.equal(current.audit[0].status,"blocked");assert.equal(current.provider_syncs.every((x)=>x.error.message==="BLOCKED — AUTH REQUIRED"),true);assert.equal(current.jobs.every((job)=>job.status==="blocked"&&job.next_run===null),true);
});

test("one-time Apple report request blocker is distinct while zero reviews are verified",async()=>{
  const current=state();const appStoreProvider={health:async()=>({status:"configured"}),fetchAnalytics:async()=>{throw new ProviderUnavailableError("app_store_connect_api","No active report request.",{code:"REPORT_REQUEST_REQUIRED"});},fetchReviews:async()=>[]};const searchProvider=new SearchConsoleProvider({config:{siteUrl:null,accessToken:null,credentialsPath:null}});
  const result=await runGrowthDataCycle(current,{now:new Date("2026-08-14T12:00:00Z"),appStoreProvider,searchProvider});
  assert.equal(result.syncs[0].status,"blocked");assert.equal(result.syncs[0].error.message,"BLOCKED — ONE-TIME ADMIN ANALYTICS REPORT REQUEST REQUIRED");assert.equal(current.providers.find((row)=>row.id==="app_store_connect_api").authentication_status,"configured");assert.equal(current.providers.find((row)=>row.id==="app_store_connect_api").authentication_required,false);assert.equal(result.syncs[1].status,"succeeded");assert.equal(current.providers.find((row)=>row.id==="app_store_reviews_api").status,"verified_no_reviews");assert.equal(current.jobs.find((row)=>row.provider==="app_store_reviews_api").status,"scheduled");assert.notEqual(current.jobs.find((row)=>row.provider==="app_store_reviews_api").next_run,null);
});

test("successful official provider sync is marked live",async()=>{
  const current=state();const appStoreProvider={health:async()=>({status:"configured"}),fetchAnalytics:async()=>({observations:[],data_through:"2026-08-13"}),fetchReviews:async()=>[{id:"review-1",external_id:"1",app_id:"style-atlas",provider:"app_store_reviews_api",source:"official",source_reference:"review:1",rating:5,title:"Useful",text:"Helpful",territory:"USA",created_at:"2026-08-13T00:00:00Z",verified_at:"2026-08-14T00:00:00Z",imported_at:"2026-08-14T00:00:00Z",verification_type:"api_verified",sentiment:null,topic:null,severity:null,response_status:"unknown"}]};const searchProvider=new SearchConsoleProvider({config:{siteUrl:null,accessToken:null,credentialsPath:null}});
  await runGrowthDataCycle(current,{now:new Date("2026-08-14T12:00:00Z"),appStoreProvider,searchProvider});
  assert.equal(current.providers.find((row)=>row.id==="app_store_connect_api").status,"live");assert.equal(current.providers.find((row)=>row.id==="app_store_reviews_api").status,"live");
});

test("active report request without generated instances remains waiting",async()=>{
  const current=state();const appStoreProvider={health:async()=>({status:"configured"}),fetchAnalytics:async()=>{throw new ProviderUnavailableError("app_store_connect_api","Report instances are pending.",{code:"REPORT_GENERATION_PENDING"});},fetchReviews:async()=>[]};const searchProvider=new SearchConsoleProvider({config:{siteUrl:null,accessToken:null,credentialsPath:null}});
  const result=await runGrowthDataCycle(current,{now:new Date("2026-08-14T12:00:00Z"),appStoreProvider,searchProvider});const analytics=current.providers.find((row)=>row.id==="app_store_connect_api"),job=current.jobs.find((row)=>row.provider==="app_store_connect_api");
  assert.equal(result.syncs[0].status,"waiting");assert.equal(analytics.status,"waiting");assert.equal(analytics.authentication_status,"configured");assert.equal(analytics.error,"WAITING — APPLE ANALYTICS REPORT GENERATION");assert.equal(job.status,"waiting");assert.equal(job.next_run,null);
});
