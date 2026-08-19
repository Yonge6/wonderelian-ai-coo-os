import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";
import { ingestWebsiteMetrics, providerFreshness, PROVIDER_SLAS } from "./growth-data.mjs";
import { Ga4WebsiteProvider } from "./providers/ga4-website-provider.mjs";

const calendarDay=(date,timeZone="Asia/Shanghai")=>{
  const parts=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{
    year:"numeric",month:"2-digit",day:"2-digit",timeZone,
  }).formatToParts(date).map(({type,value})=>[type,value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
};
const shiftCalendarDay=(day,offset)=>{
  const [year,month,date]=day.split("-").map(Number),shifted=new Date(Date.UTC(year,month-1,date+offset));
  return shifted.toISOString().slice(0,10);
};

function appendSync(state,{at,status,counts={received:0,inserted:0,updated:0,unchanged:0},dataThrough=null,error=null,periodStart=null,periodEnd=null}){
  state.provider_syncs.push({id:`sync-website_analytics_api-${at.replace(/[:.]/g,"-")}`,app_id:null,provider:"website_analytics_api",period_start:periodStart,period_end:periodEnd,started_at:at,completed_at:at,status,records_received:counts.received,records_inserted:counts.inserted,records_updated:counts.updated,records_unchanged:counts.unchanged,data_through:dataThrough,error});
}

export async function syncWebsiteAnalyticsState(state,{provider=new Ga4WebsiteProvider(),now=new Date(),backfillDays=90}={}){
  const at=now.toISOString(),health=await provider.health(),providerState=state.providers.find((row)=>row.id==="website_analytics_api"),job=state.jobs.find((row)=>row.provider==="website_analytics_api");
  if(health.status==="blocked")return {status:"blocked",records_received:0,data_through:null,missing:health.missing};
  const today=calendarDay(now),periodStart=shiftCalendarDay(today,-backfillDays),periodEnd=shiftCalendarDay(today,-1);
  let result;
  try {
    result=await provider.fetchPerformance({websites:state.websites,startDate:periodStart,endDate:periodEnd,now:at});
  } catch (error) {
    const authRejected=error?.code==="AUTH_REJECTED";
    const status=authRejected?"blocked":"unavailable";
    const message=authRejected?"BLOCKED — GA4 PROPERTY VIEWER ACCESS REQUIRED":"UNAVAILABLE — GA4 DATA API REQUEST FAILED";
    if(providerState)Object.assign(providerState,{status,last_sync:at,freshness:status,authentication_required:authRejected,authentication_status:authRejected?"rejected":"configured",error:message});
    if(job)Object.assign(job,{last_run:at,next_run:null,status,result:{records_received:0},error:message});
    appendSync(state,{at,status,dataThrough:null,error:{code:error?.code??"PROVIDER_UNAVAILABLE",message},periodStart,periodEnd});
    state.audit.unshift({id:crypto.randomUUID(),at,actor:"AI COO OS",app_id:null,source:"ga4_website_sync",action:"sync_six_site_website_analytics",input:{external_writes:false},result:{status,records_received:0,data_through:null},status,error:{code:error?.code??"PROVIDER_UNAVAILABLE",message}});
    return {status,records_received:0,data_through:null,error:message};
  }
  if(!result.observations.length){
    if(providerState)Object.assign(providerState,{status:"waiting",last_sync:at,freshness:"waiting",authentication_required:false,authentication_status:"configured",error:"WAITING — GA4 HAS NOT RETURNED VERIFIED WEBSITE OBSERVATIONS"});
    if(job)Object.assign(job,{last_run:at,next_run:null,status:"waiting",result:{records_received:0},error:"WAITING — GA4 OBSERVATIONS"});
    appendSync(state,{at,status:"waiting",dataThrough:null,periodStart,periodEnd});
    state.audit.unshift({id:crypto.randomUUID(),at,actor:"AI COO OS",app_id:null,source:"ga4_website_sync",action:"sync_six_site_website_analytics",input:{external_writes:false},result:{status:"waiting",records_received:0,data_through:null},status:"waiting",error:null});
    return {status:"waiting",records_received:0,data_through:null};
  }
  const counts=ingestWebsiteMetrics(state,result.observations),observedSites=new Set(result.observations.map((row)=>row.website_id));
  for(const site of state.websites)if(observedSites.has(site.id))site.analytics_status="connected";
  const freshness=providerFreshness({dataThrough:result.data_through,status:"connected",now,sla:PROVIDER_SLAS.website_analytics_api});
  if(providerState)Object.assign(providerState,{status:"live",last_sync:at,last_successful_import:at,data_through:result.data_through,freshness:freshness.status,data_available:["page_views","active_users","sessions","traffic_source","landing_page","country","device","cta_clicks"],data_unavailable:[],authentication_required:false,authentication_status:"configured",error:null});
  if(job)Object.assign(job,{last_run:at,next_run:new Date(now.getTime()+86_400_000).toISOString(),status:"scheduled",result:{records_received:counts.received,records_inserted:counts.inserted,records_updated:counts.updated,data_through:result.data_through},error:null,retry_count:0});
  state.metadata.data_through={...(state.metadata.data_through??{}),website_analytics:result.data_through};
  appendSync(state,{at,status:"succeeded",counts,dataThrough:result.data_through,periodStart,periodEnd});
  state.audit.unshift({id:crypto.randomUUID(),at,actor:"AI COO OS",app_id:null,source:"ga4_website_sync",action:"sync_six_site_website_analytics",input:{external_writes:false},result:{status:"success",...counts,data_through:result.data_through,sites_observed:observedSites.size},status:"success",error:null});
  return {status:"succeeded",...counts,data_through:result.data_through,sites_observed:observedSites.size};
}

async function main(){
  const store=new JsonStore(fileURLToPath(new URL("../data/state.json",import.meta.url))),provider=new Ga4WebsiteProvider(),health=await provider.health();
  if(health.status==="blocked"){console.error(`WEBSITE_ANALYTICS_BLOCKED missing=${health.missing.join(",")}`);process.exitCode=2;return;}
  const outcome=await store.mutate((state)=>syncWebsiteAnalyticsState(state,{provider}));
  console.log(`WEBSITE_ANALYTICS_${outcome.status.toUpperCase()} received=${outcome.records_received} data_through=${outcome.data_through??"null"}`);
}

if(process.argv[1]===fileURLToPath(import.meta.url))await main();
