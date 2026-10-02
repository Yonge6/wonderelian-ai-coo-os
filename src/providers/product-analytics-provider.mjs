import { Ga4WebsiteProvider } from "./ga4-website-provider.mjs";

export const PRODUCT_PROJECTS = [
  { id: "yixiu", name: "Yixiu Meditation", name_zh: "一休冥想", hostname: "yixiu.wonderelian.com", website_id: "site-yixiu" },
  { id: "wendao", name: "Wendao", name_zh: "三慢问道", hostname: "wendao.wonderelian.com" },
  { id: "xiazi", name: "Xiazi", name_zh: "虾子曰", hostname: "xiazishuo.com" },
  { id: "style-atlas", name: "Style Atlas", name_zh: "艺术风格图鉴", hostname: "style-atlas.wonderelian.com" },
  { id: "maker", name: "Maker Business Lab", name_zh: "Maker Business Lab", hostname: "maker.wonderelian.com" },
  { id: "wonderelian", name: "WonderElian", name_zh: "WonderElian", hostname: "wonderelian.com", web_only: true },
  { id: "buer", name: "Buer Within", name_zh: "不二见己", hostname: "buer.wonderelian.com" },
];
const numeric = value => value === undefined || value === null || value === "" ? null : Number.isFinite(Number(value)) ? Number(value) : null;
export function reportRows(report) {
  return (report.rows ?? []).map(row => Object.fromEntries([
    ...(report.dimensionHeaders ?? []).map((key, i) => [key.name, row.dimensionValues?.[i]?.value ?? null]),
    ...(report.metricHeaders ?? []).map((key, i) => [key.name, numeric(row.metricValues?.[i]?.value)]),
  ]));
}
export function normalizeUsageEvents(report) {
  return reportRows(report).filter(row => /^yixiu_v2_[a-z_]+$/.test(row.eventName)).map(row => ({
    event: row.eventName, count: row.eventCount, users: row.totalUsers,
    seconds: row.eventName === "yixiu_v2_listen_time" ? row.eventValue : null,
  }));
}
export function pendingProductSnapshot(now = new Date().toISOString()) {
  return { schema_version: 1, generated_at: now, source: "Google Analytics 4 Data API", projects: PRODUCT_PROJECTS.map(project => ({ ...project, status: "planned", h5: null, ios: null })) };
}
export class ProductAnalyticsProvider extends Ga4WebsiteProvider {
  async fetchMakerUsage({ startDate, endDate, surface = "h5" }) {
    if (!['h5', 'ios'].includes(surface)) throw Object.assign(new Error('Invalid Maker surface'), { code: 'INVALID_SURFACE' });
    const prefix = surface === 'ios' ? 'maker_ios_v1_' : 'maker_v1_';
    const scope = { andGroup: { expressions: [
      { filter: { fieldName: 'hostName', stringFilter: { matchType: 'EXACT', value: 'maker.wonderelian.com', caseSensitive: true } } },
      { filter: { fieldName: 'eventName', stringFilter: { matchType: 'FULL_REGEXP', value: `${prefix}[a-z_]+`, caseSensitive: true } } },
    ] } };
    const options = { startDate, endDate, dimensionFilter: scope };
    const events = await this.runReport({ ...options, dimensions: ['eventName'], metrics: ['eventCount', 'totalUsers'] });
    const daily = await this.runReport({ ...options, dimensions: ['date', 'eventName'], metrics: ['eventCount', 'totalUsers'] });
    const overview = await this.runReport({ ...options, dimensions: [], metrics: ['totalUsers', 'sessions', 'engagedSessions', 'userEngagementDuration'] });
    const normalize = report => reportRows(report)
      .filter(row => row.eventName?.startsWith(prefix))
      .map(row => ({ event: row.eventName, count: row.eventCount, users: row.totalUsers, ...(row.date ? { date: row.date } : {}) }));
    const rows = normalize(events);
    return {
      status: rows.length ? 'collecting' : 'waiting_for_events',
      source: 'Google Analytics 4 Data API',
      collection_method: surface === 'ios' ? 'consented_ios_webview' : 'website',
      hostname: 'maker.wonderelian.com', surface, period_start: startDate, period_end: endDate,
      verified_at: new Date().toISOString(), timezone: events.metadata?.timeZone ?? null,
      overview: reportRows(overview)[0] ?? null, events: rows, daily: normalize(daily),
      data_quality: { thresholded: [events, daily, overview].some(report => report.metadata?.subjectToThresholding), sampled: [events, daily, overview].some(report => report.metadata?.samplingMetadatas?.length) },
      retention: { d1: null, d7: null }, revenue: { revenue: null, paid_conversions: null },
    };
  }
  async fetchStyleAtlasUsage({ startDate, endDate, iosStreamId }) {
    if (iosStreamId && !/^\d+$/.test(iosStreamId)) throw Object.assign(new Error('Invalid stream ID'), { code: 'INVALID_STREAM' });
    const scope = iosStreamId ? { andGroup: { expressions: [
      { filter: { fieldName: 'streamId', stringFilter: { matchType: 'EXACT', value: iosStreamId } } },
      { filter: { fieldName: 'platform', stringFilter: { matchType: 'EXACT', value: 'iOS' } } },
    ] } } : { filter: { fieldName: 'hostName', stringFilter: { matchType: 'EXACT', value: 'style-atlas.wonderelian.com', caseSensitive: true } } };
    const options = { startDate, endDate, dimensionFilter: scope };
    const events = await this.runReport({ ...options, dimensions: ['eventName'], metrics: ['eventCount', 'totalUsers', 'eventValue'] });
    const daily = await this.runReport({ ...options, dimensions: ['date', 'eventName'], metrics: ['eventCount', 'totalUsers', 'eventValue'] });
    const overview = await this.runReport({ ...options, dimensions: [], metrics: ['totalUsers', 'sessions'] });
    const normalize = report => reportRows(report).filter(r => /^atlas_v1_[a-z_]+$/.test(r.eventName)).map(r => ({ event: r.eventName, count: r.eventCount, users: r.totalUsers, ...(r.date ? { date: r.date } : {}), seconds: ['atlas_v1_active_time', 'atlas_v1_reading_time'].includes(r.eventName) ? r.eventValue : null }));
    const rows = normalize(events);
    const result = { status: rows.length ? 'collecting' : 'waiting_for_events', source: 'Google Analytics 4 Data API', surface: iosStreamId ? 'ios' : 'h5', hostname: iosStreamId ? null : 'style-atlas.wonderelian.com', period_start: startDate, period_end: endDate, verified_at: new Date().toISOString(), timezone: events.metadata?.timeZone ?? null, events: rows, daily: normalize(daily), overview: reportRows(overview)[0] ?? null, data_quality: { thresholded: [events, daily, overview].some(r => r.metadata?.subjectToThresholding), sampled: [events, daily, overview].some(r => r.metadata?.samplingMetadatas?.length) }, content: { status: 'waiting_for_custom_dimension', rows: [] }, retention: { d1: null, d7: null }, revenue: { revenue: null, paid_conversions: null } };
    try {
      const content = await this.runReport({ ...options, dimensions: ['contentId', 'eventName'], metrics: ['eventCount', 'totalUsers', 'eventValue'] });
      result.content = { status: 'verified', rows: reportRows(content).filter(r => /^atlas_v1_[a-z_]+$/.test(r.eventName) && r.contentId && r.contentId !== '(not set)').map(r => ({ style: r.contentId, event: r.eventName, count: r.eventCount, users: r.totalUsers, seconds: r.eventName === 'atlas_v1_reading_time' ? r.eventValue : null })) };
      result.data_quality.thresholded ||= Boolean(content.metadata?.subjectToThresholding);
      result.data_quality.sampled ||= Boolean(content.metadata?.samplingMetadatas?.length);
    } catch (error) { result.content.error_code = error.code ?? 'DIMENSION_UNAVAILABLE'; }
    return result;
  }
  async fetchBuerUsage({startDate,endDate,iosStreamId}) {
    if(iosStreamId&&!/^\d+$/.test(iosStreamId))throw Object.assign(new Error('Invalid stream ID'),{code:'INVALID_STREAM'});
    const scope=iosStreamId?{andGroup:{expressions:[
      {filter:{fieldName:'streamId',stringFilter:{matchType:'EXACT',value:iosStreamId}}},
      {filter:{fieldName:'platform',stringFilter:{matchType:'EXACT',value:'iOS'}}},
    ]}}:{filter:{fieldName:'hostName',stringFilter:{matchType:'EXACT',value:'buer.wonderelian.com',caseSensitive:true}}};
    const options={startDate,endDate,dimensionFilter:scope};
    const events=await this.runReport({...options,dimensions:['eventName'],metrics:['eventCount','totalUsers','eventValue']});
    const daily=await this.runReport({...options,dimensions:['date','eventName'],metrics:['eventCount','totalUsers','eventValue']});
    const overview=await this.runReport({...options,dimensions:[],metrics:['totalUsers','sessions','screenPageViews']});
    const normalize=report=>reportRows(report).filter(r=>/^buer_v1_[a-z_]+$/.test(r.eventName)).map(r=>({event:r.eventName,count:r.eventCount,users:r.totalUsers,...(r.date?{date:r.date}:{}),seconds:['buer_v1_active_time','buer_v1_chat_latency'].includes(r.eventName)?r.eventValue:null}));
    const rows=normalize(events);
    return {status:rows.length?'collecting':'waiting_for_events',source:'Google Analytics 4 Data API',hostname:iosStreamId?null:'buer.wonderelian.com',surface:iosStreamId?'ios':'h5',period_start:startDate,period_end:endDate,verified_at:new Date().toISOString(),timezone:events.metadata?.timeZone??null,events:rows,daily:normalize(daily),overview:reportRows(overview)[0]??null,data_quality:{thresholded:[events,daily,overview].some(r=>r.metadata?.subjectToThresholding),sampled:[events,daily,overview].some(r=>r.metadata?.samplingMetadatas?.length)},retention:{d1:null,d7:null},revenue:{revenue:null,paid_conversions:null,trial_starts:null}};
  }
  async fetchProjectUsage({ project, startDate, endDate }) {
    if (!PRODUCT_PROJECTS.some(item => item.id === project.id && item.hostname === project.hostname)) throw new Error("Unknown product hostname");
    const options = {startDate, endDate, dimensionFilter:{filter:{fieldName:"hostName",inListFilter:{values:[project.hostname, `www.${project.hostname}`],caseSensitive:false}}}};
    const overview = await this.runReport({...options,dimensions:[],metrics:["totalUsers","activeUsers","screenPageViews","sessions","engagedSessions","userEngagementDuration"]});
    const events = await this.runReport({...options,dimensions:["eventName"],metrics:["eventCount","totalUsers"]});
    const daily = await this.runReport({...options,dimensions:["date"],metrics:["totalUsers","screenPageViews","sessions"]});
    const reports=[overview,events,daily];
    const rows=reportRows(events).map(row=>({event:row.eventName,count:row.eventCount,users:row.totalUsers}));
    return {status:rows.length?"collecting":"waiting_for_events",source:"Google Analytics 4 Data API",hostname:project.hostname,period_start:startDate,period_end:endDate,verified_at:new Date().toISOString(),timezone:overview.metadata?.timeZone??null,overview:reportRows(overview)[0]??null,events:rows,daily:reportRows(daily),data_quality:{thresholded:reports.some(r=>r.metadata?.subjectToThresholding),sampled:reports.some(r=>r.metadata?.samplingMetadatas?.length)},retention:{d1:null,d7:null},revenue:{trial_starts:null,paid_conversions:null,revenue:null}};
  }
  async fetchUsage({ startDate, endDate, iosStreamId }) {
    if (iosStreamId && !/^\d+$/.test(iosStreamId)) throw Object.assign(new Error("Invalid stream ID"), {code:"INVALID_STREAM"});
    const scope = iosStreamId ? {andGroup:{expressions:[
      {filter:{fieldName:"streamId",stringFilter:{matchType:"EXACT",value:iosStreamId}}},
      {filter:{fieldName:"platform",stringFilter:{matchType:"EXACT",value:"iOS"}}},
    ]}} : { filter: { fieldName: "hostName", stringFilter: { matchType: "EXACT", value: "yixiu.wonderelian.com", caseSensitive: true } } };
    const options = { startDate, endDate, dimensionFilter: scope };
    const events = await this.runReport({ ...options, dimensions: ["eventName"], metrics: ["eventCount", "totalUsers", "eventValue"] });
    const daily = await this.runReport({ ...options, dimensions: ["date", "eventName"], metrics: ["eventCount", "totalUsers", "eventValue"] });
    const overview = await this.runReport({ ...options, dimensions: [], metrics: ["totalUsers", "sessions"] });
    const normalized = normalizeUsageEvents(events);
    const result = {
      status: normalized.length ? "collecting" : "waiting_for_events",
      period_start: startDate, period_end: endDate,
      timezone: events.metadata?.timeZone ?? null,
      verified_at: new Date().toISOString(), source: "Google Analytics 4 Data API",
      data_quality: { thresholded: Boolean(events.metadata?.subjectToThresholding), sampled: Boolean(events.metadata?.samplingMetadatas?.length) },
      overview: reportRows(overview)[0] ?? null,
      events: normalized,
      legacy_events: reportRows(events).filter(row => ["yixiu_playback_start", "yixiu_download_click"].includes(row.eventName)).map(row => ({ event: row.eventName, count: row.eventCount, users: row.totalUsers })),
      daily: reportRows(daily).filter(row => row.eventName.startsWith("yixiu_v2_")).map(row => ({ date: row.date, event: row.eventName, count: row.eventCount, users: row.totalUsers, seconds: row.eventName === "yixiu_v2_listen_time" ? row.eventValue : null })),
      content: { status: "waiting_for_custom_dimension", rows: [] },
      retention: { status: "cohort_integration_pending", d1: null, d7: null },
      revenue: { status: "waiting_for_apple", paid_conversions: null, trial_starts: null, revenue: null },
    };
    try {
      const scenes = await this.runReport({ ...options, dimensions: ["customEvent:scene_id", "eventName"], metrics: ["eventCount", "totalUsers", "eventValue"] });
      const rows = reportRows(scenes).filter(row => row["customEvent:scene_id"] && row["customEvent:scene_id"] !== "(not set)" && row.eventName.startsWith("yixiu_v2_")).map(row => ({ scene: row["customEvent:scene_id"], event: row.eventName, count: row.eventCount, users: row.totalUsers, seconds: row.eventName === "yixiu_v2_listen_time" ? row.eventValue : null }));
      result.content = { status: rows.length ? "collecting" : "waiting_for_events", rows };
    } catch (error) { result.content.error_code = error.code ?? "CUSTOM_DIMENSION_UNAVAILABLE"; }
    return result;
  }
}
