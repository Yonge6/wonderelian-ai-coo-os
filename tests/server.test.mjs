import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createServer } from "../src/server.mjs";

const seed=()=>({metadata:{schema_version:"1",last_updated:"",primary_outcome:"downloads"},apps:[{id:"a",name:"App"}],metrics:[],channels:[],campaigns:[],content:[],insights:[{id:"i",app_id:"a",status:"open",impact:80,urgency:80,confidence:.8,observation:"o",evidence:"e",reason:"r",recommended_action:"Do it",expected_impact:"x"}],actions:[],feedback:[],opportunities:[],experiments:[],providers:[],jobs:[],events:[],audit:[]});
test("HTTP API creates, approves, audits, and rejects invalid transition",async(t)=>{
  const dir=await mkdtemp(join(tmpdir(),"coo-http-"));const file=join(dir,"state.json");await writeFile(file,JSON.stringify(seed()));const server=createServer({dataFile:file});await new Promise(r=>server.listen(0,"127.0.0.1",r));t.after(()=>server.close());const base=`http://127.0.0.1:${server.address().port}`;
  let response=await fetch(`${base}/api/insights/i/actions`,{method:"POST",headers:{"content-type":"application/json"},body:"{}"});assert.equal(response.status,201);const action=await response.json();
  response=await fetch(`${base}/api/actions/${action.id}/transition`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({status:"approved"})});assert.equal(response.status,200);
  response=await fetch(`${base}/api/actions/${action.id}/transition`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({status:"completed"})});assert.equal(response.status,400);
  const state=await (await fetch(`${base}/api/state`)).json();assert.equal(state.actions[0].status,"approved");assert.equal(state.audit.length,2);
});
