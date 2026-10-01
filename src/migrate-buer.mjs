import {fileURLToPath} from 'node:url';
import {JsonStore} from './store.mjs';

export function migrateBuer(state, now=new Date().toISOString()) {
  const site=state.websites.find(row=>row.id==='site-human-design');
  const app=state.apps.find(row=>row.id==='know-yourself');
  if(!site||!app) throw new Error('Missing existing Human Design identity');
  if(site.url==='https://buer.wonderelian.com/') return {status:'unchanged'};
  // Preserve original provider evidence and totals. Never relabel legacy visits.
  state.website_history??=[];
  state.website_history.push({archived_at:now,reason:'Buer hostname migration; original evidence retained',website:structuredClone(site),metrics:state.website_metrics.filter(r=>r.website_id===site.id),observations:state.website_observations.filter(r=>r.website_id===site.id),cumulative:structuredClone(state.website_cumulative??[])});
  state.website_metrics=state.website_metrics.filter(r=>r.website_id!==site.id);
  state.website_observations=state.website_observations.filter(r=>r.website_id!==site.id);
  // Cross-site deduplicated totals cannot be obtained by subtracting legacy UV.
  // Re-query all cumulative periods from GA4 for the new seven-host portfolio.
  state.website_cumulative=[];
  const description='Your AI growth companion Doudoulong. Explore Human Design, HUMAN 3.0 interviews and personal experiences to choose actions and reflect on progress.';
  const description_zh='你的专属 AI 成长伙伴 豆豆龙。结合人类图自我观察、HUMAN 3.0 四领域访谈与个人经历，明确行动并持续复盘。';
  Object.assign(app,{name:'Buer Within',name_zh:'不二见己',website_url:'https://buer.wonderelian.com/',description,description_zh,positioning:'AI growth companion',updated_at:now});
  Object.assign(site,{name:'Buer Within',name_zh:'不二见己',url:'https://buer.wonderelian.com/',description,description_zh,health_status:'pending_check',analytics_status:'not_connected',last_checked_at:null});
  for(const op of state.website_operations.filter(r=>r.website_id===site.id)) Object.assign(op,{title:'Measure Buer Within discovery and meaningful use',title_zh:'衡量不二见己的发现与真实使用',next_action:'Correct the product-side analytics hostname guard, then verify events with the official GA4 API.',next_action_zh:'在产品仓库修正统计脚本的域名限制，再通过官方 GA4 API 验证事件。',page_views:null,cta_clicks:null,conversions:null});
  state.audit.unshift({id:crypto.randomUUID(),at:now,actor:'Codex',app_id:app.id,source:'active_user_authorization',action:'migrate_human_design_to_buer',result:{status:'registered',legacy_evidence:'archived',new_hostname_observations:null,product_repository_changes:false},status:'success'});
  return {status:'migrated'};
}
if(process.argv[1]===fileURLToPath(import.meta.url)) console.log(await new JsonStore(fileURLToPath(new URL('../data/state.json',import.meta.url))).mutate(state=>migrateBuer(state)));
