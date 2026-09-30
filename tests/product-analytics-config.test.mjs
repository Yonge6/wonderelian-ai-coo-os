import test from "node:test";
import assert from "node:assert/strict";
import { loadYixiuIosStreamId } from "../src/product-analytics-config.mjs";
import { syncProductAnalyticsState } from "../src/sync-product-analytics.mjs";

const mapping = async () => JSON.stringify({ propertyId: "549913650", iosStreamId: "15887405392" });
test("private mapping requires the matching GA4 property", async () => {
  assert.equal(await loadYixiuIosStreamId({env:{GA4_PROPERTY_ID:"properties/549913650"},readFileFn:mapping}), "15887405392");
  await assert.rejects(loadYixiuIosStreamId({env:{GA4_PROPERTY_ID:"123"},readFileFn:mapping}), {code:"INVALID_USAGE_CONFIG"});
});
test("environment override and explicit disabling precede local mapping", async () => {
  const readFileFn = () => { throw new Error("Should not read a local file"); };
  assert.equal(await loadYixiuIosStreamId({env:{YIXIU_IOS_STREAM_ID:"456"},readFileFn}),"456");
  assert.equal(await loadYixiuIosStreamId({env:{YIXIU_IOS_STREAM_ID:""},readFileFn}),null);
  await assert.rejects(loadYixiuIosStreamId({env:{YIXIU_IOS_STREAM_ID:"invalid"},readFileFn}),{code:"INVALID_STREAM"});
});
test("missing local config remains pending; malformed config fails closed", async () => {
  assert.equal(await loadYixiuIosStreamId({env:{},readFileFn:async()=>{throw Object.assign(new Error(),{code:"ENOENT"});}}),null);
  await assert.rejects(loadYixiuIosStreamId({env:{},readFileFn:async()=>"broken"}),{code:"INVALID_USAGE_CONFIG"});
});
test("invalid local mapping cannot turn the App panel into a web query", async () => {
  const calls=[];
  const provider={health:async()=>({status:"configured"}),fetchUsage:async options=>{calls.push(options);return{status:"waiting_for_events",events:[]};}};
  const result=await syncProductAnalyticsState({audit:[]},{provider,loadStreamId:async()=>{throw Object.assign(new Error(),{code:"INVALID_USAGE_CONFIG"});}});
  assert.equal(calls.length,1);
  assert.equal(result.projects[0].ios.status,"unavailable");
  assert.equal(result.projects[0].ios.error_code,"INVALID_USAGE_CONFIG");
});
