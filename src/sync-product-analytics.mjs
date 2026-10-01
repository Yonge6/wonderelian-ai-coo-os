import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";
import { ProductAnalyticsProvider, pendingProductSnapshot } from "./providers/product-analytics-provider.mjs";
import { loadYixiuIosStreamId, loadBuerIosStreamId, loadStyleAtlasIosStreamId } from "./product-analytics-config.mjs";

export async function syncProductAnalyticsState(state, { provider = new ProductAnalyticsProvider(), now = new Date(), iosStreamId, loadStreamId = loadYixiuIosStreamId, buerIosStreamId, loadBuerStreamId = loadBuerIosStreamId, styleAtlasIosStreamId, loadStyleAtlasStreamId = loadStyleAtlasIosStreamId } = {}) {
  const snapshot = pendingProductSnapshot(now.toISOString());
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const shift = offset => new Date(Date.parse(`${day}T00:00:00Z`) + offset * 86400000).toISOString().slice(0, 10);
  const project = snapshot.projects[0];
  project.status = "partial";
  project.ios = { status: "waiting_for_firebase_link", events: [], period_start: null, period_end: null };
  try {
    const health = await provider.health();
    if (health.status === "blocked") throw Object.assign(new Error("Authentication unavailable"), { code: "AUTH_REQUIRED" });
    project.h5 = await provider.fetchUsage({ startDate: shift(-28), endDate: shift(-1) });
    const previousContent = state.product_analytics?.projects?.find(item=>item.id==="yixiu")?.h5?.content;
    if (project.h5.content?.error_code && previousContent?.rows?.length) project.h5.content = {...previousContent,status:"unavailable",error_code:project.h5.content.error_code};
  } catch (error) {
    const previous = state.product_analytics?.projects?.find(item => item.id === "yixiu")?.h5;
    project.h5 = { ...(previous ?? { events: [], period_start: null, period_end: null }), status: "unavailable", error_code: error.code ?? "PROVIDER_UNAVAILABLE" };
  }
  if (iosStreamId === undefined) {
    try { iosStreamId = await loadStreamId(); }
    catch (error) { project.ios = { ...project.ios, status: "unavailable", error_code: error.code ?? "INVALID_USAGE_CONFIG" }; }
  }
  if (iosStreamId) {
    try { project.ios = await provider.fetchUsage({startDate:shift(-28),endDate:shift(-1),iosStreamId}); }
    catch (error) {
      const previous=state.product_analytics?.projects?.find(item=>item.id==="yixiu")?.ios;
      project.ios={...(previous??{events:[],period_start:null,period_end:null}),status:"unavailable",error_code:error.code??"PROVIDER_UNAVAILABLE"};
    }
  }
  for (const item of snapshot.projects.slice(1)) {
    if (item.id === 'style-atlas') {
      const previous = state.product_analytics?.projects?.find(p => p.id === item.id);
      if (previous?.legacy_h5) item.legacy_h5 = previous.legacy_h5;
      else if (previous?.h5 && !previous.h5.surface) item.legacy_h5 = previous.h5;
    }
    item.ios = item.web_only ? null : {status:"waiting_for_firebase_link",events:[],period_start:null,period_end:null};
    try {
      item.h5 = item.id === 'style-atlas' ? await provider.fetchStyleAtlasUsage({startDate:shift(-28),endDate:shift(-1)}) : item.id==='buer' ? await provider.fetchBuerUsage({startDate:shift(-28),endDate:shift(-1)}) : await provider.fetchProjectUsage({project:item,startDate:shift(-28),endDate:shift(-1)});
      const previousContent = state.product_analytics?.projects?.find(p => p.id === item.id)?.h5?.content;
      if (item.h5.content?.error_code && previousContent?.rows?.length) item.h5.content = { ...previousContent, status: 'unavailable', error_code: item.h5.content.error_code };
      item.status = item.h5.status;
    } catch (error) {
      const previous = state.product_analytics?.projects?.find(p=>p.id===item.id)?.h5;
      item.h5 = {...(previous??{events:[],overview:null,period_start:null,period_end:null}),status:"unavailable",error_code:error.code??"PROVIDER_UNAVAILABLE"};
      item.status = "unavailable";
    }
    if (item.id === 'style-atlas') {
      try {
        const stream = styleAtlasIosStreamId === undefined ? await loadStyleAtlasStreamId() : styleAtlasIosStreamId;
        if (stream) item.ios = await provider.fetchStyleAtlasUsage({ startDate: shift(-28), endDate: shift(-1), iosStreamId: stream });
      } catch (error) {
        const previous = state.product_analytics?.projects?.find(p => p.id === item.id)?.ios;
        item.ios = { ...(previous ?? { events: [], period_start: null, period_end: null }), status: 'unavailable', error_code: error.code ?? 'PROVIDER_UNAVAILABLE' };
      }
    }
    if(item.id==='buer') {
      try {
        const stream=buerIosStreamId===undefined?await loadBuerStreamId():buerIosStreamId;
        if(stream)item.ios=await provider.fetchBuerUsage({startDate:shift(-28),endDate:shift(-1),iosStreamId:stream});
      } catch(error) {
        const previous=state.product_analytics?.projects?.find(p=>p.id==='buer')?.ios;
        item.ios={...(previous??{events:[],period_start:null,period_end:null}),status:'unavailable',error_code:error.code??'PROVIDER_UNAVAILABLE'};
      }
    }
  }
  state.product_analytics = snapshot;
  state.audit.unshift({ id: crypto.randomUUID(), at: now.toISOString(), actor: "AI COO OS", app_id: null, source: "ga4_product_usage", action: "sync_product_usage", result: { status: project.h5.status, project_count: snapshot.projects.length }, status: snapshot.projects.some(p=>p.h5?.status==="unavailable" || p.ios?.status==="unavailable") ? "partial" : "success" });
  return snapshot;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const store = new JsonStore(fileURLToPath(new URL("../data/state.json", import.meta.url)));
  const snapshot = await store.mutate(state => syncProductAnalyticsState(state));
  console.log(`PRODUCT_USAGE_SYNC ${snapshot.projects[0].h5.status}`);
}
