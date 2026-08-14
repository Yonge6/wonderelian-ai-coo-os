import test from "node:test";
import assert from "node:assert/strict";
import { createExecution, detectMetricChanges, detectionsToInsights, learningFromOutcome, recordActionOutcome, scoreDecision, transitionExecution } from "../src/operations.mjs";

const row=(id,value,end)=>({id,app_id:"a",metric:"first_time_downloads",name:"first_time_downloads",value,unit:"count",period_start:"2026-01-01",period_end:end,source:"report",provider:"p",source_reference:id,imported_at:`${end}T00:00:00Z`,verified_at:`${end}T00:00:00Z`,freshness:"fresh",confidence:.9,notes:null,sample_size:30});

test("change detection honors thresholds and reports comparable evidence",()=>{
  const detections=detectMetricChanges([row("a",20,"2026-01-07"),row("b",30,"2026-01-14")]);
  assert.equal(detections.length,1);assert.equal(detections[0].absolute_change,10);assert.equal(detections[0].percentage_change,50);assert.equal(detections[0].severity,"high");
  assert.equal(detectMetricChanges([row("a",20,"2026-01-07"),row("b",22,"2026-01-14")]).length,0);
});

test("meaningful anomalies become insights with fact separate from interpretation",()=>{
  const detection=detectMetricChanges([row("a",20,"2026-01-07"),row("b",30,"2026-01-14")])[0];
  const insight=detectionsToInsights([detection])[0];assert.match(insight.observation,/increased/);assert.match(insight.evidence,/20 -> 30/);assert.notEqual(insight.interpretation,insight.observation);
});

test("decision score is explainable and rewards low effort",()=>{
  const low=scoreDecision({expected_impact:80,confidence:.8,urgency:70,effort:20,reversibility:90,strategic_relevance:90,evidence_quality:80});
  const high=scoreDecision({expected_impact:80,confidence:.8,urgency:70,effort:90,reversibility:90,strategic_relevance:90,evidence_quality:80});
  assert.equal(low.score>high.score,true);assert.equal(Object.keys(low.contributions).length,7);
});

test("external execution cannot run without approval or verified output",()=>{
  const action={id:"a",app_id:"app",risk_level:2,status:"proposed"};let execution=createExecution(action,{id:"e",now:"2026-01-01T00:00:00Z"});assert.equal(execution.state,"waiting");
  assert.throws(()=>transitionExecution(execution,"ready"),/approval/);
  const approval={id:"ok",status:"approved"};execution=transitionExecution(execution,"ready",{approval});execution=transitionExecution(execution,"executing",{approval});
  assert.throws(()=>transitionExecution(execution,"completed",{approval}),/output URL or identifier/);
  assert.equal(transitionExecution(execution,"completed",{approval,output_url:"https://example.com"}).state,"completed");
});

test("outcomes produce learnings only when evidence is conclusive",()=>{
  const positive=recordActionOutcome({action_id:"a",app_id:"app",metric:"downloads",metric_before:2,metric_after:4,measurement_period:"week",observed_effect:"Downloads increased.",confidence:.7,result:"positive"},{id:"o",now:"2026-01-01T00:00:00Z"});
  assert.equal(learningFromOutcome(positive,{id:"l"}).evidence[0],"action_outcome:o");
  const uncertain=recordActionOutcome({action_id:"b",result:"inconclusive"});assert.equal(learningFromOutcome(uncertain),null);
});

