import { fileURLToPath } from 'node:url';
import { JsonStore } from './store.mjs';
import { ProductAnalyticsProvider, PRODUCT_PROJECTS, pendingProductSnapshot } from './providers/product-analytics-provider.mjs';
import { loadStyleAtlasIosStreamId } from './product-analytics-config.mjs';

// Bounded refresh for this product only; normal portfolio sync also includes it.
export async function syncStyleAtlasUsage(state, {provider = new ProductAnalyticsProvider(), now = new Date(), loadStream = loadStyleAtlasIosStreamId} = {}) {
  const day = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  const shift = n => new Date(Date.parse(`${day}T00:00:00Z`) + n * 86400000).toISOString().slice(0,10);
  state.product_analytics ??= pendingProductSnapshot(now.toISOString());
  const previous = state.product_analytics.projects.find(p => p.id === 'style-atlas') ?? {};
  const project = { ...PRODUCT_PROJECTS.find(p => p.id === 'style-atlas'), status: 'partial', ios: {status:'waiting_for_firebase_link',events:[],period_start:null,period_end:null} };
  if (previous.legacy_h5) project.legacy_h5 = previous.legacy_h5;
  else if (previous.h5 && !previous.h5.surface) project.legacy_h5 = previous.h5;
  for (const surface of ['h5','ios']) {
    try {
      const stream = surface === 'ios' ? await loadStream() : undefined;
      if (surface === 'ios' && !stream) continue;
      project[surface] = await provider.fetchStyleAtlasUsage({startDate:shift(-28),endDate:shift(-1),iosStreamId:stream});
      if (project[surface].content?.error_code && previous[surface]?.content?.rows?.length) project[surface].content = {...previous[surface].content,status:'unavailable',error_code:project[surface].content.error_code};
    } catch(error) { project[surface] = {...(previous[surface] ?? {events:[],period_start:null,period_end:null}),status:'unavailable',error_code:error.code??'PROVIDER_UNAVAILABLE'}; }
  }
  project.status = project.h5.status;
  state.product_analytics.projects = state.product_analytics.projects.map(p => p.id === project.id ? project : p);
  if (!state.product_analytics.projects.some(p => p.id === project.id)) state.product_analytics.projects.push(project);
  state.product_analytics.generated_at = now.toISOString();
  const bothConnected = [project.h5, project.ios].every(surface => ['collecting','waiting_for_events'].includes(surface.status));
  state.audit.unshift({id:crypto.randomUUID(),at:now.toISOString(),actor:'Codex',app_id:'style-atlas',source:'ga4_product_usage',action:'sync_style_atlas_usage',result:{h5:project.h5.status,ios:project.ios.status},status:bothConnected?'success':'partial'});
  return project;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const store = new JsonStore(fileURLToPath(new URL('../data/state.json',import.meta.url)));
  const result = await store.mutate(state => syncStyleAtlasUsage(state));
  console.log(JSON.stringify({h5:result.h5.status,ios:result.ios.status,content:result.h5.content?.status}));
}
