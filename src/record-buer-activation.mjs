import {fileURLToPath} from 'node:url';
import {JsonStore} from './store.mjs';
const at=new Date().toISOString();
await new JsonStore(fileURLToPath(new URL('../data/state.json',import.meta.url))).mutate(state=>{
 const site=state.websites.find(s=>s.id==='site-human-design');
 if(site?.url!=='https://buer.wonderelian.com/')throw new Error('Unexpected Buer identity');
 site.instrumentation={status:'enabled_verified',verified_at:at,source:'Public HTTPS hash and browser iframe configuration readback',artifact_commit:'439e9fe4d9c5c67534729709150ef0585ca64a75',scope:'Website page views and consent-gated chart_completion; no birth details or conversation content'};
 for(const op of state.website_operations.filter(o=>o.website_id===site.id))Object.assign(op,{next_action:'Wait for processed GA4 observations in the existing daily read-only sync; do not substitute verification visits or legacy hostname metrics.',next_action_zh:'通过现有每日只读同步等待 GA4 正式数据，不把验收访问或旧域名流量当作新站增长。'});
 state.audit.unshift({id:crypto.randomUUID(),at,actor:'Codex',source:'explicit_owner_approval_and_public_verification',app_id:'know-yourself',action:'enable_buer_hostname_analytics',result:{instrumentation:'enabled_verified',official_processed_metrics:null,production_repository:'Buer-only analytics delta',legacy_site_unchanged:true},status:'success'});
});
console.log('BUER_INSTRUMENTATION_VERIFIED_METRICS_REMAIN_NULL');
