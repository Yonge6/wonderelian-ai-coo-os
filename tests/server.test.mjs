import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createServer } from "../src/server.mjs";

const seed=()=>({metadata:{schema_version:"2",last_updated:"",primary_outcome:"downloads"},apps:[{id:"a",name:"App"}],metrics:[],channels:[],campaigns:[],content:[],attributions:[],insights:[{id:"i",app_id:"a",status:"open",impact:80,urgency:80,confidence:.8,observation:"o",evidence:"e",reason:"r",recommended_action:"Do it",expected_impact:"x",recommended_risk_level:1}],actions:[],feedback:[],opportunities:[],experiments:[],providers:[],jobs:[],events:[],audit:[],detections:[],executions:[],approvals:[],action_outcomes:[],learnings:[],operating_memory:[],ingestion_runs:[],cycles:[]});
test("HTTP API creates, approves, audits, and rejects invalid transition",async(t)=>{
  const dir=await mkdtemp(join(tmpdir(),"coo-http-"));const file=join(dir,"state.json");await writeFile(file,JSON.stringify(seed()));const server=createServer({dataFile:file});await new Promise(r=>server.listen(0,"127.0.0.1",r));t.after(()=>server.close());const base=`http://127.0.0.1:${server.address().port}`;
  let response=await fetch(`${base}/api/insights/i/actions`,{method:"POST",headers:{"content-type":"application/json"},body:"{}"});assert.equal(response.status,201);const action=await response.json();
  response=await fetch(`${base}/api/actions/${action.id}/transition`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({status:"approved"})});assert.equal(response.status,200);
  response=await fetch(`${base}/api/actions/${action.id}/transition`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({status:"completed"})});assert.equal(response.status,400);
  const state=await (await fetch(`${base}/api/state`)).json();assert.equal(state.actions[0].status,"approved");assert.equal(state.audit.length,2);
});

test("verified snapshot ingestion is normalized and idempotent",async(t)=>{
  const dir=await mkdtemp(join(tmpdir(),"coo-import-"));const file=join(dir,"state.json");await writeFile(file,JSON.stringify(seed()));const server=createServer({dataFile:file});await new Promise(r=>server.listen(0,"127.0.0.1",r));t.after(()=>server.close());const base=`http://127.0.0.1:${server.address().port}`;
  const snapshot={app_id:"a",source:"App Store report",source_reference:"report:2026-01",verified_at:"2026-01-31T00:00:00Z",metrics:[{metric:"first_time_downloads",value:null,unit:"count",period_start:"2026-01-01",period_end:"2026-01-31",notes:"Unavailable in export"}]};
  let response=await fetch(`${base}/api/metrics/import`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(snapshot)});let result=await response.json();assert.equal(result.records_inserted,1);assert.equal(result.records_unchanged,0);
  response=await fetch(`${base}/api/metrics/import`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(snapshot)});result=await response.json();assert.equal(result.records_inserted,0);assert.equal(result.records_unchanged,1);
  const current=await(await fetch(`${base}/api/state`)).json();assert.equal(current.metrics.length,1);assert.equal(current.metrics[0].value,null);assert.equal(current.metrics[0].freshness,"manual");
});
