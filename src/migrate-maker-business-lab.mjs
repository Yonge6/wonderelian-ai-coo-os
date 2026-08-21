import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { validateState } from "./domain.mjs";

const stateFile = fileURLToPath(new URL("../data/state.json", import.meta.url));
const state = JSON.parse(await readFile(stateFile, "utf8"));
const now = new Date().toISOString();

const makerWebsite = {
  id:"site-maker-business-lab",
  app_id:null,
  name:"Maker Business Lab",
  name_zh:"Maker Business Lab",
  url:"https://maker.wonderelian.com/",
  kind:"business_tool",
  hosting:"github_pages",
  market:"united_states",
  primary_conversion:"recommendation_click",
  operation_status:"active",
  health_status:"pending_check",
  analytics_status:"tag_detected",
  last_checked_at:null,
};

const makerOperation = {
  id:"webop-maker-business-lab-growth",
  website_id:makerWebsite.id,
  app_id:null,
  priority:"P0",
  status:"active",
  title:"Grow qualified maker-business decisions and attributable recommendations",
  title_zh:"增长高意向创客商业决策与可归因推荐",
  next_action:"Connect the existing PostHog or first-party event stream to a verified read-only Provider, then measure opportunity discovery and recommendation clicks without changing product logic.",
  next_action_zh:"将现有 PostHog 或第一方事件流接入已验证的只读 Provider，再测量机会发现与推荐点击，不改变产品逻辑。",
  page_views:null,
  cta_clicks:null,
  conversions:null,
};

const websiteIndex = state.websites.findIndex((row) => row.id === makerWebsite.id);
if (websiteIndex < 0) state.websites.push(makerWebsite);
else {
  const existing = state.websites[websiteIndex];
  state.websites[websiteIndex] = {
    ...existing,
    ...makerWebsite,
    health_status:existing.health_status,
    analytics_status:existing.analytics_status,
    last_checked_at:existing.last_checked_at,
  };
}

const operationIndex = state.website_operations.findIndex((row) => row.id === makerOperation.id);
if (operationIndex < 0) state.website_operations.push(makerOperation);
else state.website_operations[operationIndex] = { ...state.website_operations[operationIndex], ...makerOperation };

const portfolioOperation = state.website_operations.find((row) => row.id === "webop-wonderelian-portfolio");
if (portfolioOperation) Object.assign(portfolioOperation, {
  title:"Turn the portfolio into the seven-site discovery hub",
  title_zh:"把品牌站变成七站发现中枢",
  next_action:"Add a clear visible H1, verified links to all six products and measurable product-discovery clicks.",
  next_action_zh:"增加清晰可见的 H1、六个产品的已验证链接，并测量产品发现点击。",
});

const websiteIds = state.websites.map((row) => row.id);
for (const providerId of ["public_website_health", "website_analytics_api"]) {
  const provider = state.providers.find((row) => row.id === providerId);
  if (provider) provider.website_ids = websiteIds;
}
const healthProvider = state.providers.find((row) => row.id === "public_website_health");
if (healthProvider) healthProvider.name = "Portfolio Public Health Monitor";

if (!state.audit.some((row) => row.action === "register_maker_business_lab_operations")) {
  state.audit.unshift({
    id:crypto.randomUUID(),
    at:now,
    actor:"Codex COO",
    app_id:null,
    source:"active_user_authorization",
    action:"register_maker_business_lab_operations",
    input:{website:makerWebsite.url, external_writes:false, product_repository_changes:false},
    result:{website_id:makerWebsite.id, websites_tracked:state.websites.length, analytics_status:"tag_detected", verified_traffic_observations:0},
    status:"success",
    error:null,
  });
}

state.metadata.last_updated = now;
validateState(state);
await writeFile(stateFile, `${JSON.stringify(state, null, 2)}\n`, "utf8");
console.log(`MAKER_BUSINESS_LAB_MIGRATION_OK websites=${state.websites.length} operations=${state.website_operations.length}`);
