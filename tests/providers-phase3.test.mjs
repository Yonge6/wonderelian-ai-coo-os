import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, verify } from "node:crypto";
import { createAppleToken, missingAppleConfig, missingGoogleAnalyticsConfig, missingSearchConfig } from "../src/providers/auth.mjs";
import { AppStoreConnectProvider, normalizeAnalyticsRows, normalizeCustomerReviews, parseTabular } from "../src/providers/app-store-connect-provider.mjs";
import { SearchConsoleProvider, normalizeSearchRows } from "../src/providers/search-console-provider.mjs";

test("Apple JWT is ES256, bounded to 20 minutes, and contains no private key material",async()=>{
  const {privateKey,publicKey}=generateKeyPairSync("ec",{namedCurve:"P-256"});
  const pem=privateKey.export({type:"pkcs8",format:"pem"});
  const token=await createAppleToken({issuerId:"issuer",keyId:"key",privateKeyPath:"ignored"},{now:new Date("2026-08-14T00:00:00Z"),lifetimeSeconds:9999,readFileFn:async()=>pem});
  const [header,payload,signature]=token.split(".");const claims=JSON.parse(Buffer.from(payload,"base64url"));
  assert.equal(JSON.parse(Buffer.from(header,"base64url")).alg,"ES256");assert.equal(claims.exp-claims.iat,1200);assert.equal(token.includes("PRIVATE KEY"),false);
  assert.equal(verify("sha256",Buffer.from(`${header}.${payload}`),{key:publicKey,dsaEncoding:"ieee-p1363"},Buffer.from(signature,"base64url")),true);
});

test("configuration checks return only required variable names",()=>{
  assert.deepEqual(missingAppleConfig({}),["ASC_ISSUER_ID","ASC_KEY_ID","ASC_PRIVATE_KEY_PATH"]);
  assert.deepEqual(missingSearchConfig({}),["GSC_SITE_URL","GOOGLE_APPLICATION_CREDENTIALS or GSC_ACCESS_TOKEN"]);
  assert.deepEqual(missingGoogleAnalyticsConfig({}),["GA4_PROPERTY_ID","GOOGLE_APPLICATION_CREDENTIALS or GA4_ACCESS_TOKEN"]);
});

test("App Store tabular analytics and reviews normalize official payload shapes",()=>{
  const rows=parseTabular("Date\tApp Store Territory\tImpressions\tProduct Page Views\tFirst-Time Downloads\n2026-08-12\tUSA\t100\t20\t3\n");
  const metrics=normalizeAnalyticsRows(rows,{sourceReference:"segment:1"});
  assert.deepEqual(metrics.map((row)=>row.metric),["impressions","product_page_views","first_time_downloads"]);assert.equal(metrics[0].verification_type,"api_verified");assert.equal(metrics[0].dimensions.territory,"USA");
  const reviews=normalizeCustomerReviews({data:[{id:"r1",attributes:{rating:2,title:"Hard to search",body:"I cannot find styles",reviewerNickname:"A",createdDate:"2026-08-12T00:00:00Z",territory:"USA"}}]},{now:"2026-08-14T00:00:00Z"});
  assert.equal(reviews[0].external_id,"r1");assert.equal(reviews[0].rating,2);assert.equal(reviews[0].verification_type,"api_verified");
});

test("App Store Analytics Reports long-form rows map to acquisition metrics without inventing missing values",()=>{
  const downloads=parseTabular("Date\tDownload Type\tDevice\tTerritory\tCounts\n2026-09-20\tFirst-time download\tiPhone\tUS\t2\n2026-09-20\tRedownload\tiPhone\tUS\t1\n2026-09-20\tAuto-update\tiPhone\tUS\t4\n");
  const downloadMetrics=normalizeAnalyticsRows(downloads,{reportName:"App Downloads Standard",sourceReference:"analyticsReport:App Downloads Standard"});
  assert.deepEqual(downloadMetrics.map((row)=>row.metric),["first_time_downloads","total_downloads","redownloads","total_downloads","updates"]);
  assert.equal(downloadMetrics[0].value,2);
  assert.equal(downloadMetrics[0].dimensions.download_type,"First-time download");

  const discovery=parseTabular("Date\tEvent\tPage Type\tSource Type\tTerritory\tCounts\tUnique Counts\n2026-09-20\tImpression\tNo page\tApp Store search\tUS\t10\t8\n2026-09-20\tPage view\tProduct page\tApp Store search\tUS\t3\t2\n2026-09-20\tPage view\tDeveloper page\tApp Store search\tUS\t7\t6\n");
  const discoveryMetrics=normalizeAnalyticsRows(discovery,{reportName:"App Store Discovery and Engagement Standard"});
  assert.deepEqual(discoveryMetrics.map((row)=>row.metric),["impressions","impressions_unique","product_page_views","product_page_views_unique"]);
  assert.equal(discoveryMetrics.some((row)=>row.value===7),false);
});

test("App Store Analytics fetch reads every daily batch and uses observation date as data-through",async()=>{
  const provider=new AppStoreConnectProvider({config:{issuerId:"issuer",keyId:"key",privateKeyPath:"path",appId:"apple-app"},tokenFactory:async()=>"token"});
  provider.resolveAppId=async()=>"apple-app";
  provider.requestAll=async(path)=>{
    if(path.includes("/analyticsReportRequests?"))return[{id:"request-1",attributes:{accessType:"ONGOING",stoppedDueToInactivity:false}}];
    if(path.includes("/reports?"))return[{id:"report-1",attributes:{name:"App Downloads Standard"}}];
    if(path.includes("/instances?"))return[
      {id:"instance-1",attributes:{processingDate:"2026-09-21"}},
      {id:"instance-2",attributes:{processingDate:"2026-09-22"}},
    ];
    if(path.includes("instance-1/segments"))return[{id:"segment-1",attributes:{url:"https://download.test/1"}}];
    if(path.includes("instance-2/segments"))return[{id:"segment-2",attributes:{url:"https://download.test/2"}}];
    return[];
  };
  provider.request=async(url)=>Buffer.from(url.endsWith("/1")
    ?"Date\tDownload Type\tCounts\n2026-09-19\tFirst-time download\t1\n"
    :"Date\tDownload Type\tCounts\n2026-09-20\tFirst-time download\t2\n");
  const result=await provider.fetchAnalytics({appId:"style-atlas",now:"2026-09-23T00:00:00Z"});
  assert.equal(result.data_through,"2026-09-20");
  assert.equal(result.observations.filter((row)=>row.metric==="first_time_downloads").length,2);
  assert.equal(result.observations.every((row)=>row.source_reference==="analyticsReport:App Downloads Standard"),true);
});

test("Search Console provider requests final data and paginates without inventing rows",async()=>{
  const calls=[];const fetchFn=async(_url,options)=>{calls.push(JSON.parse(options.body));return {ok:true,json:async()=>({rows:calls.length===1?[{keys:["2026-08-12","style guide","https://example.com/","usa","mobile"],clicks:2,impressions:100,ctr:.02,position:8}]:[]})};};
  const provider=new SearchConsoleProvider({config:{siteUrl:"sc-domain:example.com",accessToken:"ephemeral"},fetchFn,tokenFactory:async()=>"ephemeral"});
  const result=await provider.fetchPerformance({startDate:"2026-08-01",endDate:"2026-08-12",rowLimit:1,now:"2026-08-14T00:00:00Z"});
  assert.equal(calls.length,2);assert.equal(calls[0].dataState,"final");assert.deepEqual(calls[0].dimensions,["date","query","page","country","device"]);assert.equal(result.observations.length,1);assert.equal(result.data_through,"2026-08-12");
  assert.equal(normalizeSearchRows([]).length,0);
});
