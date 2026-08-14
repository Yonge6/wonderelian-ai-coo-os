import { gunzipSync } from "node:zlib";
import { createAppleToken, appleConfig, missingAppleConfig } from "./auth.mjs";
import { ProviderAuthRequiredError, ProviderUnavailableError } from "./contracts.mjs";

const API="https://api.appstoreconnect.apple.com";
const metricMap=new Map([
  ["impressions",["impressions"]],
  ["product_page_views",["product page views","page views"]],
  ["first_time_downloads",["first-time downloads","first time downloads"]],
  ["redownloads",["redownloads"]],
  ["in_app_purchases",["in-app purchases","in app purchases"]],
  ["total_downloads",["total downloads"]],
]);
const normalizedKey=(key)=>String(key).replace(/^\uFEFF/,"").trim().toLowerCase();

export function parseTabular(input) {
  const text=Buffer.isBuffer(input)?input.toString("utf8"):String(input??"");
  const lines=text.replace(/^\uFEFF/,"").split(/\r?\n/).filter(Boolean);if(!lines.length)return[];
  const headers=lines.shift().split("\t");
  return lines.map((line)=>Object.fromEntries(line.split("\t").map((value,index)=>[headers[index],value])));
}

function numeric(value){if(value===undefined||value===null||value==="")return null;const parsed=Number(String(value).replace(/,/g,""));return Number.isFinite(parsed)?parsed:null;}
function field(row,names){const entries=new Map(Object.entries(row).map(([k,v])=>[normalizedKey(k),v]));for(const name of names)if(entries.has(name))return entries.get(name);return undefined;}

export function normalizeAnalyticsRows(rows,{appId="style-atlas",provider="app_store_connect_api",sourceReference="analytics-reports"}={}){
  const output=[];
  for(const row of rows){
    const date=field(row,["date","event date","report date"]);if(!date)continue;
    const dimensions={territory:field(row,["app store territory","territory"])??null,device:field(row,["device"])??null,source_type:field(row,["source type"])??null,campaign:field(row,["campaign"])??null};
    for(const [metric,names] of metricMap){const value=numeric(field(row,names));if(value===null)continue;output.push({app_id:appId,metric,name:metric,value,unit:"count",period_start:date,period_end:date,source:"App Store Connect Analytics Reports API",provider,source_reference:sourceReference,imported_at:null,verified_at:null,freshness:"fresh",confidence:1,verification_type:"api_verified",dimensions,notes:"Official App Store Connect Analytics Reports observation."});}
  }
  return output;
}

export function normalizeCustomerReviews(payload,{appId="style-atlas",provider="app_store_reviews_api",now=new Date().toISOString()}={}){
  return (payload?.data??[]).map((item)=>({id:`asc-review-${item.id}`,external_id:item.id,app_id:appId,provider,source:"App Store Connect customerReviews API",source_reference:`customerReviews:${item.id}`,rating:item.attributes?.rating??null,title:item.attributes?.title??null,text:item.attributes?.body??null,reviewer_nickname:item.attributes?.reviewerNickname??null,territory:item.attributes?.territory??item.attributes?.reviewTerritory??null,created_at:item.attributes?.createdDate??null,verified_at:now,imported_at:now,verification_type:"api_verified",sentiment:null,topic:null,severity:null,response_status:item.relationships?.response?"relationship_available":"unknown"}));
}

export class AppStoreConnectProvider{
  id="app_store_connect_api";capabilities=["acquisition","commerce","customer_reviews"];
  constructor({config=appleConfig(),fetchFn=fetch,tokenFactory=createAppleToken}={}){this.config=config;this.fetchFn=fetchFn;this.tokenFactory=tokenFactory;this.token=null;}
  async health(){const missing=missingAppleConfig(this.config);return missing.length?{status:"blocked",authentication_required:true,error:"BLOCKED — AUTH REQUIRED",missing}:{status:"configured",authentication_required:false,error:null};}
  async auth(){this.token??=await this.tokenFactory(this.config);return this.token;}
  async request(path,{download=false}={}){const url=path.startsWith("http")?path:`${API}${path}`;const headers=new URL(url).origin===API?{authorization:`Bearer ${await this.auth()}`}:{ };const response=await this.fetchFn(url,{headers});if(!response.ok)throw new ProviderUnavailableError(this.id,`API request failed (${response.status}).`,{code:response.status===401||response.status===403?"AUTH_REJECTED":response.status===429?"RATE_LIMITED":"API_REQUEST_FAILED",retryable:response.status===429||response.status>=500});return download?Buffer.from(await response.arrayBuffer()):response.json();}
  async requestAll(path){const data=[];let next=path;while(next){const body=await this.request(next);data.push(...(body.data??[]));next=body.links?.next??null;}return data;}
  async resolveAppId(){if(this.config.appId)return this.config.appId;if(!this.config.bundleId)throw new ProviderAuthRequiredError(this.id,["ASC_APP_ID or ASC_BUNDLE_ID"]);const body=await this.request(`/v1/apps?filter%5BbundleId%5D=${encodeURIComponent(this.config.bundleId)}&limit=2`);if(body.data?.length!==1)throw new ProviderUnavailableError(this.id,"App could not be uniquely resolved.",{code:"APP_NOT_RESOLVED"});return body.data[0].id;}
  async fetchReviews({now=new Date().toISOString()}={}){const appId=await this.resolveAppId();const data=await this.requestAll(`/v1/apps/${encodeURIComponent(appId)}/customerReviews?limit=200&sort=-createdDate`);return normalizeCustomerReviews({data},{now});}
  async fetchAnalytics({appId="style-atlas",now=new Date().toISOString()}={}){
    const ascAppId=await this.resolveAppId();const requests=await this.requestAll(`/v1/apps/${encodeURIComponent(ascAppId)}/analyticsReportRequests?limit=50`);
    const ongoing=requests.find((item)=>item.attributes?.accessType==="ONGOING"&&!item.attributes?.stoppedDueToInactivity);
    if(!ongoing)throw new ProviderUnavailableError(this.id,"No active ONGOING analytics report request. Admin must create it once.",{code:"REPORT_REQUEST_REQUIRED"});
    const reports=await this.requestAll(`/v1/analyticsReportRequests/${encodeURIComponent(ongoing.id)}/reports?limit=200`);
    const selected=reports.filter((report)=>/Discovery and Engagement|Commerce/i.test(report.attributes?.name??""));
    const observations=[];let dataThrough=null;
    for(const report of selected){
      const instances=await this.requestAll(`/v1/analyticsReports/${encodeURIComponent(report.id)}/instances?filter%5Bgranularity%5D=DAILY&limit=200`);
      const instance=instances.sort((a,b)=>String(b.attributes?.processingDate??"").localeCompare(String(a.attributes?.processingDate??"")))[0];if(!instance)continue;
      dataThrough=[dataThrough,instance.attributes?.processingDate].filter(Boolean).sort().at(-1)??dataThrough;
      const segments=await this.requestAll(`/v1/analyticsReportInstances/${encodeURIComponent(instance.id)}/segments?limit=200`);
      for(const segment of segments){const url=segment.attributes?.url;if(!url)continue;let body=await this.request(url,{download:true});if(body[0]===0x1f&&body[1]===0x8b)body=gunzipSync(body);observations.push(...normalizeAnalyticsRows(parseTabular(body),{appId,sourceReference:`analyticsReport:${report.id}:instance:${instance.id}:segment:${segment.id}`}));}
    }
    return {observations:observations.map((row)=>({...row,imported_at:now,verified_at:now})),data_through:dataThrough,report_request_id:ongoing.id,reports_considered:selected.length};
  }
}
