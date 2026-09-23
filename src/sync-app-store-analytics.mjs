import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";
import { ingestMetrics, providerFreshness, PROVIDER_SLAS } from "./growth-data.mjs";
import { AppStoreConnectProvider } from "./providers/app-store-connect-provider.mjs";
import { appleConfig } from "./providers/auth.mjs";

export const TRACKED_APP_BUNDLES = new Map([
  ["style-atlas", "com.xiazishuo.styleatlas"],
  ["yixiu-meditation", "com.health.yixiu"],
  ["know-yourself", "com.yonge6.buerwithin"],
  ["wendao", "com.yonge6.wendao"],
  ["xiazi-yesterdays-world", "com.xiazishuo.app"],
]);

const safeError = (error) => ({
  code:error?.code ?? "PROVIDER_UNAVAILABLE",
  message:error?.code === "REPORT_GENERATION_PENDING"
    ? "WAITING — APPLE ANALYTICS REPORT GENERATION"
    : error?.code === "REPORT_REQUEST_REQUIRED"
      ? "WAITING — APPLE ANALYTICS REPORT REQUEST REQUIRED"
      : error?.code === "DUPLICATE_REPORT_REQUESTS"
        ? "BLOCKED — DUPLICATE APPLE ANALYTICS REPORT REQUESTS"
        : "UNAVAILABLE — APPLE ANALYTICS API REQUEST FAILED",
});

function appendSync(state,{appId,at,status,counts={received:0,inserted:0,updated:0,unchanged:0},dataThrough=null,error=null}){
  state.provider_syncs.push({
    id:`sync-app_store_connect_api-${appId}-${at.replace(/[:.]/g,"-")}`,
    app_id:appId,
    provider:"app_store_connect_api",
    period_start:null,
    period_end:dataThrough,
    started_at:at,
    completed_at:at,
    status,
    records_received:counts.received,
    records_inserted:counts.inserted,
    records_updated:counts.updated,
    records_unchanged:counts.unchanged,
    data_through:dataThrough,
    error,
  });
}

function upsertJob(state,{appId,at,status,counts,dataThrough,error}){
  const id=`job-import-app-store-analytics-${appId}`;
  let job=state.jobs.find((item)=>item.id===id);
  if(!job){job={id,type:"import_app_store_analytics",provider:"app_store_connect_api",app_id:appId,schedule:"every:1d",last_run:null,next_run:null,status:"scheduled",duration:null,result:null,error:null,retry_count:0};state.jobs.push(job);}
  Object.assign(job,{last_run:at,next_run:status==="succeeded"?new Date(new Date(at).getTime()+86_400_000).toISOString():null,status:status==="succeeded"?"scheduled":status,result:status==="succeeded"?{records_received:counts.received,records_inserted:counts.inserted,records_updated:counts.updated,data_through:dataThrough}:null,error:error?.message??null,retry_count:status==="unavailable"?(job.retry_count??0)+1:job.retry_count??0});
}

export async function syncAppStoreAnalyticsState(state,{catalogProvider=new AppStoreConnectProvider(),providerFactory,now=new Date()}={}){
  const at=now.toISOString(),health=await catalogProvider.health();
  if(health.status==="blocked")return {status:"blocked",apps:[],missing:health.missing};
  const baseConfig=appleConfig(),apps=await catalogProvider.requestAll("/v1/apps?limit=200");
  const byBundle=new Map(apps.map((app)=>[app.attributes?.bundleId,app]));
  const makeProvider=providerFactory??(({ascAppId})=>new AppStoreConnectProvider({config:{...baseConfig,appId:ascAppId,bundleId:null}}));
  const outcomes=[],dataThroughByApp={};

  for(const [appId,bundleId] of TRACKED_APP_BUNDLES){
    const ascApp=byBundle.get(bundleId);
    if(!ascApp){
      const error={code:"APP_NOT_RESOLVED",message:"UNAVAILABLE — TRACKED APP NOT RESOLVED"};
      appendSync(state,{appId,at,status:"unavailable",error});upsertJob(state,{appId,at,status:"unavailable",counts:{received:0,inserted:0,updated:0,unchanged:0},dataThrough:null,error});
      outcomes.push({app_id:appId,status:"unavailable",records_received:0,data_through:null,error:error.message});dataThroughByApp[appId]=null;continue;
    }
    try{
      const result=await makeProvider({appId,ascAppId:ascApp.id,bundleId}).fetchAnalytics({appId,now:at});
      const counts=ingestMetrics(state,result.observations);
      appendSync(state,{appId,at,status:"succeeded",counts,dataThrough:result.data_through});upsertJob(state,{appId,at,status:"succeeded",counts,dataThrough:result.data_through,error:null});
      outcomes.push({app_id:appId,status:"succeeded",records_received:counts.received,records_inserted:counts.inserted,records_updated:counts.updated,records_unchanged:counts.unchanged,data_through:result.data_through,reports_considered:result.reports_considered});dataThroughByApp[appId]=result.data_through;
    }catch(cause){
      const error=safeError(cause),status=cause?.code==="DUPLICATE_REPORT_REQUESTS"?"blocked":cause?.code==="REPORT_GENERATION_PENDING"||cause?.code==="REPORT_REQUEST_REQUIRED"?"waiting":"unavailable";
      appendSync(state,{appId,at,status,error});upsertJob(state,{appId,at,status,counts:{received:0,inserted:0,updated:0,unchanged:0},dataThrough:null,error});
      outcomes.push({app_id:appId,status,records_received:0,data_through:null,error:error.message});dataThroughByApp[appId]=null;
    }
  }

  const succeeded=outcomes.filter((item)=>item.status==="succeeded"),waiting=outcomes.filter((item)=>item.status==="waiting"),blocked=outcomes.filter((item)=>item.status==="blocked"),unavailable=outcomes.filter((item)=>item.status==="unavailable");
  const through=Object.values(dataThroughByApp).filter(Boolean).sort().at(-1)??null;
  const providerState=state.providers.find((item)=>item.id==="app_store_connect_api");
  const available=[...new Set(state.metrics.filter((row)=>row.provider==="app_store_connect_api").map((row)=>row.metric??row.name))].sort();
  const freshness=providerFreshness({dataThrough:through,status:succeeded.length?"connected":blocked.length?"blocked":waiting.length?"connected":"stale",now,sla:PROVIDER_SLAS.app_store_connect_api});
  if(providerState)Object.assign(providerState,{status:blocked.length||unavailable.length||waiting.length?"partial":succeeded.length?"live":"waiting",app_ids:[...TRACKED_APP_BUNDLES.keys()],last_sync:at,last_successful_import:succeeded.length?at:providerState.last_successful_import??null,data_through:through,freshness:waiting.length&&!succeeded.length?"waiting":freshness.status,data_available:available,authentication_required:false,authentication_status:"configured",required_configuration:[],secrets_stored:false,error:blocked.length?"BLOCKED — DUPLICATE APPLE ANALYTICS REPORT REQUESTS":unavailable.length?"UNAVAILABLE — SOME APP REPORTS COULD NOT BE READ":waiting.length?"WAITING — SOME APPLE ANALYTICS REPORTS ARE STILL GENERATING":null,app_data_through:dataThroughByApp,app_status:Object.fromEntries(outcomes.map((item)=>[item.app_id,item.status]))});
  state.metadata.data_through={...(state.metadata.data_through??{}),app_store:through,app_store_apps:dataThroughByApp};
  state.audit.unshift({id:crypto.randomUUID(),at,actor:"AI COO OS",app_id:null,source:"official_app_store_connect_analytics_reports_api",action:"sync_portfolio_app_analytics",input:{external_writes:false,tracked_apps:TRACKED_APP_BUNDLES.size},result:{status:blocked.length||unavailable.length?"partial":succeeded.length&&waiting.length?"partial":succeeded.length?"success":"waiting",succeeded:succeeded.length,waiting:waiting.length,blocked:blocked.length,unavailable:unavailable.length,data_through:through,app_data_through:dataThroughByApp,records_received:outcomes.reduce((sum,item)=>sum+(item.records_received??0),0)},status:blocked.length||unavailable.length?"partial":succeeded.length?"success":"waiting",error:null});
  return {status:blocked.length||unavailable.length?"partial":succeeded.length&&waiting.length?"partial":succeeded.length?"succeeded":"waiting",apps:outcomes,data_through:through,records_received:outcomes.reduce((sum,item)=>sum+(item.records_received??0),0)};
}

async function main(){
  const store=new JsonStore(fileURLToPath(new URL("../data/state.json",import.meta.url)));
  const outcome=await store.mutate((state)=>syncAppStoreAnalyticsState(state));
  console.log(`APP_STORE_ANALYTICS_${outcome.status.toUpperCase()} apps=${outcome.apps.length} received=${outcome.records_received} data_through=${outcome.data_through??"null"}`);
}

if(process.argv[1]===fileURLToPath(import.meta.url))await main();
