import test from 'node:test';
import assert from 'node:assert/strict';
import { ProductAnalyticsProvider } from '../src/providers/product-analytics-provider.mjs';
import { loadStyleAtlasIosStreamId } from '../src/product-analytics-config.mjs';
import { usageView } from '../public/product-usage.js';
import { syncProductAnalyticsState } from '../src/sync-product-analytics.mjs';
import { syncStyleAtlasUsage } from '../src/sync-style-atlas-usage.mjs';
test('bounded sync audits unavailable reporting as partial even with an iOS stream', async () => {
  const state={audit:[],product_analytics:{projects:[]}};
  await syncStyleAtlasUsage(state,{loadStream:async()=>'1234',provider:{fetchStyleAtlasUsage:async({iosStreamId})=>{if(!iosStreamId)throw new Error('offline');return {status:'waiting_for_events',events:[]};}}});
  assert.equal(state.audit[0].status,'partial');
  assert.equal(state.audit[0].result.h5,'unavailable');
});
test('Style Atlas exact hostname and dedicated native stream; no fabricated metrics', async () => {
  const p = new ProductAnalyticsProvider(), calls = [];
  p.runReport = async o => { calls.push(o); return { rows: [], metadata: { timeZone: 'Asia/Shanghai' } }; };
  const h5 = await p.fetchStyleAtlasUsage({ startDate: '2026-09-03', endDate: '2026-09-30' });
  assert.ok(calls.every(o => o.dimensionFilter.filter.stringFilter.value === 'style-atlas.wonderelian.com'));
  assert.equal(h5.revenue.revenue, null); assert.equal(h5.overview, null); assert.equal(h5.status, 'waiting_for_events');
  calls.length = 0;
  await p.fetchStyleAtlasUsage({ iosStreamId: '1234' });
  assert.ok(calls.every(o => o.dimensionFilter.andGroup.expressions[0].filter.stringFilter.value === '1234'));
  assert.ok(calls.every(o => o.dimensionFilter.andGroup.expressions[1].filter.stringFilter.value === 'iOS'));
  await assert.rejects(p.fetchStyleAtlasUsage({ iosStreamId: 'all' }));
});
test('duration sums and style preferences isolate atlas events', async () => {
  const p = new ProductAnalyticsProvider();
  p.runReport = async o => ({ dimensionHeaders: o.dimensions.map(name => ({name})), metricHeaders: o.metrics.map(name => ({name})), rows: o.dimensions.includes('eventName') ? ['atlas_v1_reading_time','yixiu_v2_listen_time'].map(event => ({ dimensionValues: o.dimensions.map(name => ({value:name === 'eventName' ? event : name === 'contentId' ? 'bauhaus' : '20260930'})), metricValues: o.metrics.map(name => ({value:name==='eventValue'?'60':'2'})) })) : [] });
  const result = await p.fetchStyleAtlasUsage({});
  assert.equal(result.events.length, 1); assert.equal(result.events[0].seconds, 60);
  assert.equal(result.content.rows[0].style, 'bauhaus'); assert.equal(result.content.rows.length, 1);
});
test('stream mapping cannot reuse unrelated products or properties', async () => {
  const readFileFn = async () => JSON.stringify({ propertyId:'549913650',iosStreamId:'1',buerIosStreamId:'2' });
  assert.equal(await loadStyleAtlasIosStreamId({env:{GA4_PROPERTY_ID:'549913650'},readFileFn}),null);
  await assert.rejects(loadStyleAtlasIosStreamId({env:{STYLE_ATLAS_IOS_STREAM_ID:'oops'}}));
});
test('failed Style Atlas sync retains previous evidence', async () => {
  const state = {audit:[],product_analytics:{projects:[{id:'style-atlas',h5:{events:[{event:'atlas_v1_style_view',count:4}],verified_at:'2026-09-30'}}]}};
  const r = await syncProductAnalyticsState(state,{provider:{health:async()=>({status:'blocked'}),fetchStyleAtlasUsage:async()=>{throw new Error('offline');}},iosStreamId:null,buerIosStreamId:null,styleAtlasIosStreamId:null});
  const atlas=r.projects.find(p=>p.id==='style-atlas');assert.equal(atlas.h5.status,'unavailable');assert.equal(atlas.h5.events[0].count,4);
});
test('bilingual usage panel preserves pending, null and honest outcome distinctions', () => {
  const snapshot={projects:[{id:'style-atlas',name:'Style Atlas',name_zh:'艺术风格图鉴',status:'waiting_for_events',h5:{events:[],content:{rows:[]}},ios:{status:'waiting_for_firebase_link',events:[]}}]};
  const zh=usageView(snapshot,{projectId:'style-atlas',locale:'zh'});
  assert.match(zh,/用户与阅读/);assert.match(zh,/风格偏好/);assert.match(zh,/不代表 App 已安装/);assert.match(zh,/—/);
  const en=usageView(snapshot,{projectId:'style-atlas',surface:'ios'});assert.match(en,/Firebase registration/);assert.doesNotMatch(en,/connection verified/);
});
