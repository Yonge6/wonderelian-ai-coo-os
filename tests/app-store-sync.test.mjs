import test from "node:test";
import assert from "node:assert/strict";
import { syncAppStoreAnalyticsState, TRACKED_APP_BUNDLES } from "../src/sync-app-store-analytics.mjs";

function state(){return{metadata:{data_through:{}},metrics:[],providers:[{id:"app_store_connect_api",status:"waiting",app_ids:["style-atlas"]}],jobs:[],provider_syncs:[],audit:[]};}

test("portfolio App Store sync keeps a separate cutoff for each tracked App",async()=>{
  const current=state(),catalogProvider={health:async()=>({status:"configured"}),requestAll:async()=>[...TRACKED_APP_BUNDLES].map(([appId,bundleId])=>({id:"asc-"+appId,attributes:{bundleId}}))};
  const providerFactory=({appId})=>({fetchAnalytics:async()=>{
    if(appId!=="style-atlas"){const error=new Error("pending");error.code="REPORT_GENERATION_PENDING";throw error;}
    return{data_through:"2026-09-20",reports_considered:2,observations:[{app_id:appId,metric:"first_time_downloads",name:"first_time_downloads",value:1,unit:"count",period_start:"2026-09-20",period_end:"2026-09-20",source:"App Store Connect Analytics Reports API",provider:"app_store_connect_api",source_reference:"analyticsReport:App Downloads Standard",imported_at:"2026-09-23T00:00:00Z",verified_at:"2026-09-23T00:00:00Z",freshness:"fresh",confidence:1,verification_type:"api_verified",dimensions:{territory:"US"},notes:"Official observation."}]};
  }});
  const result=await syncAppStoreAnalyticsState(current,{catalogProvider,providerFactory,now:new Date("2026-09-23T00:00:00Z")});
  assert.equal(result.status,"partial");
  assert.equal(current.metadata.data_through.app_store,"2026-09-20");
  assert.equal(current.metadata.data_through.app_store_apps["style-atlas"],"2026-09-20");
  assert.equal(current.metadata.data_through.app_store_apps["yixiu-meditation"],null);
  assert.equal(current.metrics.length,1);
  assert.equal(current.providers[0].app_ids.length,5);
  assert.equal(current.provider_syncs.length,5);
  assert.equal(current.jobs.length,5);
});
