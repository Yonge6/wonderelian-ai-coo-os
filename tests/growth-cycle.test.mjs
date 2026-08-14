import test from "node:test";
import assert from "node:assert/strict";
import { runGrowthDataCycle } from "../src/growth-cycle.mjs";
import { AppStoreConnectProvider } from "../src/providers/app-store-connect-provider.mjs";
import { SearchConsoleProvider } from "../src/providers/search-console-provider.mjs";

function state(){return {metadata:{schema_version:"3.0.0",primary_outcome:"downloads"},apps:[{id:"style-atlas",name:"Style Atlas"}],metrics:[{id:"m",app_id:"style-atlas",metric:"first_time_downloads",name:"first_time_downloads",value:24,unit:"count",period_start:"2026-05-15",period_end:"2026-08-12",source:"manual",provider:"manual",source_reference:"baseline",imported_at:"2026-08-14T00:00:00Z",verified_at:"2026-08-14T00:00:00Z",freshness:"manual",confidence:1,verification_type:"manual_verified",notes:null}],channels:[],campaigns:[],content:[],attributions:[],insights:[],actions:[],feedback:[],opportunities:[],experiments:[],providers:["app_store_connect_api","app_store_reviews_api","google_search_console_api"].map((id)=>({id,name:id,status:"blocked"})),jobs:[],events:[],audit:[],detections:[],executions:[],approvals:[],action_outcomes:[],learnings:[],operating_memory:[],ingestion_runs:[],cycles:[],provider_syncs:[],reconciliations:[],search_observations:[],geo_observations:[],instrumentation:[]};}

test("growth cycle isolates missing auth, retains baseline, and audits BLOCKED",async()=>{
  const current=state();const appStoreProvider=new AppStoreConnectProvider({config:{issuerId:null,keyId:null,privateKeyPath:null,bundleId:"x"}});const searchProvider=new SearchConsoleProvider({config:{siteUrl:null,accessToken:null,credentialsPath:null}});
  const result=await runGrowthDataCycle(current,{now:new Date("2026-08-14T12:00:00Z"),appStoreProvider,searchProvider});
  assert.equal(result.cycle.status,"blocked");assert.deepEqual(result.syncs.map((x)=>x.status),["blocked","blocked","blocked"]);assert.equal(current.metrics[0].value,24);assert.equal(current.detections.length,0);assert.equal(current.instrumentation[0].level,1);assert.equal(current.audit[0].status,"blocked");assert.equal(current.provider_syncs.every((x)=>x.error.message==="BLOCKED — AUTH REQUIRED"),true);
});
