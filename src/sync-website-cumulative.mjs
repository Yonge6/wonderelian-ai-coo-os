import {fileURLToPath} from 'node:url';
import {JsonStore} from './store.mjs';
import {Ga4WebsiteProvider} from './providers/ga4-website-provider.mjs';

export async function syncWebsiteCumulative(state,{provider=new Ga4WebsiteProvider(),now=new Date()}={}){
  const dates=[...new Set((state.website_metrics??[]).filter(row=>row.verification_type==='api_verified'&&row.period_start===row.period_end&&row.value!==null).map(row=>row.period_end))].sort();
  if(!dates.length)return {status:'waiting',periods:0};
  state.website_cumulative??=[];
  const startDate=dates[0],latest=dates.at(-1),pending=dates.filter(end=>end===latest||!state.website_cumulative.some(row=>row.period_start===startDate&&row.period_end===end&&row.verification_type==='api_verified'));
  let count=0;
  for(const endDate of pending){
    const snapshot=await provider.fetchCumulative({websites:state.websites,startDate,endDate,now:now.toISOString()});
    state.website_cumulative=state.website_cumulative.filter(row=>row.period_end!==endDate);
    state.website_cumulative.push(snapshot);count++;
  }
  state.audit.unshift({id:crypto.randomUUID(),at:now.toISOString(),actor:'Codex',source:'Google Analytics 4 Data API',action:'sync_cumulative_website_analytics',input:{period_start:startDate,period_end:latest,external_writes:false},result:{periods:count,uv_definition:'GA4 interval active users, deduplicated across days and configured hosts'},status:'success'});
  return {status:'succeeded',periods:count,period_start:startDate,period_end:latest};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  const store=new JsonStore(fileURLToPath(new URL('../data/state.json',import.meta.url)));
  console.log(JSON.stringify(await store.mutate(state=>syncWebsiteCumulative(state))));
}
