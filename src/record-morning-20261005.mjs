import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { JsonStore } from './store.mjs';
import { fileURLToPath } from 'node:url';
const store = new JsonStore(fileURLToPath(new URL('../data/state.json', import.meta.url)));
const ledger = JSON.parse(await readFile(new URL('../../assets/yixiu-20261004/publication-status.json', import.meta.url), 'utf8'));
await store.mutate(state => {
  const upstream=JSON.parse(execFileSync('git',['show','origin/main:data/state.json'],{maxBuffer:30_000_000}));
  for(const row of upstream.audit??[])if(!state.audit.some(a=>a.id===row.id))state.audit.push(row);
  let inserted=0;
  for(const [channel,item] of Object.entries(ledger.platforms)) {
    if(item.status!=='published_verified'||!item.url||state.content.some(row=>row.url===item.url||row.publish_url===item.url))continue;
    state.content.push({id:`yixiu-${channel}-${ledger.content_id}`,app_id:'yixiu-meditation',channel_id:channel,type:channel==='youtube'?'community_image_post':channel==='pinterest'?'image_pin':'image_post',title:'LEAVE TOMORROW ON PAPER.',status:'published',published_at:ledger.date,url:item.url,publish_url:item.url,landing_url:['pinterest','youtube'].includes(channel)?`https://yixiu.wonderelian.com/sleep-sounds/?utm_source=${channel}&utm_medium=organic_social&utm_campaign=sleep_sounds&utm_content=${ledger.content_id}`:null,impressions:null,engagements:null,outbound_clicks:null,first_time_downloads:null,views:null,likes:null,comments:null,shares:null,saves:null,landing_page_visits:null,attributed_conversions:null,product_page_views:null,measurement_status:'collecting',campaign_id:null,app_store_campaign_url:null});inserted++;
  }
  state.audit.unshift({id:crypto.randomUUID(),at:new Date().toISOString(),actor:'Codex',source:'2026-10-05 morning heartbeat; official GA4; October 4 verified publication ledger',action:'morning_data_and_publication_reconciliation',result:{website_data_through:'2026-10-04',records_inserted:inserted,verified_publication_count:3,tiktok_unconfirmed:true,apple_configuration_present:0,apple_api_verified:false,apple_requests_created:0,app_snapshot_preserved:true,ga4_configuration_present:true,ga4_credential_mode600:true},status:'partial',error:{code:'APPLE_CONFIGURATION_MISSING',message:'Independent App Analytics snapshot retained; current request counts unverified, not zero.'}});
});
