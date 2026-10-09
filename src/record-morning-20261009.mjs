import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {JsonStore} from './store.mjs';
import {fileURLToPath} from 'node:url';
const ledger=JSON.parse(await readFile(new URL('../../assets/yixiu-20261008/publication-status.json',import.meta.url),'utf8'));
const store=new JsonStore(fileURLToPath(new URL('../data/state.json',import.meta.url)));
await store.mutate(state=>{
 const upstream=JSON.parse(execFileSync('git',['show','origin/main:data/state.json'],{maxBuffer:30_000_000}));
 for(const row of upstream.audit??[])if(!state.audit.some(a=>a.id===row.id))state.audit.push(row);
 let inserted=0;
 for(const[channel,item]of Object.entries(ledger.platforms)){
  if(item.status!=='published_verified'||!item.url||state.content.some(r=>r.url===item.url||r.publish_url===item.url))continue;
  const landing=channel==='pinterest'?'https://yixiu.wonderelian.com/sleep-sounds/?utm_source=pinterest&utm_medium=organic_social&utm_campaign=sleep_sounds&utm_content=20261008_01-day-dock':null;
  state.content.push({id:`yixiu-${channel}-${ledger.content_id}`,app_id:'yixiu-meditation',channel_id:channel,type:'image_post',title:'LET THE DAY DOCK.',status:'published',published_at:'2026-10-08',url:item.url,publish_url:item.url,landing_url:landing,impressions:null,engagements:null,outbound_clicks:null,first_time_downloads:null,views:null,likes:null,comments:null,shares:null,saves:null,landing_page_visits:null,attributed_conversions:null,product_page_views:null,measurement_status:'collecting',campaign_id:null,app_store_campaign_url:null});inserted++;
 }
 state.audit.unshift({id:crypto.randomUUID(),at:new Date().toISOString(),actor:'Codex',source:'2026-10-09 morning heartbeat; official GA4; October 8 public verification ledger',action:'morning_data_and_publication_reconciliation',result:{website_data_through:'2026-10-08',records_inserted:inserted,unverified_channels_excluded:['tiktok','youtube'],apple_configuration_present:0,apple_api_verified:false,apple_request_count:null,apple_requests_created:0,app_snapshot_preserved:true,ga4_recovery:{credential_candidates:1,property_candidates:1,mode600:true,official_probe_verified:true}},status:'partial',error:{code:'APPLE_CONFIGURATION_MISSING',message:'App Analytics not refreshed. Prior official evidence retains its independent cutoff; no request created and no missing metrics inferred.'}});
});
