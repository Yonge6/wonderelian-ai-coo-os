import { gunzipSync } from "node:zlib";
import { createAppleToken, appleConfig, missingAppleConfig } from "./auth.mjs";
import { ProviderAuthRequiredError, ProviderUnavailableError } from "./contracts.mjs";

const API="https://api.appstoreconnect.apple.com";
const legacyMetricMap=new Map([
  ["impressions",["impressions"]],
  ["product_page_views",["product page views","page views"]],
  ["first_time_downloads",["first-time downloads","first time downloads"]],
  ["redownloads",["redownloads"]],
  ["in_app_purchases",["in-app purchases","in app purchases"]],
  ["total_downloads",["total downloads"]],
]);
export const ANALYTICS_STANDARD_REPORTS=new Set([
  "App Downloads Standard",
  "App Store Discovery and Engagement Standard",
  "App Store Purchases Standard",
  "App Store Subscription Event Report Standard",
  "App Store Subscription State Report Standard",
  "App Sessions Standard",
  "App Store Installation and Deletion Standard",
  "App Crashes",
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

function compactDimensions(row){
  return Object.fromEntries(Object.entries({
    territory:field(row,["app store territory","territory","country"]),
    device:field(row,["device"]),
    source_type:field(row,["source type"]),
    campaign:field(row,["campaign"]),
    page_type:field(row,["page type"]),
    engagement_type:field(row,["engagement type"]),
    download_type:field(row,["download type"]),
    app_version:field(row,["app version"]),
    platform_version:field(row,["platform version"]),
    purchase_type:field(row,["purchase type"]),
    event_sub_type:field(row,["event sub type"]),
    event_grouping:field(row,["event grouping"]),
    subscription_offer_type:field(row,["subscription offer type"]),
    currency:field(row,["currency","proceeds currency","sales currency"]),
  }).filter(([,value])=>value!==undefined&&value!==null&&value!==""));
}

function analyticsObservation({appId,provider,sourceReference,date,dimensions,metric,value,unit="count"}){
  return {app_id:appId,metric,name:metric,value,unit,period_start:date,period_end:date,source:"App Store Connect Analytics Reports API",provider,source_reference:sourceReference,imported_at:null,verified_at:null,freshness:"fresh",confidence:1,verification_type:"api_verified",dimensions,notes:"Official App Store Connect Analytics Reports observation."};
}

export function normalizeAnalyticsRows(rows,{appId="style-atlas",provider="app_store_connect_api",sourceReference="analytics-reports",reportName=""}={}){
  const output=[];
  for(const row of rows){
    const date=field(row,["date","event date","report date"]);if(!date)continue;
    const dimensions=compactDimensions(row),push=(metric,value,unit="count")=>{if(value!==null)output.push(analyticsObservation({appId,provider,sourceReference,date,dimensions,metric,value,unit}));};
    if(reportName==="App Downloads Standard"){
      const value=numeric(field(row,["counts","count"])),type=String(field(row,["download type"])??"").toLowerCase();
      if(type==="first-time download"){push("first_time_downloads",value);push("total_downloads",value);}
      else if(type==="redownload"){push("redownloads",value);push("total_downloads",value);}
      else if(type==="auto-update"||type==="manual update")push("updates",value);
      continue;
    }
    if(reportName==="App Store Discovery and Engagement Standard"){
      const count=numeric(field(row,["counts","count"])),unique=numeric(field(row,["unique counts","unique count"]));
      const event=String(field(row,["event"])??"").toLowerCase(),pageType=String(field(row,["page type"])??"").toLowerCase();
      if(event==="impression"){push("impressions",count);push("impressions_unique",unique);}
      else if(event==="page view"&&(pageType==="product page"||pageType==="store sheet")){push("product_page_views",count);push("product_page_views_unique",unique);}
      else if(event==="tap"){push("app_store_taps",count);push("app_store_taps_unique",unique);}
      continue;
    }
    if(reportName==="App Store Purchases Standard"){
      const purchaseType=String(field(row,["purchase type"])??"").toLowerCase();
      const count=numeric(field(row,["counts","count","units","purchases"]));
      if(purchaseType.includes("in-app")||purchaseType.includes("subscription"))push("in_app_purchases",count);
      push("sales",numeric(field(row,["sales"])),"currency");
      push("proceeds",numeric(field(row,["proceeds"])),"currency");
      push("paying_users",numeric(field(row,["paying users"])),"count");
      continue;
    }
    if(reportName==="App Sessions Standard"){
      push("app_sessions",numeric(field(row,["session count","sessions","counts","count"])));
      push("active_devices",numeric(field(row,["unique devices","unique counts","unique count"])));
      push("average_session_duration",numeric(field(row,["average session duration"])),"seconds");
      continue;
    }
    if(reportName==="App Store Installation and Deletion Standard"){
      const event=String(field(row,["event","installation type","activity type"])??"").toLowerCase(),value=numeric(field(row,["counts","count"]));
      if(event.includes("install"))push("installations",value);
      if(event.includes("delet"))push("deletions",value);
      continue;
    }
    if(reportName==="App Crashes"){
      push("crashes",numeric(field(row,["crashes","counts","count"])));
      continue;
    }
    if(reportName==="App Store Subscription Event Report Standard"){
      const subtype=String(field(row,["event sub type","event"])??"").toLowerCase(),value=numeric(field(row,["counts","count","quantity"]));
      if(/free trial/.test(subtype)&&/start|activation/.test(subtype))push("trial_starts",value);
      if(/convert|conversion/.test(subtype)&&/paid/.test(subtype))push("paid_conversions",value);
      if(/paid/.test(subtype)&&/renew/.test(subtype))push("paid_renewals",value);
      continue;
    }
    if(reportName==="App Store Subscription State Report Standard"){
      const state=String(field(row,["state metric","subscription state","state"])??"").toLowerCase(),value=numeric(field(row,["counts","count","quantity"]));
      if(state.includes("free trial"))push("active_free_trials",value);
      else if(state.includes("paid"))push("active_paid_subscriptions",value);
      continue;
    }
    for(const [metric,names] of legacyMetricMap)push(metric,numeric(field(row,names)));
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
    const active=requests.filter((item)=>item.attributes?.accessType==="ONGOING"&&!item.attributes?.stoppedDueToInactivity);
    if(active.length===0)throw new ProviderUnavailableError(this.id,"No active ONGOING analytics report request. Admin must create it once.",{code:"REPORT_REQUEST_REQUIRED"});
    if(active.length!==1)throw new ProviderUnavailableError(this.id,"Expected exactly one active ONGOING analytics report request.",{code:"DUPLICATE_REPORT_REQUESTS"});
    const ongoing=active[0];
    const reports=await this.requestAll(`/v1/analyticsReportRequests/${encodeURIComponent(ongoing.id)}/reports?limit=200`);
    const selected=reports.filter((report)=>ANALYTICS_STANDARD_REPORTS.has(report.attributes?.name??""));
    const observations=[];let dataThrough=null;
    for(const report of selected){
      const instances=await this.requestAll(`/v1/analyticsReports/${encodeURIComponent(report.id)}/instances?filter%5Bgranularity%5D=DAILY&limit=200`);
      for(const instance of instances.sort((a,b)=>String(a.attributes?.processingDate??"").localeCompare(String(b.attributes?.processingDate??"")))){
        const segments=await this.requestAll(`/v1/analyticsReportInstances/${encodeURIComponent(instance.id)}/segments?limit=200`);
        for(const segment of segments){const url=segment.attributes?.url;if(!url)continue;let body=await this.request(url,{download:true});if(body[0]===0x1f&&body[1]===0x8b)body=gunzipSync(body);const rows=normalizeAnalyticsRows(parseTabular(body),{appId,reportName:report.attributes?.name,sourceReference:`analyticsReport:${report.attributes?.name}`});observations.push(...rows);dataThrough=[dataThrough,...rows.map((row)=>row.period_end)].filter(Boolean).sort().at(-1)??dataThrough;}
      }
    }
    if(!dataThrough)throw new ProviderUnavailableError(this.id,"The active analytics report request has not generated report instances yet.",{code:"REPORT_GENERATION_PENDING"});
    return {observations:observations.map((row)=>({...row,imported_at:now,verified_at:now})),data_through:dataThrough,report_request_id:ongoing.id,reports_considered:selected.length};
  }
}
