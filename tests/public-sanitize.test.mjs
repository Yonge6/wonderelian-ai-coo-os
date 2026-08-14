import test from "node:test";
import assert from "node:assert/strict";
import { assertPublicDataSafe, sanitizePublicData } from "../src/public-sanitize.mjs";

test("public sanitizer removes local, credential, approval, and operating-memory fields",()=>{
  const clean=sanitizePublicData({asset_path:"/Users/person/secret.png",token:"abc123456789",approvals:[{id:"private"}],operating_memory:[{statement:"internal"}],nested:{name:"safe"}});assert.deepEqual(clean,{nested:{name:"safe"}});assert.doesNotThrow(()=>assertPublicDataSafe(clean));
});
test("public safety scan rejects emails and secret assignments",()=>{
  assert.throws(()=>assertPublicDataSafe({contact:"person@example.com"}),/email/);assert.throws(()=>assertPublicDataSafe("api_key=abcdefghijk"),/secret assignment/);
});
