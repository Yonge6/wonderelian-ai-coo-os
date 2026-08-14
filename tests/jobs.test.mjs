import test from "node:test";
import assert from "node:assert/strict";
import { isJobDue, nextRunFor, runJob, runJobsOnce } from "../src/jobs.mjs";

const job={id:"j",type:"collect",provider:"p",app_id:"a",schedule:"every:1d",last_run:null,next_run:"2026-01-01T00:00:00Z",status:"scheduled",duration:null,result:null,error:null,retry_count:0};
test("scheduled jobs calculate due time and persist result",async()=>{
  const now=new Date("2026-01-02T00:00:00Z");assert.equal(isJobDue(job,now),true);assert.equal(nextRunFor(job,now),"2026-01-03T00:00:00.000Z");
  const updated=await runJob(job,async()=>({result:{count:1}}),{now});assert.equal(updated.status,"succeeded");assert.deepEqual(updated.result,{count:1});
});
test("job runner records failures without stopping other jobs",async()=>{
  const state={jobs:[job,{...job,id:"j2",type:"fail"}]};const results=await runJobsOnce(state,{collect:async()=>"ok",fail:async()=>{throw new Error("offline");}},{now:new Date("2026-01-02T00:00:00Z")});
  assert.equal(results.length,2);assert.equal(state.jobs[1].status,"failed");assert.equal(state.jobs[1].retry_count,1);
});

