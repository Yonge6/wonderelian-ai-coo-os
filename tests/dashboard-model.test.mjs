import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import * as model from '../public/dashboard-model.js';

test('freshness uses the previous complete Beijing day and never implies freshness for missing data',()=>{
  const now=new Date('2026-09-22T17:00:00Z');
  assert.equal(model.expectedDataDay(now),'2026-09-22');
  assert.deepEqual(model.freshness('2026-09-21',now),{state:'stale',days:1,expected:'2026-09-22'});
  assert.equal(model.freshness(null,now).state,'missing');
  assert.equal(model.freshness('2026-09-22',now).state,'fresh');
});

test('traffic respects cutoff, retains nulls, and uses provider cumulative UV',()=>{
  const summary={latest_date:'2026-09-22',days:[{date:'2026-09-21',website_totals:{active_users:10,cta_clicks:0}},{date:'2026-09-22',website_totals:{active_users:null,cta_clicks:null}},{date:'2026-09-23',website_totals:{active_users:99}}],cumulative:[{date:'2026-09-22',website_totals:{active_users:7}}]};
  assert.deepEqual(model.trafficPoints(summary,'active_users'),[{label:'2026-09-21',value:10},{label:'2026-09-22',value:null}]);
  assert.equal(model.trafficPoints(summary,'active_users',{mode:'cumulative'})[0].value,7);
  assert.deepEqual(model.trafficPoints(summary,'cta_clicks',{period:'weekly'}),[{label:'2026-09-21',value:0,observed:1}]);
  assert.equal(model.trafficPoints(summary,'active_users',{scope:'unknown'})[0].value,null);
});

test('content filters only verified permanent publications in stable newest-first order',()=>{
  const items=[{id:'old',title:'Rain',app_id:'a',channel_id:'p',status:'published',url:'https://example.com/old',published_at:'2026-09-20'}, {id:'new',title:'雨 Rain',app_id:'a',channel_id:'p',status:'published',url:'https://example.com/new',published_at:'2026-09-21'}, {id:'draft',title:'Rain',status:'draft',url:'https://example.com/draft'}, {id:'missing',status:'published',url:null}];
  assert.deepEqual(model.filterPublications(items,{query:'rain',app:'a',channel:'p',from:'2026-09-21',to:'2026-09-21'}).map(x=>x.id),['new']);
  assert.deepEqual(model.verifiedPublications(items).map(x=>x.id),['new','old']);
  assert.equal(model.filterPublications(items,{query:'nothing'}).length,0);
  assert.equal(items[0].id,'old');
});

test('CSV keeps unknowns blank, preserves zero, and prevents formula execution',()=>{
  const csv=model.csvText([['Title','Count'],['a,"b"',null],['=1+1',0],['\t@SUM(A1)',-5]]);
  assert.match(csv,/"a,""b""",""/);
  assert.match(csv,/"'=1\+1","0"/);
  assert.match(csv,/"'\t@SUM\(A1\)","-5"/);
});

test('overview shows current evidence without historical jobs or baselines; all six useful views render',async()=>{
  const [script,stateText,briefText,html]=await Promise.all(['public/app.js','public/data/state.json','public/data/brief.json','public/index.html'].map(p=>readFile(new URL('../'+p,import.meta.url),'utf8')));
  const context=vm.createContext({...model,Intl,Date,URL,URLSearchParams,console,localStorage:{getItem:()=> 'zh'},location:{protocol:'https:',hostname:'ops.wonderelian.com',search:'',hash:''},document:{body:{dataset:{}},querySelector:()=>null}});
  const code=script.replace(/^import[^\n]+\n/,'').split('document.querySelectorAll("nav [data-view]")')[0];
  vm.runInContext(code,context);
  context.fixture=JSON.parse(stateText);context.fixtureBrief=JSON.parse(briefText);
  vm.runInContext('state=fixture;brief=fixtureBrief;',context);
  const overview=vm.runInContext('command()',context);
  assert.match(overview,/累计组合数据/);assert.match(overview,/需要关注/);assert.match(overview,/最近公开内容/);
  assert.doesNotMatch(overview,/Phase 4|今日决策|v1\.3|App Store verified 90|下次运行/);
  assert.equal((overview.match(/<article><span>/g)??[]).length,8);
  assert.match(overview,/网站数据/);assert.match(overview,/App 数据/);assert.match(overview,/App 数据截至/);
  for(const name of ['appsView','websitesView','contentView','sourcesView','activityView'])assert.ok(vm.runInContext(name+'()',context).length>500);
  vm.runInContext('portfolioMode="daily"; dailyDate=brief.daily_portfolio.available_dates[0]',context);
  assert.ok(vm.runInContext('trafficTrendPoints(brief.daily_portfolio,"page_views").every(p=>p.label<=dailyDate)',context));
  const mainNav=html.split('<details class="nav-archive">')[0];
  assert.equal((mainNav.match(/data-view=/g)??[]).length,6);
  assert.match(vm.runInContext('activityView()',context),/不是实时调度器/);
});
