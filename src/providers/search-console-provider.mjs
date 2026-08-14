import { createGoogleAccessToken, missingSearchConfig, searchConsoleConfig } from "./auth.mjs";
import { ProviderUnavailableError } from "./contracts.mjs";

export function normalizeSearchRows(rows,{appId="style-atlas",provider="google_search_console_api",now=new Date().toISOString()}={}){
  return rows.map((row)=>{const [date,query,page,country,device]=row.keys??[];return {app_id:appId,date:date??null,query:query??null,page:page??null,country:country??null,device:device??null,clicks:Number.isFinite(row.clicks)?row.clicks:null,impressions:Number.isFinite(row.impressions)?row.impressions:null,ctr:Number.isFinite(row.ctr)?row.ctr:null,position:Number.isFinite(row.position)?row.position:null,provider,source:"Google Search Console Search Analytics API",source_reference:`searchAnalytics:${date??"unknown"}`,imported_at:now,verified_at:now,verification_type:"api_verified",freshness:"fresh",confidence:1};});
}

export class SearchConsoleProvider{
  id="google_search_console_api";capabilities=["search_performance"];
  constructor({config=searchConsoleConfig(),fetchFn=fetch,tokenFactory=createGoogleAccessToken}={}){this.config=config;this.fetchFn=fetchFn;this.tokenFactory=tokenFactory;this.token=null;}
  async health(){const missing=missingSearchConfig(this.config);return missing.length?{status:"blocked",authentication_required:true,error:"BLOCKED — AUTH REQUIRED",missing}:{status:"configured",authentication_required:false,error:null};}
  async auth(){this.token??=await this.tokenFactory(this.config,{fetchFn:this.fetchFn});return this.token;}
  async fetchPerformance({appId="style-atlas",startDate,endDate,rowLimit=25000,now=new Date().toISOString()}={}){
    const all=[];let startRow=0;
    while(true){const url=`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(this.config.siteUrl)}/searchAnalytics/query`;const response=await this.fetchFn(url,{method:"POST",headers:{authorization:`Bearer ${await this.auth()}`,"content-type":"application/json"},body:JSON.stringify({startDate,endDate,dimensions:["date","query","page","country","device"],dataState:"final",rowLimit,startRow})});if(!response.ok)throw new ProviderUnavailableError(this.id,`API request failed (${response.status}).`,{code:response.status===401||response.status===403?"AUTH_REJECTED":response.status===429?"RATE_LIMITED":"API_REQUEST_FAILED",retryable:response.status===429||response.status>=500});const body=await response.json();const rows=body.rows??[];all.push(...rows);if(rows.length<rowLimit)break;startRow+=rows.length;}
    const observations=normalizeSearchRows(all,{appId,now});return {observations,data_through:observations.map((row)=>row.date).filter(Boolean).sort().at(-1)??null,row_count:observations.length};
  }
}
