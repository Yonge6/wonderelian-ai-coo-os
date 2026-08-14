import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { JsonStore } from "../src/store.mjs";

const emptyState=()=>({metadata:{schema_version:"2",last_updated:""},apps:[],metrics:[],channels:[],campaigns:[],content:[],attributions:[],insights:[],actions:[],feedback:[],opportunities:[],experiments:[],providers:[],jobs:[],events:[],audit:[],detections:[],executions:[],approvals:[],action_outcomes:[],learnings:[],operating_memory:[],ingestion_runs:[],cycles:[]});
test("store serializes concurrent mutations and writes valid JSON",async()=>{
  const dir=await mkdtemp(join(tmpdir(),"coo-store-"));const file=join(dir,"state.json");await writeFile(file,JSON.stringify(emptyState()));const store=new JsonStore(file);
  await Promise.all([store.mutate(s=>s.apps.push({id:"a"})),store.mutate(s=>s.apps.push({id:"b"}))]);
  assert.equal((await store.read()).apps.length,2);const raw=await readFile(file,"utf8");assert.doesNotThrow(()=>JSON.parse(raw));
});
