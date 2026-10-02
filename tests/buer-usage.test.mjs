import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {migrateBuer} from '../src/migrate-buer.mjs';
import {PRODUCT_PROJECTS,ProductAnalyticsProvider} from '../src/providers/product-analytics-provider.mjs';
import {usageView} from '../public/product-usage.js';
test('Buer migration preserves old evidence without counting it as new visits',()=>{
 const old={website_id:'site-human-design',value:15};
 const state={apps:[{id:'know-yourself'}],websites:[{id:'site-human-design',url:'https://human-design.wonderelian.com/'}],website_metrics:[old],website_observations:[],website_cumulative:[{totals:{active_users:15}}],website_operations:[],audit:[]};
 migrateBuer(state);assert.equal(state.websites[0].url,'https://buer.wonderelian.com/');assert.equal(state.website_metrics.length,0);assert.equal(state.website_cumulative.length,0);assert.deepEqual(state.website_history[0].metrics,[old]);assert.equal(state.apps[0].name_zh,'不二见己');assert.equal(migrateBuer(state).status,'unchanged');assert.equal(state.audit.length,1);
});
test('every non-Yixiu project is scoped to its verified hostname, not another project',async()=>{
 for(const project of PRODUCT_PROJECTS.slice(1)){
  const calls=[];const p=new ProductAnalyticsProvider();p.runReport=async options=>{calls.push(options);return {rows:[]};};
  const result=await p.fetchProjectUsage({project,startDate:'2026-09-03',endDate:'2026-09-30'});
  assert.equal(calls.length,3);assert.ok(calls.every(c=>c.dimensionFilter.filter.inListFilter.values[0]===project.hostname));assert.equal(result.overview,null);assert.equal(result.status,'waiting_for_events');assert.equal(result.revenue.revenue,null);
 }
});
test('Buer empty data, web-only products and unconnected native Apps are honest',()=>{
 const projects=PRODUCT_PROJECTS.map(p=>({...p,status:'waiting_for_events',h5:{events:[],status:'waiting_for_events'},ios:{status:'waiting_for_firebase_link'}}));
 const html=usageView({projects},{locale:'zh',projectId:'buer'});assert.match(html,/不二见己/);assert.match(html,/等待 GA4 正式报表返回/);assert.doesNotMatch(html,/播放质量/);
 assert.match(usageView({projects},{projectId:'maker',surface:'ios'}),/data-usage-surface="ios"/);
 assert.match(usageView({projects},{locale:'zh',projectId:'wendao',surface:'ios'}),/网站访问不代表 App 使用/);
});
test('navigation uses requested user activity terminology',async()=>{assert.match(await readFile(new URL('../public/app.js',import.meta.url),'utf8'),/copy.zh.product_usage="用户使用"/);});
