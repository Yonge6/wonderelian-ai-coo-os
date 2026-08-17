import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { evaluateMarketingPlaybooks, marketingEvidence } from "../src/marketing-playbooks.mjs";

async function productionState() {
  return JSON.parse(await readFile(new URL("../data/state.json", import.meta.url), "utf8"));
}

test("marketing playbooks adapt a pinned source without enabling external execution", async () => {
  const state = await productionState();
  const before = JSON.stringify(state);
  const result = evaluateMarketingPlaybooks(state);

  assert.equal(result.source.commit, "7868cb9251fad80a73d26e488a5ad5f6c4a9f335");
  assert.equal(result.source.license, "MIT");
  assert.equal(result.source.integration, "principles_adapted_not_vendored");
  assert.equal(result.policy.external_execution, "disabled");
  assert.equal(result.policy.phase4_activation, "disabled");
  assert.ok(result.playbooks.length >= 8);
  assert.ok(result.playbooks.every((item) => item.external_execution_authorized === false));
  assert.equal(JSON.stringify(state), before, "evaluation must not mutate operating state");
});

test("current evidence keeps outcome-dependent methods waiting and Phase 4 loop frozen", async () => {
  const state = await productionState();
  const evidence = marketingEvidence(state);
  const result = evaluateMarketingPlaybooks(state);
  const byId = new Map(result.playbooks.map((item) => [item.id, item]));

  assert.equal(evidence.website_analytics, true);
  assert.equal(evidence.search_console, false);
  assert.equal(evidence.app_store_analytics, false);
  assert.equal(evidence.direct_attribution, false);
  assert.equal(evidence.phase4_gate, false);
  assert.equal(byId.get("measurement_plan").status, "ready");
  assert.equal(byId.get("owned_search_geo").status, "waiting_evidence");
  assert.equal(byId.get("landing_conversion").status, "waiting_evidence");
  assert.equal(byId.get("experiment_design").status, "waiting_evidence");
  assert.equal(byId.get("marketing_loop").status, "phase_gated");
  assert.ok(byId.get("marketing_loop").missing_evidence.includes("phase4_gate"));
});

test("empty providers remain missing evidence rather than fabricated zero", async () => {
  const state = await productionState();
  state.website_metrics = [];
  state.search_observations = [];
  state.feedback = [];
  state.providers = state.providers.map((item) => ({ ...item, status: item.id === "public_website_health" ? item.status : "waiting", data_through: null }));
  const evidence = marketingEvidence(state);
  const result = evaluateMarketingPlaybooks(state);

  assert.equal(evidence.website_analytics, false);
  assert.equal(evidence.search_console, false);
  assert.equal(evidence.verified_customer_language, false);
  assert.equal(result.playbooks.find((item) => item.id === "measurement_plan").status, "waiting_evidence");
  assert.equal(result.policy.unknown_metrics, "null");
});

test("public UI exposes the bilingual evidence-gated method library", async () => {
  const [html, script] = await Promise.all([
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
  ]);
  assert.match(html, /data-view="playbooks"/);
  assert.match(script, /运营方法库/);
  assert.match(script, /external_execution_disabled/);
  assert.match(script, /brief\.marketing_playbooks/);
  assert.doesNotMatch(script, /private[_ -]?key|authorization:\s*bearer/i);
});
