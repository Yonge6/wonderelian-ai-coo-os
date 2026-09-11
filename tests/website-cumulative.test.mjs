import assert from 'node:assert/strict';
import test from 'node:test';
import {Ga4WebsiteProvider} from '../src/providers/ga4-website-provider.mjs';
import {syncWebsiteCumulative} from '../src/sync-website-cumulative.mjs';
import {dailyPortfolioSummary} from '../src/domain.mjs';
const report=(dimensions,metrics,rows)=>({dimensionHeaders:dimensions.map(name=>({name})),metricHeaders:metrics.map(name=>({name})),rows:rows.map(([dims,values])=>({dimensionValues:dims.map(value=>({value})),metricValues:values.map(value=>({value:String(value)}))}))});
test('cumulative totals use interval deduplication and preserve absent sites as null',async()=>{
  const sites=[{id:'one',url:'https://one.example/'},{id:'two',url:'https://two.example/'},{id:'absent',url:'https://absent.example/'}];
  const provider=new Ga4WebsiteProvider();
  provider.runReport=async ({dimensions,metrics,dimensionFilter})=>{
    assert.ok(!dimensions.includes('date'));
    assert.ok(dimensionFilter.filter.inListFilter.values.includes('one.example'));
    if(dimensions.includes('eventName'))return report(dimensions,metrics,[[['one.example','chart_completion'],[2]],[['one.example','scroll'],[90]]]);
    if(dimensions.length)return report(dimensions,metrics,[[['one.example'],[10,20,15]],[['two.example'],[8,15,10]]]);
    return report(dimensions,metrics,[[[],[12,35,20]]]);
  };
  const result=await provider.fetchCumulative({websites:sites,startDate:'2026-08-15',endDate:'2026-09-10'});
  assert.equal(result.totals.active_users,12);
  assert.equal(result.totals.sessions,20);
  assert.equal(result.totals.cta_clicks,2);
  assert.deepEqual(result.websites[2].metrics,{active_users:null,page_views:null,sessions:null,cta_clicks:null});
  const summary=dailyPortfolioSummary({websites:sites,website_metrics:[],metrics:[],apps:[],website_cumulative:[result]});
  assert.equal(summary.cumulative[0].website_totals.active_users,12);
});
test('daily refresh keeps prior cumulative intervals and refreshes the latest',async()=>{
  const state={website_metrics:['2026-08-15','2026-08-16'].map(date=>({period_start:date,period_end:date,verification_type:'api_verified',value:1})),websites:[],audit:[]};
  let count=0;
  const provider={fetchCumulative:async ({startDate,endDate})=>{count++;return {period_start:startDate,period_end:endDate,verification_type:'api_verified',totals:{},websites:[]};}};
  await syncWebsiteCumulative(state,{provider});assert.equal(count,2);
  await syncWebsiteCumulative(state,{provider});assert.equal(count,3);assert.equal(state.website_cumulative.length,2);
  assert.equal(state.audit[0].action,'sync_cumulative_website_analytics');
});
