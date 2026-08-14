import test from "node:test";
import assert from "node:assert/strict";
import { runOperatingCycle } from "../src/cycle.mjs";

const state=()=>({
  metadata:{schema_version:"2",primary_outcome:"downloads"},
  apps:[{id:"style-atlas",name:"Style Atlas",platforms:["iOS"],kpis:["first_time_downloads"]}],
  metrics:[{id:"m",app_id:"style-atlas",metric:"first_time_downloads",name:"first_time_downloads",value:24,unit:"count",period_start:"2026-05-15",period_end:"2026-08-12",source:"verified snapshot",provider:"manual",source_reference:"report",imported_at:"2026-08-14T00:00:00Z",verified_at:"2026-08-12T00:00:00Z",freshness:"manual",confidence:1,notes:null}],
  channels:[],campaigns:[],content:[],attributions:[],insights:[{id:"sa-channel-attribution-gap",app_id:"style-atlas",status:"open",impact:80,urgency:80,confidence:.8,observation:"Outcomes missing",evidence:"No campaign rows",reason:"Cannot rank",recommended_action:"Import campaign data",expected_impact:"Attribution",recommended_risk_level:0}],
  actions:[],feedback:[],opportunities:[],experiments:[],
  providers:[{id:"manual",app_ids:["style-atlas"],status:"available",freshness:"manual"},{id:"search",app_ids:["style-atlas"],status:"not_connected",freshness:"unknown"}],
  jobs:["import_acquisition_metrics","update_content_performance","refresh_customer_feedback","calculate_anomalies","generate_insights","refresh_daily_brief","evaluate_experiments","measure_completed_actions"].map((type,index)=>({id:`j${index}`,type,provider:type==="import_acquisition_metrics"?"manual":"internal",app_id:"style-atlas",schedule:"every:1d",last_run:null,next_run:"2026-08-14T00:00:00Z",status:"scheduled",duration:null,result:null,error:null,retry_count:0})),
  events:[],audit:[],detections:[],executions:[],approvals:[],action_outcomes:[],learnings:[],operating_memory:[],ingestion_runs:[],cycles:[],
});

test("real cycle reports no material change with one snapshot and executes only Level 0 work",async()=>{
  const current=state();const result=await runOperatingCycle(current,{now:new Date("2026-08-14T12:00:00Z")});
  assert.equal(result.cycle.detected.result,"No material change detected.");assert.equal(result.cycle.detected.material_changes,0);
  assert.equal(result.cycle.approved.required,false);assert.equal(result.cycle.executed.status,"completed");
  assert.equal(current.actions.at(-1).risk_level,0);assert.equal(current.executions.at(-1).provider,"internal_data_health");
  assert.equal(current.audit[0].input.external_writes,false);assert.equal(current.jobs.length,8);
});
