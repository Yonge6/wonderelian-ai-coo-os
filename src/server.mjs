import { createServer as createHttpServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { JsonStore } from "./store.mjs";
import { analyzeFeedback, createActionFromInsight, generateBrief, transitionAction, transitionExperiment } from "./domain.mjs";
import { calculateDataHealth } from "./metrics.mjs";
import { createExecution, recordActionOutcome, transitionExecution } from "./operations.mjs";
import { ManualSnapshotProvider } from "./providers/manual-snapshot-provider.mjs";
import { runOperatingCycle } from "./cycle.mjs";
import { runGrowthDataCycle } from "./growth-cycle.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");
const defaultDataFile = join(root, "data/state.json");
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json":"application/json; charset=utf-8", ".svg":"image/svg+xml" };

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 1_000_000) throw new Error("Request body too large");
  }
  return raw ? JSON.parse(raw) : {};
}

function audit(state, req, action, result, status = "success", appId = null, input = null) {
  state.audit.unshift({
    id: crypto.randomUUID(), at: new Date().toISOString(), actor: req.headers["x-actor"] ?? "local_operator",
    app_id: appId, source: "local_dashboard", action, input, result, status, error: null,
  });
}

function addEntity(state, collection, input, req) {
  const now = new Date().toISOString();
  const entity = { ...input, id: input.id ?? crypto.randomUUID(), created_at: now, updated_at: now };
  state[collection].push(entity);
  audit(state, req, `create_${collection.slice(0, -1)}`, entity.id, "success", entity.app_id ?? null, { id:entity.id });
  return entity;
}

export function createServer({ dataFile = defaultDataFile } = {}) {
  const store = new JsonStore(dataFile);
  return createHttpServer(async (req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    try {
      if (req.method === "GET" && url.pathname === "/api/state") return json(res, 200, await store.read());
      if (req.method === "GET" && url.pathname === "/api/brief") return json(res, 200, generateBrief(await store.read()));
      if (req.method === "GET" && url.pathname === "/api/feedback-analysis") return json(res, 200, analyzeFeedback((await store.read()).feedback));
      if (req.method === "GET" && url.pathname === "/api/data-health") return json(res, 200, calculateDataHealth(await store.read()));

      if (req.method === "POST" && url.pathname === "/api/cycle/run") {
        const input = await readJson(req);
        const result = await store.mutate((state)=>String(state.metadata.schema_version).startsWith("3")
          ? runGrowthDataCycle(state,{ appId:input.app_id ?? "style-atlas" })
          : runOperatingCycle(state,{ appId:input.app_id ?? "style-atlas" }));
        return json(res, 200, result);
      }

      if (req.method === "POST" && url.pathname === "/api/metrics/import") {
        const input = await readJson(req);
        const provider = new ManualSnapshotProvider();
        const result = await store.mutate((state) => {
          const records = provider.importMetrics(input);
          if (!state.apps.some((app)=>app.id===input.app_id)) throw new Error("App not found");
          let inserted=0; let unchanged=0;
          for (const record of records) {
            const duplicate = state.metrics.some((item)=>item.app_id===record.app_id && (item.metric??item.name)===record.metric && item.period_start===record.period_start && item.period_end===record.period_end && item.provider===record.provider && item.source_reference===record.source_reference);
            if (duplicate) unchanged+=1; else { state.metrics.push(record); inserted+=1; }
          }
          const run = { id:crypto.randomUUID(), app_id:input.app_id, provider:input.provider ?? provider.id, source_reference:input.source_reference, started_at:new Date().toISOString(), completed_at:new Date().toISOString(), status:"succeeded", records_received:records.length, records_inserted:inserted, records_unchanged:unchanged, error:null };
          state.ingestion_runs.push(run);
          audit(state,req,"import_verified_metrics",run.id,"success",input.app_id,{ records_received:records.length, records_inserted:inserted, records_unchanged:unchanged, source_reference:input.source_reference });
          return { run, records_inserted:inserted, records_unchanged:unchanged };
        });
        return json(res, 201, result);
      }

      if (req.method === "POST" && url.pathname === "/api/feedback/import") {
        const input = await readJson(req);
        const provider = new ManualSnapshotProvider();
        const result = await store.mutate((state) => {
          const records = provider.importFeedback(input);
          let inserted=0;
          for (const record of records) if (!state.feedback.some((item)=>item.id===record.id || (item.source_reference===record.source_reference && item.external_id && item.external_id===record.external_id))) { state.feedback.push(record); inserted+=1; }
          audit(state,req,"import_verified_feedback",`${inserted} records`,"success",input.app_id,{ source_reference:input.source_reference, inserted });
          return { inserted, received:records.length };
        });
        return json(res, 201, result);
      }

      if (req.method === "POST" && url.pathname === "/api/apps") {
        const input = await readJson(req);
        if (!input.name) return json(res, 400, { error: "name is required" });
        const entity = await store.mutate((state) => addEntity(state, "apps", {
          slug: input.slug ?? input.name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,""),
          description:null, category:null, platform:input.platforms ?? [], app_store_url:null, website_url:null,
          status:"active", primary_market:null, target_audience:null, positioning:null, monetization_model:null,
          acquisition_channels:[], keywords:[], competitors:[], social_accounts:[], kpis:[], content_themes:[], ...input,
        }, req));
        return json(res, 201, entity);
      }

      const appMatch = url.pathname.match(/^\/api\/apps\/([^/]+)$/);
      if (req.method === "PATCH" && appMatch) {
        const input = await readJson(req);
        const entity = await store.mutate((state) => {
          const index = state.apps.findIndex((row) => row.id === appMatch[1]);
          if (index < 0) throw new Error("App not found");
          state.apps[index] = { ...state.apps[index], ...input, id: state.apps[index].id, updated_at: new Date().toISOString() };
          audit(state, req, "update_app", appMatch[1]);
          return state.apps[index];
        });
        return json(res, 200, entity);
      }
      if (req.method === "DELETE" && appMatch) {
        const entity = await store.mutate((state) => {
          const index = state.apps.findIndex((row) => row.id === appMatch[1]);
          if (index < 0) throw new Error("App not found");
          state.apps[index] = { ...state.apps[index], status:"archived", updated_at:new Date().toISOString() };
          audit(state, req, "archive_app", appMatch[1], "success", appMatch[1], { mode:"soft_delete" });
          return state.apps[index];
        });
        return json(res, 200, entity);
      }

      const insightActionMatch = url.pathname.match(/^\/api\/insights\/([^/]+)\/actions$/);
      if (req.method === "POST" && insightActionMatch) {
        const input = await readJson(req);
        const entity = await store.mutate((state) => {
          const insight = state.insights.find((row) => row.id === insightActionMatch[1]);
          if (!insight) throw new Error("Insight not found");
          const now = new Date().toISOString();
          const action = createActionFromInsight(insight, { ...input, id: crypto.randomUUID(), created_at: now });
          state.actions.push(action);
          audit(state, req, "create_action_from_insight", action.id, "success", action.app_id, { insight_id:insight.id });
          return action;
        });
        return json(res, 201, entity);
      }

      const actionMatch = url.pathname.match(/^\/api\/actions\/([^/]+)\/transition$/);
      if (req.method === "POST" && actionMatch) {
        const input = await readJson(req);
        const { status } = input;
        const entity = await store.mutate((state) => {
          const index = state.actions.findIndex((row) => row.id === actionMatch[1]);
          if (index < 0) throw new Error("Action not found");
          state.actions[index] = transitionAction(state.actions[index], status);
          let approval = state.approvals.find((item)=>item.action_id===actionMatch[1] && item.status==="approved") ?? null;
          if (status === "approved") {
            approval = { id:crypto.randomUUID(), action_id:actionMatch[1], status:"approved", source:input.approval_source ?? "local_dashboard_explicit_approval", scope:input.scope ?? state.actions[index].title, approved_at:new Date().toISOString(), actor:req.headers["x-actor"] ?? "local_operator" };
            state.approvals.push(approval); state.actions[index].approval_id=approval.id;
            if (!state.executions.some((item)=>item.action_id===actionMatch[1])) state.executions.push(createExecution(state.actions[index],{ approval }));
          }
          const executionIndex = state.executions.findIndex((item)=>item.action_id===actionMatch[1]);
          if (status === "executing" && executionIndex >= 0) state.executions[executionIndex] = transitionExecution(state.executions[executionIndex],"executing",{ approval });
          if (status === "completed" && executionIndex >= 0) state.executions[executionIndex] = transitionExecution(state.executions[executionIndex],"completed",{ approval, result:input.result, output_url:input.output_url, output_identifier:input.output_identifier });
          audit(state, req, "transition_action", `${actionMatch[1]} -> ${status}`, "success", state.actions[index].app_id, { status });
          return state.actions[index];
        });
        return json(res, 200, entity);
      }

      const executionMatch = url.pathname.match(/^\/api\/executions\/([^/]+)\/transition$/);
      if (req.method === "POST" && executionMatch) {
        const input=await readJson(req);
        const entity=await store.mutate((state)=>{
          const index=state.executions.findIndex((row)=>row.id===executionMatch[1]);if(index<0)throw new Error("Execution not found");
          const approval=state.approvals.find((item)=>item.id===state.executions[index].approval_id);
          state.executions[index]=transitionExecution(state.executions[index],input.state,{approval, ...input});
          audit(state,req,"transition_execution",`${executionMatch[1]} -> ${input.state}`,"success",state.executions[index].app_id,{state:input.state});
          return state.executions[index];
        });return json(res,200,entity);
      }

      if (req.method === "POST" && url.pathname === "/api/action-outcomes") {
        const input=await readJson(req);
        const entity=await store.mutate((state)=>{ const outcome=recordActionOutcome(input); state.action_outcomes.push(outcome); audit(state,req,"record_action_outcome",outcome.id,"success",outcome.app_id,{action_id:outcome.action_id,result:outcome.result}); return outcome; });
        return json(res,201,entity);
      }

      const experimentMatch = url.pathname.match(/^\/api\/experiments\/([^/]+)\/transition$/);
      if (req.method === "POST" && experimentMatch) {
        const { status } = await readJson(req);
        const entity = await store.mutate((state) => {
          const index = state.experiments.findIndex((row) => row.id === experimentMatch[1]);
          if (index < 0) throw new Error("Experiment not found");
          state.experiments[index] = transitionExperiment(state.experiments[index], status);
          audit(state, req, "transition_experiment", `${experimentMatch[1]} -> ${status}`, "success", state.experiments[index].app_id, { status });
          return state.experiments[index];
        });
        return json(res, 200, entity);
      }

      const simpleCreates = { "/api/feedback": "feedback", "/api/experiments": "experiments", "/api/content": "content", "/api/metrics": "metrics" };
      if (req.method === "POST" && simpleCreates[url.pathname]) {
        const input = await readJson(req);
        const entity = await store.mutate((state) => addEntity(state, simpleCreates[url.pathname], input, req));
        return json(res, 201, entity);
      }

      if (req.method === "GET") {
        const requested = url.pathname === "/" ? "index.html" : normalize(url.pathname).replace(/^\/+/, "");
        const file = join(publicDir, requested);
        if (!file.startsWith(publicDir)) return json(res, 403, { error: "Forbidden" });
        const body = await readFile(file);
        res.writeHead(200, { "content-type": mime[extname(file)] ?? "application/octet-stream" });
        return res.end(body);
      }
      return json(res, 404, { error: "Not found" });
    } catch (error) {
      const status = error.code === "ENOENT" || /not found/i.test(error.message) ? 404 : /invalid transition|required|JSON|too large/i.test(error.message) ? 400 : 500;
      return json(res, status, { error: error.message });
    }
  });
}

export async function startServer({ host = "127.0.0.1", port = Number(process.env.PORT || 4310), dataFile = defaultDataFile } = {}) {
  const server = createServer({ dataFile });
  await new Promise((resolve) => server.listen(port, host, resolve));
  console.log(`AI COO OS listening at http://${host}:${server.address().port}`);
  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await startServer();
