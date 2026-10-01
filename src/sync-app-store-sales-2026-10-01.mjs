import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";
import { applyAppStoreSalesSnapshot } from "./sync-app-store-sales-2026-09-30.mjs";

export const APP_STORE_SALES_SNAPSHOT_2026_10_01 = {
  id: "app-store-sales-2026-09-30",
  period_start: "2026-09-01",
  period_end: "2026-09-30",
  timezone: "UTC",
  source: "App Store Connect Sales and Trends",
  source_reference: "sales-and-trends:app-units:2026-09-01:2026-09-30",
  verification_type: "manual_verified_official_ui",
  verified_at: "2026-10-01T01:42:00.000Z",
  totals: {
    app_units: 72,
    in_app_purchase_units: 2,
    sales_amount: 1.77,
    sales_currency: "USD",
  },
  apps: [
    { app_id: "wendao", name: "Wendao AI: Daodejing", name_zh: "问道 AI：道德经", app_store_id: "6796945428", app_units: 32, in_app_purchase_units: 2 },
    { app_id: "yixiu-meditation", name: "Yixiu: White Noise & Sleep", name_zh: "一休冥想：白噪音与静心", app_store_id: "1461182261", app_units: 16, in_app_purchase_units: null },
    { app_id: "style-atlas", name: "Style Atlas: Art & Design", name_zh: "Style Atlas：艺术与设计", app_store_id: "6787447019", app_units: 11, in_app_purchase_units: null },
    { app_id: "wonderelian", name: "WonderElian", name_zh: "WonderElian", app_store_id: "6806903403", app_units: 10, in_app_purchase_units: null },
    { app_id: "maker-business-lab", name: "Maker Business Lab", name_zh: "Maker Business Lab", app_store_id: "6806765660", app_units: 3, in_app_purchase_units: null },
  ],
  financial: {
    month: "2026-09",
    updated_on: "2026-09-30",
    territory: "China mainland",
    currency: "CNY",
    total_units: 2,
    estimated_total_proceeds: 11.41,
    matched_app_id: "wendao",
    matched_product: "Wendao Complete Reading Lifetime",
    match_basis: "The September financial report contains two China-mainland units, and the same account's Sales and Trends report contains exactly two in-app-purchase units, both assigned to this Wendao lifetime product.",
    item_level_proceeds_available: false,
  },
};

async function main() {
  const store = new JsonStore(fileURLToPath(new URL("../data/state.json", import.meta.url)));
  const result = await store.mutate((state) => applyAppStoreSalesSnapshot(state, { snapshot: APP_STORE_SALES_SNAPSHOT_2026_10_01 }));
  console.log(`APP_STORE_SALES_${result.status.toUpperCase()} apps=${result.apps} data_through=${result.data_through}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
