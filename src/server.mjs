import { createServer as createHttpServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { JsonStore } from "./store.mjs";
import { analyzeFeedback, createActionFromInsight, generateBrief, transitionAction, transitionExperiment } from "./domain.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");
const defaultDataFile = join(root, "data/state.json");
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8" };

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
        const { status } = await readJson(req);
        const entity = await store.mutate((state) => {
          const index = state.actions.findIndex((row) => row.id === actionMatch[1]);
          if (index < 0) throw new Error("Action not found");
          state.actions[index] = transitionAction(state.actions[index], status);
          audit(state, req, "transition_action", `${actionMatch[1]} -> ${status}`, "success", state.actions[index].app_id, { status });
          return state.actions[index];
        });
        return json(res, 200, entity);
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
      const status = /not found/i.test(error.message) ? 404 : /invalid transition|required|JSON|too large/i.test(error.message) ? 400 : 500;
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
