import test from "node:test";
import assert from "node:assert/strict";
import { aggregatePortfolioKpis, analyzeFeedback, dailyPortfolioSummary, generateBrief, scoreInsight, transitionAction, transitionExperiment } from "../src/domain.mjs";

test("insight score weights impact, urgency, and confidence", () => {
  assert.equal(scoreInsight({ impact: 80, urgency: 60, confidence: 0.5 }), 68);
});

test("portfolio aggregation preserves unknown as null and reports coverage", () => {
  const state = { apps:[{id:"a"},{id:"b"}], content:[], metrics:[{app_id:"a",name:"first_time_downloads",value:4,period_end:"2026-01-01"},{app_id:"b",name:"first_time_downloads",value:null,period_end:"2026-01-01"}] };
  const result = aggregatePortfolioKpis(state);
  assert.deepEqual(result.first_time_downloads, { value:4, apps_reporting:1, apps_total:2 });
  assert.equal(result.active_users.value, null);
});

test("action and experiment transitions reject shortcuts", () => {
  assert.equal(transitionAction({status:"proposed"},"approved").status,"approved");
  assert.throws(()=>transitionAction({status:"proposed"},"completed"),/Invalid transition/);
  assert.equal(transitionExperiment({status:"planned"},"running").status,"running");
});

test("daily brief returns at most three ranked recommendations", () => {
  const state={metadata:{primary_outcome:"downloads"},apps:[{id:"a",name:"A"}],metrics:[],content:[],insights:Array.from({length:5},(_,i)=>({id:String(i),app_id:"a",status:"open",impact:i*10,urgency:50,confidence:.8,observation:"o",evidence:"e",reason:"r",recommended_action:`a${i}`,expected_impact:"x"}))};
  const brief=generateBrief(state);
  assert.equal(brief.recommendations.length,3);
  assert.equal(brief.recommendations[0].action,"a4");
});

test("daily brief includes verified operational launches without fabricating performance", () => {
  const state={
    metadata:{primary_outcome:"downloads"},apps:[{id:"wendao",name:"Wendao: Daodejing",name_zh:"三慢问道",platforms:["iOS","web"],kpis:["first_time_downloads"]}],
    metrics:[],content:[],insights:[],websites:[],providers:[],jobs:[],attributions:[],
    detections:[{id:"launch",app_id:"wendao",type:"operational_change",metric:"app_store_launch",label:"Wendao is live",label_zh:"三慢问道已上线",severity:"high",current_value:"live",previous_baseline:"not listed",evidence:"Official Apple lookup verified the listing."}],
  };
  const brief=generateBrief(state);
  assert.equal(brief.no_material_change,false);
  assert.equal(brief.what_changed.length,1);
  assert.equal(brief.what_changed[0].metric,"app_store_launch");
  assert.equal(brief.kpis.first_time_downloads.value,null);
});

test("daily portfolio summary exposes total and per-property UV PV without inventing missing values", () => {
  const state={
    apps:[{id:"a"},{id:"b"}],
    websites:[{id:"site-a",app_id:"a"},{id:"site-b",app_id:"b"},{id:"brand",app_id:null}],
    metrics:[
      {app_id:"a",name:"first_time_downloads",value:20,period_start:"2025-10-01",period_end:"2025-12-31",verification_type:"manual_verified"},
      {app_id:"a",name:"first_time_downloads",value:2,period_start:"2026-01-02",period_end:"2026-01-02",verification_type:"api_verified"},
    ],
    website_metrics:[
      {website_id:"site-a",name:"page_views",value:8,period_start:"2026-01-02",period_end:"2026-01-02"},
      {website_id:"site-a",name:"active_users",value:3,period_start:"2026-01-02",period_end:"2026-01-02"},
      {website_id:"site-b",name:"page_views",value:null,period_start:"2026-01-02",period_end:"2026-01-02"},
      {website_id:"brand",name:"page_views",value:5,period_start:"2026-01-02",period_end:"2026-01-02"},
      {website_id:"brand",name:"active_users",value:2,period_start:"2026-01-02",period_end:"2026-01-02"},
    ],
  };
  const summary=dailyPortfolioSummary(state),day=summary.days[0];
  assert.equal(summary.latest_date,"2026-01-02");
  assert.equal(day.website_totals.page_views,13);
  assert.equal(day.website_totals.active_users,5);
  assert.equal(day.website_totals.sessions,null);
  assert.equal(day.website_coverage.page_views,2);
  assert.equal(day.app_totals.first_time_downloads,2);
  assert.equal(day.apps.find((row)=>row.app_id==="b").h5_metrics.page_views,null);
  assert.equal(day.websites.find((row)=>row.website_id==="site-b").metrics.active_users,null);
  assert.match(summary.uv_definition,/may be counted more than once/);
});

test("feedback analysis detects repeated severe themes without inventing evidence", () => {
  const result=analyzeFeedback([{app_id:"a",topic:"onboarding",text:"Unclear first step",sentiment:"negative"},{app_id:"a",topic:"Onboarding",text:"Could not begin",severity:4}]);
  assert.equal(result.themes[0].frequency,2);assert.equal(result.opportunities.length,1);assert.deepEqual(result.opportunities[0].evidence,["Unclear first step","Could not begin"]);
});
