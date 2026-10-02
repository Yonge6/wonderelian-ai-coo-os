import test from 'node:test';
import assert from 'node:assert/strict';
import { ProductAnalyticsProvider, pendingProductSnapshot } from '../src/providers/product-analytics-provider.mjs';
import { syncProductAnalyticsState } from '../src/sync-product-analytics.mjs';
import { usageView } from '../public/product-usage.js';

test('Maker exposes separate H5 and consented iOS WebView reports', async () => {
  const provider=new ProductAnalyticsProvider(),calls=[];
  provider.runReport=async options=>{calls.push(options);return {rows:[],metadata:{timeZone:'Asia/Shanghai'}};};
  const h5=await provider.fetchMakerUsage({startDate:'2026-09-01',endDate:'2026-09-30',surface:'h5'});
  assert.equal(h5.surface,'h5');
  assert.ok(calls.every(call=>call.dimensionFilter.andGroup.expressions.some(e=>e.filter.fieldName==='eventName'&&e.filter.stringFilter.value==='maker_v1_[a-z_]+')));
  calls.length=0;
  const ios=await provider.fetchMakerUsage({startDate:'2026-09-01',endDate:'2026-09-30',surface:'ios'});
  assert.equal(ios.collection_method,'consented_ios_webview');
  assert.ok(calls.every(call=>call.dimensionFilter.andGroup.expressions.some(e=>e.filter.stringFilter?.value==='maker_ios_v1_[a-z_]+')));
  await assert.rejects(provider.fetchMakerUsage({surface:'android'}),{code:'INVALID_SURFACE'});
});

test('Maker sync queries both surfaces without inventing native usage', async () => {
  const state={audit:[],product_analytics:{projects:[]}};
  const provider={health:async()=>({status:'configured'}),fetchUsage:async()=>({status:'waiting_for_events',events:[]}),fetchProjectUsage:async()=>({status:'waiting_for_events',events:[]}),fetchStyleAtlasUsage:async()=>({status:'waiting_for_events',events:[]}),fetchBuerUsage:async()=>({status:'waiting_for_events',events:[]}),fetchMakerUsage:async({surface})=>({status:'waiting_for_events',surface,events:[]})};
  const result=await syncProductAnalyticsState(state,{provider,iosStreamId:null,buerIosStreamId:null,styleAtlasIosStreamId:null});
  const maker=result.projects.find(project=>project.id==='maker');
  assert.equal(maker.h5.surface,'h5');
  assert.equal(maker.ios.surface,'ios');
  assert.equal(maker.ios.status,'waiting_for_events');
});

test('Maker dashboard shows separate App metrics and honest missing outcomes', () => {
  const maker=pendingProductSnapshot().projects.find(project=>project.id==='maker');
  maker.status='partial';
  maker.h5={status:'waiting_for_events',events:[]};
  maker.ios={status:'collecting',source:'Google Analytics 4 Data API',verified_at:'2026-10-02T01:00:00Z',events:[{event:'maker_ios_v1_calculator_complete',count:3,users:2}],retention:{d1:null,d7:null},revenue:{paid_conversions:null,revenue:null}};
  const html=usageView({projects:[maker]},{projectId:'maker',surface:'ios',locale:'zh'});
  assert.match(html,/App 行为使用独立事件命名/);
  assert.match(html,/完成测算/);
  assert.match(html,/3/);
  assert.match(html,/核验购买/);
  assert.match(html,/—/);
  assert.match(html,/data-usage-surface="ios"/);
});
