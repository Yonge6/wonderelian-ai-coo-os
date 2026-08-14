import test from "node:test";
import assert from "node:assert/strict";
import { assertPublicDataSafe, sanitizePublicData } from "../src/public-sanitize.mjs";

test("public sanitizer removes local, credential, approval, configuration, and operating-memory fields",()=>{
  const clean=sanitizePublicData({asset_path:"/Users/person/secret.png",token:"abc123456789",required_configuration:["ASC_KEY_ID"],approvals:[{id:"private"}],operating_memory:[{statement:"internal"}],nested:{name:"safe"}});assert.deepEqual(clean,{nested:{name:"safe"}});assert.doesNotThrow(()=>assertPublicDataSafe(clean));
});
test("public safety scan rejects emails and secret assignments",()=>{
  assert.throws(()=>assertPublicDataSafe({contact:"person@example.com"}),/email/);assert.throws(()=>assertPublicDataSafe("api_key=abcdefghijk"),/secret assignment/);
});
test("public safety scan rejects private provider configuration names",()=>{
  assert.throws(()=>assertPublicDataSafe("ASC_ISSUER_ID"),/private provider configuration/);assert.throws(()=>assertPublicDataSafe("GOOGLE_APPLICATION_CREDENTIALS"),/private provider configuration/);
});
test("public sanitizer publishes audit summaries without private payloads",()=>{
  const clean=sanitizePublicData({audit:[{id:"audit-1",at:"2026-08-14T00:00:00.000Z",actor:"AI COO OS",app_id:"style-atlas",source:"growth_cycle",action:"sync_provider",input:{credential_path:"/private/path"},result:{request_id:"private"},error:{raw:"private"},status:"blocked"},{id:"audit-2",result:"https://example.com/evidence",status:"success"}]});
  assert.deepEqual(clean.audit[0],{id:"audit-1",at:"2026-08-14T00:00:00.000Z",actor:"AI COO OS",app_id:"style-atlas",source:"growth_cycle",action:"sync_provider",status:"blocked"});
  assert.equal(clean.audit[1].result,"https://example.com/evidence");
  assert.doesNotThrow(()=>assertPublicDataSafe(clean));
});
