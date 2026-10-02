import { JsonStore } from './store.mjs';
import { fileURLToPath } from 'node:url';
const store=new JsonStore(fileURLToPath(new URL('../data/state.json',import.meta.url)));
await store.mutate(state=>{
 const id='morning-audit-20261002';
 if(state.audit.some(x=>x.id===id))return;
 state.audit.unshift({id,at:new Date().toISOString(),actor:'Codex',source:'2026-10-02 morning heartbeat; official GA4 and safe launchctl preflight',action:'verify_daily_data_boundaries',result:{website_data_through:'2026-10-01',apple_configuration_present:0,apple_configuration_required:3,apple_api_verified:false,apple_requests_created:0,app_snapshot_preserved:true,publication_log_new_verified_urls_for_previous_day:0,content_count_preserved:true},status:'partial',error:{code:'APPLE_CONFIGURATION_MISSING',message:'App Analytics refresh unavailable; previous official snapshot retained with independent cutoff.'}});
});
