import { createGoogleAnalyticsAccessToken, googleAnalyticsConfig, missingGoogleAnalyticsConfig } from "./auth.mjs";
import { ProviderUnavailableError } from "./contracts.mjs";

const PRIMARY_EVENTS=new Set(["app_store_download","app_discovery","chart_completion","chapter_read","poster_engagement","product_discovery","recommendation_click"]);
const REPORTS=[
  {id:"overview",dimensions:["date","hostName"],metrics:["screenPageViews","activeUsers","sessions"]},
  {id:"sources",dimensions:["date","hostName","sessionSourceMedium"],metrics:["sessions"]},
  {id:"landing_pages",dimensions:["date","hostName","landingPagePlusQueryString"],metrics:["sessions"]},
  {id:"geo_device",dimensions:["date","hostName","country","deviceCategory"],metrics:["activeUsers"]},
  {id:"events",dimensions:["date","hostName","eventName"],metrics:["eventCount"]},
];

const asDate=(value)=>/^\d{8}$/.test(String(value??""))?`${value.slice(0,4)}-${value.slice(4,6)}-${value.slice(6,8)}`:null;
const numeric=(value)=>value===""||value===null||value===undefined?null:Number.isFinite(Number(value))?Number(value):null;
const cleanHost=(value)=>String(value??"").toLowerCase().replace(/^www\./,"").replace(/\.$/,"");
const propertyPath=(value)=>String(value).startsWith("properties/")?String(value):`properties/${value}`;

function rowsFromReport(body){
  const dimensions=(body.dimensionHeaders??[]).map((row)=>row.name),metrics=(body.metricHeaders??[]).map((row)=>row.name);
  return (body.rows??[]).map((row)=>({
    dimensions:Object.fromEntries(dimensions.map((name,index)=>[name,row.dimensionValues?.[index]?.value??null])),
    metrics:Object.fromEntries(metrics.map((name,index)=>[name,numeric(row.metricValues?.[index]?.value)])),
  }));
}

function observation({websiteId,date,metric,value,dimensions,report,propertyId,now}){
  return {website_id:websiteId,metric,name:metric,value,unit:"count",period_start:date,period_end:date,dimensions,provider:"website_analytics_api",source:"Google Analytics 4 Data API",source_reference:`ga4:${propertyPath(propertyId)}:${report}:${date}`,imported_at:now,verified_at:now,verification_type:"api_verified",freshness:"fresh",confidence:1};
}

export function normalizeGa4Reports(reports,{websites,propertyId,now=new Date().toISOString()}={}){
  const byHost=new Map(websites.map((site)=>[cleanHost(new URL(site.url).hostname),site]));
  const observations=[];
  for(const [report,body] of Object.entries(reports))for(const row of rowsFromReport(body)){
    const date=asDate(row.dimensions.date),site=byHost.get(cleanHost(row.dimensions.hostName));if(!date||!site)continue;
    const baseDimensions={hostname:cleanHost(row.dimensions.hostName)};
    if(report==="overview"){
      for(const [apiMetric,metric] of [["screenPageViews","page_views"],["activeUsers","active_users"],["sessions","sessions"]]){
        const value=row.metrics[apiMetric];if(value!==null)observations.push(observation({websiteId:site.id,date,metric,value,dimensions:baseDimensions,report,propertyId,now}));
      }
    }
    if(report==="sources"&&row.metrics.sessions!==null)observations.push(observation({websiteId:site.id,date,metric:"traffic_source_sessions",value:row.metrics.sessions,dimensions:{...baseDimensions,source_medium:row.dimensions.sessionSourceMedium},report,propertyId,now}));
    if(report==="landing_pages"&&row.metrics.sessions!==null)observations.push(observation({websiteId:site.id,date,metric:"landing_page_sessions",value:row.metrics.sessions,dimensions:{...baseDimensions,landing_page:row.dimensions.landingPagePlusQueryString},report,propertyId,now}));
    if(report==="geo_device"&&row.metrics.activeUsers!==null)observations.push(observation({websiteId:site.id,date,metric:"audience",value:row.metrics.activeUsers,dimensions:{...baseDimensions,country:row.dimensions.country,device:row.dimensions.deviceCategory},report,propertyId,now}));
    if(report==="events"&&PRIMARY_EVENTS.has(row.dimensions.eventName)&&row.metrics.eventCount!==null){
      const dimensions={...baseDimensions,event_name:row.dimensions.eventName};
      observations.push(observation({websiteId:site.id,date,metric:row.dimensions.eventName,value:row.metrics.eventCount,dimensions,report,propertyId,now}));
      observations.push(observation({websiteId:site.id,date,metric:"cta_clicks",value:row.metrics.eventCount,dimensions,report,propertyId,now}));
    }
  }
  return observations;
}

export class Ga4WebsiteProvider{
  id="website_analytics_api";capabilities=["website_traffic","website_conversions"];
  constructor({config=googleAnalyticsConfig(),fetchFn=fetch,tokenFactory=createGoogleAnalyticsAccessToken}={}){this.config=config;this.fetchFn=fetchFn;this.tokenFactory=tokenFactory;this.token=null;}
  async health(){const missing=missingGoogleAnalyticsConfig(this.config);return missing.length?{status:"blocked",authentication_required:true,error:"BLOCKED — AUTH REQUIRED",missing}:{status:"configured",authentication_required:false,error:null};}
  async auth(){this.token??=await this.tokenFactory(this.config,{fetchFn:this.fetchFn});return this.token;}
  async runReport({dimensions,metrics,startDate,endDate,limit=100000}){
    const rows=[];let offset=0;
    while(true){
      const response=await this.fetchFn(`https://analyticsdata.googleapis.com/v1beta/${propertyPath(this.config.propertyId)}:runReport`,{method:"POST",headers:{authorization:`Bearer ${await this.auth()}`,"content-type":"application/json"},body:JSON.stringify({dateRanges:[{startDate,endDate}],dimensions:dimensions.map((name)=>({name})),metrics:metrics.map((name)=>({name})),keepEmptyRows:false,limit:String(limit),offset:String(offset)})});
      if(!response.ok)throw new ProviderUnavailableError(this.id,`API request failed (${response.status}).`,{code:response.status===401||response.status===403?"AUTH_REJECTED":response.status===429?"RATE_LIMITED":"API_REQUEST_FAILED",retryable:response.status===429||response.status>=500});
      const body=await response.json(),page=body.rows??[];rows.push(...page);if(page.length<limit)return{...body,rows};offset+=page.length;
    }
  }
  async fetchPerformance({websites,startDate,endDate,now=new Date().toISOString()}={}){
    const reports={};for(const report of REPORTS)reports[report.id]=await this.runReport({dimensions:report.dimensions,metrics:report.metrics,startDate,endDate});
    const observations=normalizeGa4Reports(reports,{websites,propertyId:this.config.propertyId,now});
    return {observations,data_through:observations.map((row)=>row.period_end).filter(Boolean).sort().at(-1)??null,row_count:observations.length};
  }
}
