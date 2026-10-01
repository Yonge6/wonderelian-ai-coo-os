import test from "node:test";
import assert from "node:assert/strict";
import { applyAppStoreSalesSnapshot } from "../src/sync-app-store-sales-2026-09-30.mjs";
import { APP_STORE_SALES_SNAPSHOT_2026_10_01 } from "../src/sync-app-store-sales-2026-10-01.mjs";

test("October 1 App Store snapshot records September App units and IAP separately", () => {
  const state = { metadata: { data_through: {} }, providers: [], audit: [] };
  const result = applyAppStoreSalesSnapshot(state, {
    at: "2026-10-01T03:30:00.000Z",
    snapshot: APP_STORE_SALES_SNAPSHOT_2026_10_01,
  });

  assert.equal(result.data_through, "2026-09-30");
  assert.equal(state.metadata.data_through.app_store_sales, "2026-09-30");
  assert.equal(state.app_store_sales_snapshots[0].totals.app_units, 72);
  assert.equal(state.app_store_sales_snapshots[0].totals.in_app_purchase_units, 2);
  assert.equal(state.app_store_sales_snapshots[0].totals.sales_amount, 1.77);
  assert.equal(state.app_store_sales_snapshots[0].apps.reduce((sum, row) => sum + row.app_units, 0), 72);
  assert.equal(state.app_store_sales_snapshots[0].apps.find((row) => row.app_id === "wendao").in_app_purchase_units, 2);
  assert.equal(state.app_store_sales_snapshots[0].apps.find((row) => row.app_id === "yixiu-meditation").in_app_purchase_units, null);
  assert.equal(state.app_store_sales_snapshots[0].financial.estimated_total_proceeds, 11.41);
  assert.equal(state.app_store_sales_snapshots[0].financial.item_level_proceeds_available, false);
});
