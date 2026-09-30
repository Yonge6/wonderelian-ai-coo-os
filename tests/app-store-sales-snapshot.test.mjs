import test from "node:test";
import assert from "node:assert/strict";
import { APP_STORE_SALES_SNAPSHOT, applyAppStoreSalesSnapshot } from "../src/sync-app-store-sales-2026-09-30.mjs";

test("verified App Store sales snapshot keeps sales, downloads and item-level proceeds distinct", () => {
  const state={metadata:{data_through:{}},providers:[],audit:[]};
  const result=applyAppStoreSalesSnapshot(state,{at:"2026-09-30T15:00:00.000Z"});
  assert.equal(result.status,"succeeded");
  assert.equal(state.metadata.data_through.app_store_sales,"2026-09-29");
  assert.equal(state.app_store_sales_snapshots[0].totals.app_units,78);
  assert.equal(state.app_store_sales_snapshots[0].financial.estimated_total_proceeds,11.41);
  assert.equal(state.app_store_sales_snapshots[0].financial.item_level_proceeds_available,false);
  assert.equal(state.app_store_sales_snapshots[0].apps.find((row)=>row.app_id==="wendao").in_app_purchase_units,2);
  assert.equal(state.app_store_sales_snapshots[0].apps.find((row)=>row.app_id==="yixiu-meditation").in_app_purchase_units,null);
  assert.equal(state.providers.find((row)=>row.id==="app_store_sales_and_trends_ui").status,"available");
  assert.match(state.audit[0].result,/Wendao lifetime purchases/);
  assert.equal(APP_STORE_SALES_SNAPSHOT.totals.sales_amount,1.77);
});
