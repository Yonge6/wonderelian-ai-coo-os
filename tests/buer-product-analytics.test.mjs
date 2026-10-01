import test from 'node:test';
import assert from 'node:assert/strict';
import {ProductAnalyticsProvider} from '../src/providers/product-analytics-provider.mjs';
import {loadBuerIosStreamId} from '../src/product-analytics-config.mjs';
import {usageView} from '../public/product-usage.js';
test('Buer native stream and web host are isolated and empty values stay null',async()=>{
 for(const stream of [undefined,'15912522443']){const calls=[],p=new ProductAnalyticsProvider();p.runReport=async c=>{calls.push(c);return {rows:[]};};const result=await p.fetchBuerUsage({startDate:'2026-09-03',endDate:'2026-09-30',iosStreamId:stream});assert.equal(result.overview,null);assert.equal(result.revenue.revenue,null);assert.equal(result.status,'waiting_for_events');assert.equal(calls.length,3);for(const call of calls){const scope=JSON.stringify(call.dimensionFilter);assert.match(scope,stream?/15912522443/:/buer.wonderelian.com/);assert.doesNotMatch(scope,/yixiu|15887405392/);}}
});
test('Buer config preserves existing Yixiu mapping',async()=>{
 const readFileFn=async()=>JSON.stringify({propertyId:'549913650',iosStreamId:'15887405392',buerIosStreamId:'15912522443'});
 assert.equal(await loadBuerIosStreamId({env:{GA4_PROPERTY_ID:'549913650'},readFileFn}),'15912522443');
 await assert.rejects(()=>loadBuerIosStreamId({env:{GA4_PROPERTY_ID:'other'},readFileFn}));
});
test('Buer view never invents conversions and shows latency only with evidence',()=>{
 const data={status:'collecting',events:[{event:'buer_v1_chat_latency',count:2,seconds:10}],overview:null};
 const html=usageView({projects:[{id:'buer',name:'Buer',name_zh:'不二见己',status:'collecting',ios:data}]},{locale:'zh',projectId:'buer',surface:'ios'});
 assert.match(html,/平均完成耗时/);assert.match(html,/>5<small> 秒/);assert.match(html,/结果回调不代表付费成功/);assert.match(html,/>—<\/strong>/);assert.doesNotMatch(html,/播放质量/);
});
