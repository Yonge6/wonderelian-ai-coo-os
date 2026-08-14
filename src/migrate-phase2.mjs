import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateState } from "./domain.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const file = join(root, "data/state.json");
const state = JSON.parse(await readFile(file, "utf8"));
if (state.metadata?.schema_version === "2.0.0") {
  console.log("PHASE2_MIGRATION_NOOP schema=2.0.0");
  process.exit(0);
}
const now = new Date().toISOString();
const verifiedAt = "2026-08-12T23:59:59.000Z";

state.metadata.schema_version = "2.0.0";
state.metadata.phase = 2;
state.metadata.operating_loop = ["observe","detect","decide","approve","execute","measure","learn"];
state.metadata.change_thresholds = {
  default:{ minimum_absolute_change:1, minimum_percentage_change:20, minimum_sample_size:10 },
  first_time_downloads:{ minimum_absolute_change:5, minimum_percentage_change:20, minimum_sample_size:20 },
  average_conversion_rate:{ minimum_absolute_change:0.5, minimum_percentage_change:15, minimum_sample_size:100 },
};

state.metrics = state.metrics.map((metric)=>({
  ...metric,
  metric:metric.metric ?? metric.name,
  name:metric.metric ?? metric.name,
  source:metric.source ?? "App Store Connect verified 90-day snapshot",
  source_reference:metric.source_reference ?? "ops-log:2026-08-14-app-store-baseline",
  imported_at:metric.imported_at ?? "2026-08-14T09:20:00.000Z",
  verified_at:metric.verified_at ?? verifiedAt,
  freshness:metric.freshness ?? "manual",
  confidence:metric.confidence ?? 1,
  notes:metric.notes ?? "Manually transcribed from the verified App Store Connect 90-day baseline; not a live API feed.",
}));

const providers = [
  { id:"manual_app_store_connect", name:"App Store Connect", type:"acquisition_revenue", mode:"manual_snapshot", status:"available", app_ids:["style-atlas"], last_sync:verifiedAt, last_successful_import:"2026-08-14T09:20:00.000Z", freshness:"manual", data_available:["impressions","product_page_views","first_time_downloads","redownloads","average_conversion_rate","in_app_purchases"], authentication_required:true, authentication_status:"api_not_configured", secrets_stored:false, error:null },
  { id:"local_ops_log", name:"Verified Operations Log", type:"operations", mode:"local_file", status:"available", app_ids:["style-atlas"], last_sync:"2026-08-14T09:38:00.000Z", last_successful_import:"2026-08-14T09:38:00.000Z", freshness:"fresh", data_available:["content","campaigns","public_urls","operating_memory"], authentication_required:false, authentication_status:"not_required", secrets_stored:false, error:null },
  { id:"public_url_verifier", name:"Public URL Verifier", type:"content", mode:"read_only_http", status:"available", app_ids:["style-atlas"], last_sync:"2026-08-14T09:38:00.000Z", last_successful_import:"2026-08-14T09:38:00.000Z", freshness:"fresh", data_available:["public_url_status"], authentication_required:false, authentication_status:"not_required", secrets_stored:false, error:null },
  { id:"search_console", name:"Google Search Console", type:"search", mode:"api", status:"not_connected", app_ids:["style-atlas"], last_sync:null, last_successful_import:null, freshness:"unknown", data_available:[], authentication_required:true, authentication_status:"not_configured", secrets_stored:false, error:null },
  { id:"social_url_tracking", name:"Social Platforms", type:"content_performance", mode:"published_url_tracking_only", status:"partial", app_ids:["style-atlas"], last_sync:"2026-08-14T09:38:00.000Z", last_successful_import:"2026-08-14T09:38:00.000Z", freshness:"manual", data_available:["published_urls"], authentication_required:true, authentication_status:"metrics_api_not_configured", secrets_stored:false, error:null },
  { id:"manual_verified_feedback", name:"Verified Feedback Import", type:"customer_feedback", mode:"manual_snapshot", status:"available", app_ids:["style-atlas"], last_sync:null, last_successful_import:null, freshness:"unknown", data_available:[], authentication_required:false, authentication_status:"not_required", secrets_stored:false, error:"No verified feedback snapshot has been supplied." },
];
state.providers = providers;

for (const action of state.actions) {
  if (action.id === "action-brand-seo-p0") Object.assign(action, { risk_level:3, approval_required:true, approval_id:"approval-brand-seo-p0", executor:"codex_operator", provider:"git_github_pages", measurement_window:{ start:"2026-08-14", end:"2026-09-13", metric:"first_time_downloads" } });
  if (action.id === "action-x-hierarchy-guide") Object.assign(action, { risk_level:2, approval_required:true, approval_id:"approval-x-hierarchy-guide", executor:"codex_operator", provider:"x_browser", measurement_window:{ start:"2026-08-14", end:"2026-08-21", metric:"first_time_downloads" } });
}

state.approvals = [
  { id:"approval-brand-seo-p0", action_id:"action-brand-seo-p0", status:"approved", source:"active_user_instruction", scope:"Deploy WonderElian and Style Atlas global SEO/GEO P0", approved_at:"2026-08-14T07:00:00.000Z", actor:"WonderElian" },
  { id:"approval-x-hierarchy-guide", action_id:"action-x-hierarchy-guide", status:"approved", source:"active_user_instruction", scope:"Continue high-quality English image-led publishing when browser accounts permit", approved_at:"2026-08-14T09:34:00.000Z", actor:"WonderElian" },
];

const campaignByChannel = new Map(state.campaigns.map((campaign)=>[campaign.channel_id,campaign]));
for (const item of state.content) {
  const campaign = campaignByChannel.get(item.channel_id);
  item.campaign_id ??= campaign?.id ?? null;
  item.landing_url ??= item.landing_page_url ?? (item.type === "guide" || item.type === "comparison" ? item.url : null);
  item.app_store_campaign_url ??= item.campaign_url ?? campaign?.url ?? null;
  item.publish_url ??= item.url;
  for (const field of ["views","likes","comments","shares","saves","landing_page_visits","attributed_conversions"]) if (!(field in item)) item[field]=null;
  item.product_page_views ??= null;
  item.measurement_status ??= item.status === "published" ? "collecting" : "not_started";
}

const seoCampaigns = [
  { id:"sa-seo-guide-hierarchy", app_id:"style-atlas", channel_id:"owned-search", name:"SEO Guide Visual Hierarchy", source:"search", medium:"organic", content:"visual-hierarchy-checklist", landing_url:"https://style-atlas.wonderelian.com/guides/visual-hierarchy-checklist/", url:"https://apps.apple.com/app/apple-store/id6787447019?pt=120014121&ct=SEO%20Guide%20Visual%20Hierarchy&mt=8", status:"active" },
  { id:"sa-seo-compare-nouveau-deco", app_id:"style-atlas", channel_id:"owned-search", name:"SEO Compare Nouveau Deco", source:"search", medium:"organic", content:"art-nouveau-vs-art-deco", landing_url:"https://style-atlas.wonderelian.com/compare/art-nouveau-vs-art-deco/", url:"https://apps.apple.com/app/apple-store/id6787447019?pt=120014121&ct=SEO%20Compare%20Nouveau%20Deco&mt=8", status:"active" },
];
for (const campaign of seoCampaigns) if (!state.campaigns.some((item)=>item.id===campaign.id)) state.campaigns.push(campaign);
const guide = state.content.find((item)=>item.id === "sa-guide-hierarchy");
Object.assign(guide, { campaign_id:"sa-seo-guide-hierarchy", landing_url:guide.url, app_store_campaign_url:guide.campaign_url });
const comparison = state.content.find((item)=>item.id === "sa-compare-nouveau-deco");
Object.assign(comparison, { campaign_id:"sa-seo-compare-nouveau-deco", landing_url:comparison.url, app_store_campaign_url:comparison.campaign_url });

state.attributions = [
  { id:"attr-sa-guide-hierarchy", app_id:"style-atlas", content_id:"sa-guide-hierarchy", campaign_id:"sa-seo-guide-hierarchy", source:"search", medium:"organic", content:"visual-hierarchy-checklist", landing_url:guide.url, app_store_campaign_url:guide.campaign_url, publish_url:guide.url, first_time_downloads:null, measurement_status:"collecting" },
  { id:"attr-sa-compare-nouveau-deco", app_id:"style-atlas", content_id:"sa-compare-nouveau-deco", campaign_id:"sa-seo-compare-nouveau-deco", source:"search", medium:"organic", content:"art-nouveau-vs-art-deco", landing_url:comparison.url, app_store_campaign_url:comparison.campaign_url, publish_url:comparison.url, first_time_downloads:null, measurement_status:"collecting" },
  { id:"attr-sa-x-hierarchy-guide", app_id:"style-atlas", content_id:"sa-x-hierarchy-guide-20260814", campaign_id:"sa-x-organic", source:"x", medium:"organic-social", content:"hierarchy-guide-image", landing_url:"https://style-atlas.wonderelian.com/guides/visual-hierarchy-checklist/", app_store_campaign_url:"https://apps.apple.com/app/apple-store/id6787447019?pt=120014121&ct=X%20Organic&mt=8", publish_url:"https://x.com/WonderElian/status/2088198316786074075", first_time_downloads:null, measurement_status:"collecting" },
];

const experiment = state.experiments.find((item)=>item.id === "sa-seo-page-format-01");
Object.assign(experiment, {
  control:"Visual Hierarchy Checklist guide", variant:"Art Nouveau vs. Art Deco comparison",
  campaign_ids:["sa-seo-guide-hierarchy","sa-seo-compare-nouveau-deco"],
  content_ids:["sa-guide-hierarchy","sa-compare-nouveau-deco"],
  urls:[guide.url,comparison.url], baseline:null, target:"At least one verified attributed first-time download per variant",
  start_date:"2026-08-14", end_date:"2026-09-13", sample_requirement:"Verified campaign-level App Store outcomes for both variants",
  current_result:null, result_status:"awaiting_verified_attribution_data", confidence:null, decision:null,
} );

state.jobs = [
  ["job-import-acquisition","import_acquisition_metrics","manual_app_store_connect","every:1d"],
  ["job-content-performance","update_content_performance","social_url_tracking","every:1d"],
  ["job-feedback-refresh","refresh_customer_feedback","manual_verified_feedback","every:1d"],
  ["job-calculate-anomalies","calculate_anomalies","internal_change_detection","every:1d"],
  ["job-generate-insights","generate_insights","internal_decision_engine","every:1d"],
  ["job-refresh-brief","refresh_daily_brief","internal_brief","every:1d"],
  ["job-evaluate-experiments","evaluate_experiments","internal_experiments","every:1d"],
  ["job-measure-actions","measure_completed_actions","internal_measurement","every:1d"],
].map(([id,type,provider,schedule])=>({ id,type,provider,app_id:"style-atlas",schedule,last_run:null,next_run:now,status:"scheduled",duration:null,result:null,error:null,retry_count:0 }));

state.detections = [];
state.executions = [];
state.action_outcomes = [];
state.learnings = [];
state.operating_memory = [
  { id:"memory-style-atlas-positioning", app_id:"style-atlas", category:"positioning", statement:"Style Atlas is a structured visual reference and style-discovery product for creators and visually curious learners.", evidence:["https://style-atlas.wonderelian.com/"], source:"verified_product_site", confidence:1, created_at:now, last_validated_at:"2026-08-14T09:38:00.000Z", status:"active" },
  { id:"memory-style-atlas-content-rule", app_id:"style-atlas", category:"brand_constraint", statement:"Public global copy is English; promotional artwork uses original polished still images and every published item keeps a permanent URL and attribution path.", evidence:["ops-log:publishing-system"], source:"verified_ops_handoff", confidence:1, created_at:now, last_validated_at:now, status:"active" },
  { id:"memory-indie-hackers-blocker", app_id:"style-atlas", category:"platform_blocker", statement:"Indie Hackers has an OAuth identity-state conflict; do not switch email or use an alias without approval.", evidence:["ops-log:2026-08-14-active-acquisition-setup"], source:"verified_ops_handoff", confidence:1, created_at:now, last_validated_at:now, status:"active" },
  { id:"memory-no-spam", app_id:"style-atlas", category:"brand_constraint", statement:"Community participation must be useful and relevant; no mass comments, repeated templates, fake testimonials, or bulk direct messages.", evidence:["ops-log:guardrails"], source:"verified_ops_handoff", confidence:1, created_at:now, last_validated_at:now, status:"active" },
];
state.ingestion_runs = [{ id:"ingestion-style-atlas-baseline-20260812", app_id:"style-atlas", provider:"manual_app_store_connect", source_reference:"ops-log:2026-08-14-app-store-baseline", started_at:"2026-08-14T09:20:00.000Z", completed_at:"2026-08-14T09:20:00.000Z", status:"succeeded", records_received:6, records_inserted:6, records_unchanged:0, error:null }];
state.cycles = [];

for (const insight of state.insights) {
  insight.interpretation ??= insight.reason;
  insight.evidence_quality ??= Math.round((insight.confidence ?? 0)*100);
  insight.effort ??= insight.category === "measurement" || insight.category === "acquisition" ? 25 : 55;
  insight.reversibility ??= insight.category === "SEO" ? 75 : 95;
  insight.strategic_relevance ??= 95;
  insight.recommended_risk_level ??= insight.category === "SEO" ? 2 : 0;
}

state.metadata.last_updated = now;
validateState(state);
await writeFile(file, `${JSON.stringify(state,null,2)}\n`, "utf8");
console.log(`PHASE2_MIGRATION_OK metrics=${state.metrics.length} jobs=${state.jobs.length} attributions=${state.attributions.length}`);
