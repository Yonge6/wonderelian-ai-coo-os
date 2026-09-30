import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";

export const APP_STORE_SALES_SNAPSHOT = {
  id: "app-store-sales-2026-09-29",
  period_start: "2026-08-30",
  period_end: "2026-09-29",
  timezone: "UTC",
  source: "App Store Connect Sales and Trends",
  source_reference: "sales-and-trends:app-units:2026-08-30:2026-09-29",
  verification_type: "manual_verified_official_ui",
  verified_at: "2026-09-30T14:22:00.000Z",
  totals: {
    app_units: 78,
    in_app_purchase_units: 2,
    sales_amount: 1.77,
    sales_currency: "USD",
  },
  apps: [
    { app_id: "wendao", name: "Wendao AI: Daodejing", name_zh: "问道 AI：道德经", app_store_id: "6796945428", app_units: 34, in_app_purchase_units: 2 },
    { app_id: "yixiu-meditation", name: "Yixiu: White Noise & Sleep", name_zh: "一休冥想：白噪音与静心", app_store_id: "1461182261", app_units: 18, in_app_purchase_units: null },
    { app_id: "style-atlas", name: "Style Atlas: Art & Design", name_zh: "Style Atlas：艺术与设计", app_store_id: "6787447019", app_units: 12, in_app_purchase_units: null },
    { app_id: "wonderelian", name: "WonderElian", name_zh: "WonderElian", app_store_id: "6806903403", app_units: 10, in_app_purchase_units: null },
    { app_id: "maker-business-lab", name: "Maker Business Lab", name_zh: "Maker Business Lab", app_store_id: "6806765660", app_units: 3, in_app_purchase_units: null },
    { app_id: "xiazi-yesterdays-world", name: "Xiazi Says", name_zh: "虾子曰", app_store_id: "6799621217", app_units: 1, in_app_purchase_units: null },
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

export function applyAppStoreSalesSnapshot(state, { at = new Date().toISOString(), snapshot = APP_STORE_SALES_SNAPSHOT } = {}) {
  state.app_store_sales_snapshots ??= [];
  const index = state.app_store_sales_snapshots.findIndex((item) => item.id === snapshot.id);
  const record = { ...snapshot, imported_at: at };
  if (index === -1) state.app_store_sales_snapshots.push(record);
  else state.app_store_sales_snapshots[index] = record;

  let provider = state.providers.find((item) => item.id === "app_store_sales_and_trends_ui");
  if (!provider) {
    provider = { id: "app_store_sales_and_trends_ui", name: "App Store Connect Sales and Trends", type: "sales_finance", mode: "official_ui_manual_snapshot" };
    state.providers.push(provider);
  }
  Object.assign(provider, {
    status: "available",
    app_ids: snapshot.apps.map((item) => item.app_id),
    last_sync: at,
    last_successful_import: at,
    data_through: snapshot.period_end,
    freshness: "manual",
    data_available: ["app_units", "in_app_purchase_units", "sales_amount", "estimated_total_proceeds"],
    authentication_required: true,
    authentication_status: "browser_session_verified",
    secrets_stored: false,
    error: null,
  });
  state.metadata.data_through = {
    ...(state.metadata.data_through ?? {}),
    app_store_sales: snapshot.period_end,
    app_store_finance: snapshot.financial.updated_on,
  };
  state.audit.unshift({
    id: crypto.randomUUID(),
    at,
    actor: "Codex",
    app_id: "wendao",
    source: "official_app_store_connect_ui",
    action: "import_verified_app_store_sales_and_finance_snapshot",
    result: `Imported verified App Store sales through ${snapshot.period_end}; reconciled ${snapshot.financial.total_units} Wendao lifetime purchases to ${snapshot.financial.estimated_total_proceeds.toFixed(2)} ${snapshot.financial.currency} estimated proceeds.`,
    status: "success",
  });
  return { status: "succeeded", snapshot_id: snapshot.id, apps: snapshot.apps.length, data_through: snapshot.period_end };
}

async function main() {
  const store = new JsonStore(fileURLToPath(new URL("../data/state.json", import.meta.url)));
  const result = await store.mutate((state) => applyAppStoreSalesSnapshot(state));
  console.log(`APP_STORE_SALES_${result.status.toUpperCase()} apps=${result.apps} data_through=${result.data_through}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
