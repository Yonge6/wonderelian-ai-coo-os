import { createHash } from "node:crypto";
import { metricName, normalizeMetricRecord } from "./metrics.mjs";

export const SOURCE_CLASSES=["manual_verified","api_verified","calculated","inferred"];
export const ATTRIBUTION_CONFIDENCE=["direct","strong","partial","inferred","unknown"];
export const PROVIDER_SLAS={
  app_store_connect_api:{expected_latency_hours:48,stale_after_hours:96},
  app_store_reviews_api:{expected_latency_hours:24,stale_after_hours:72},
  google_search_console_api:{expected_latency_hours:48,stale_after_hours:96},
};

export const stableHash=(value)=>createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0,24);

export function metricStableKey(row){return stableHash([row.app_id,metricName(row),row.period_start,row.period_end,row.provider,row.source_reference,row.dimensions??null]);}
export function searchStableKey(row){return stableHash([row.app_id,row.date,row.query,row.page,row.country,row.device,row.provider]);}

export function upsertStable(collection,rows,keyFn,{idPrefix="obs"}={}){
  const index=new Map(collection.map((row,position)=>[row.stable_key??keyFn(row),position]));let inserted=0,updated=0,unchanged=0;
  for(const input of rows){const stable_key=keyFn(input);const row={...input,stable_key,id:input.id??`${idPrefix}-${stable_key}`};const position=index.get(stable_key);if(position===undefined){index.set(stable_key,collection.length);collection.push(row);inserted++;continue;}const previous=collection[position];const comparable=(value)=>JSON.stringify({...value,id:undefined,stable_key:undefined,imported_at:undefined,verified_at:undefined});if(comparable(previous)===comparable(row)){unchanged++;continue;}collection[position]={...previous,...row,id:previous.id};updated++;}
  return {received:rows.length,inserted,updated,unchanged};
}

export function ingestMetrics(state,rows){const normalized=rows.map((row)=>normalizeMetricRecord(row,{id:row.id??`metric-${metricStableKey(row)}`,now:row.imported_at??new Date().toISOString()}));return upsertStable(state.metrics,normalized,metricStableKey,{idPrefix:"metric"});}
export function ingestSearch(state,rows){return upsertStable(state.search_observations,rows,searchStableKey,{idPrefix:"search"});}
export function ingestReviews(state,rows){return upsertStable(state.feedback,rows,(row)=>stableHash([row.app_id,row.provider,row.external_id??row.source_reference]),{idPrefix:"review"});}

export function providerFreshness({dataThrough,status="connected",now=new Date(),sla}){
  if(status==="blocked"||status==="not_connected")return {status,age_hours:null};if(!dataThrough)return {status:"stale",age_hours:null};const ageHours=Math.max(0,(now-new Date(dataThrough))/3_600_000);if(ageHours<=sla.expected_latency_hours)return {status:"healthy",age_hours:Math.round(ageHours*10)/10};if(ageHours<=sla.stale_after_hours)return {status:"delayed",age_hours:Math.round(ageHours*10)/10};return {status:"stale",age_hours:Math.round(ageHours*10)/10};
}

export function reconcileMetrics(state,{appId}={}){
  const groups=new Map();for(const row of state.metrics.filter((metric)=>!appId||metric.app_id===appId)){const key=[row.app_id,metricName(row),row.period_start,row.period_end].join(":");if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);}
  const results=[];for(const [key,rows] of groups){const manual=rows.filter((row)=>row.verification_type==="manual_verified"),api=rows.filter((row)=>row.verification_type==="api_verified");for(const left of manual)for(const right of api){const status=left.value===right.value?"matched":"mismatch";results.push({id:`recon-${stableHash([left.id,right.id])}`,app_id:left.app_id,metric:metricName(left),period_start:left.period_start,period_end:left.period_end,manual_metric_id:left.id,api_metric_id:right.id,manual_value:left.value,api_value:right.value,status,delta:left.value===null||right.value===null?null:right.value-left.value,created_at:new Date().toISOString(),source_key:key});}}
  const upsert=upsertStable(state.reconciliations,results,(row)=>stableHash([row.manual_metric_id,row.api_metric_id]),{idPrefix:"recon"});return {...upsert,matches:results.filter((r)=>r.status==="matched").length,mismatches:results.filter((r)=>r.status==="mismatch").length};
}

export function aggregateSearch(rows){const groups=new Map();for(const row of rows){const key=`${row.query??""}\n${row.page??""}`;if(!groups.has(key))groups.set(key,{query:row.query,page:row.page,clicks:0,impressions:0,weighted_position:0});const item=groups.get(key);item.clicks+=row.clicks??0;item.impressions+=row.impressions??0;item.weighted_position+=(row.position??0)*(row.impressions??0);}return [...groups.values()].map((item)=>({...item,ctr:item.impressions?item.clicks/item.impressions:null,position:item.impressions?item.weighted_position/item.impressions:null}));}

export function detectSearchOpportunities(rows,{minimumImpressions=50}={}){
  const opportunities=[];for(const item of aggregateSearch(rows)){if(item.impressions<minimumImpressions)continue;if(item.ctr!==null&&item.ctr<0.02)opportunities.push({...item,type:"high_impressions_low_ctr",confidence:"strong",reason:"Observed search demand with CTR below 2%."});if(item.position>=5&&item.position<=15)opportunities.push({...item,type:"position_5_15",confidence:"partial",reason:"Observed query/page pair is within striking distance of the first results."});}return opportunities.sort((a,b)=>b.impressions-a.impressions);
}

const TOPICS=[[/crash|freeze|bug|broken|打不开|崩溃/i,"reliability"],[/price|subscription|paywall|expensive|价格|订阅/i,"pricing"],[/search|find|discover|搜索|查找/i,"discovery"],[/guide|learn|explain|教程|学习/i,"learning"]];
export function classifyReviews(rows){return rows.map((row)=>{const text=`${row.title??""} ${row.text??""}`;const topic=TOPICS.find(([pattern])=>pattern.test(text))?.[1]??"general";const sentiment=row.rating===null?null:row.rating<=2?"negative":row.rating>=4?"positive":"neutral";return {...row,topic:row.topic??topic,sentiment:row.sentiment??sentiment,severity:row.severity??(row.rating===1?5:row.rating===2?4:2)};});}

export function reviewOpportunities(rows){const classified=classifyReviews(rows),groups=new Map();for(const row of classified.filter((item)=>item.sentiment==="negative")){if(!groups.has(row.topic))groups.set(row.topic,[]);groups.get(row.topic).push(row);}return [...groups].filter(([,items])=>items.length>=2).map(([topic,items])=>({id:`review-opportunity-${stableHash([topic,items.map(i=>i.id).sort()])}`,app_id:items[0].app_id,type:"review_theme",topic,frequency:items.length,severity:Math.max(...items.map(i=>i.severity??1)),evidence:items.slice(0,3).map(i=>i.source_reference),status:"open",verification_type:"calculated"}));}

export function attributionConfidence(record){if(record.first_time_downloads!==null&&record.first_time_downloads!==undefined&&record.campaign_id&&record.provider==="app_store_connect_api")return"direct";if(record.product_page_views!==null&&record.campaign_id)return"strong";if(record.publish_url&&record.landing_url&&record.app_store_campaign_url)return"partial";if(record.publish_url)return"inferred";return"unknown";}

export function instrumentationMaturity(state,appId){const metrics=state.metrics.filter((row)=>row.app_id===appId&&row.value!==null);const automated=metrics.some((row)=>row.verification_type==="api_verified"&&row.provider==="app_store_connect_api");const search=state.search_observations.some((row)=>row.app_id===appId);const measuredAttribution=state.attributions.some((row)=>row.app_id===appId&&row.first_time_downloads!==null&&row.first_time_downloads!==undefined);const conclusive=state.learnings.some((row)=>row.app_id===appId&&row.status==="active");if(!metrics.length)return 0;if(!automated)return 1;if(!search||!measuredAttribution)return 2;if(!conclusive)return 3;return 4;}
