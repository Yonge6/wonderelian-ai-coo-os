import test from "node:test";
import assert from "node:assert/strict";
import { aggregatePortfolioKpis, analyzeFeedback, generateBrief, scoreInsight, transitionAction, transitionExperiment } from "../src/domain.mjs";

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

test("feedback analysis detects repeated severe themes without inventing evidence", () => {
  const result=analyzeFeedback([{app_id:"a",topic:"onboarding",text:"Unclear first step",sentiment:"negative"},{app_id:"a",topic:"Onboarding",text:"Could not begin",severity:4}]);
  assert.equal(result.themes[0].frequency,2);assert.equal(result.opportunities.length,1);assert.deepEqual(result.opportunities[0].evidence,["Unclear first step","Could not begin"]);
});
