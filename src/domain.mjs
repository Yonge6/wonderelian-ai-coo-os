import { calculateDataHealth, metricName, validateMetricRecord } from "./metrics.mjs";
import { requiredApproval, scoreDecision } from "./operations.mjs";
import { evaluateMarketingPlaybooks } from "./marketing-playbooks.mjs";

export const ACTION_TRANSITIONS = {
  proposed: ["approved", "rejected"],
  approved: ["executing", "rejected"],
  executing: ["completed", "rejected"],
  completed: [],
  rejected: [],
};

export const EXPERIMENT_TRANSITIONS = {
  draft: ["planned"],
  planned: ["running", "killed"],
  running: ["completed", "killed"],
  completed: [],
  killed: [],
};

export const PORTFOLIO_KPIS = [
  "first_time_downloads", "active_users", "revenue", "trial_starts", "paid_conversions",
  "conversion_rate", "d1_retention", "d7_retention", "d30_retention", "traffic",
  "content_published", "acquisition_performance",
];

export function scoreInsight({ impact = 0, urgency = 0, confidence = 0 }) {
  return Math.round((impact * 0.5) + (urgency * 0.3) + (confidence * 100 * 0.2));
}

export function transition(entity, nextStatus, transitions) {
  const allowed = transitions[entity.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw new Error(`Invalid transition: ${entity.status} -> ${nextStatus}`);
  }
  return { ...entity, status: nextStatus, updated_at: new Date().toISOString() };
}

export function transitionAction(action, nextStatus) {
  const result = transition(action, nextStatus, ACTION_TRANSITIONS);
  if (nextStatus === "completed") result.completed_at = result.updated_at;
  return result;
}

export function transitionExperiment(experiment, nextStatus) {
  return transition(experiment, nextStatus, EXPERIMENT_TRANSITIONS);
}

export function aggregatePortfolioKpis(state) {
  const latest = new Map();
  for (const metric of state.metrics) {
    const key = `${metric.app_id}:${metricName(metric)}`;
    if (!latest.has(key) || latest.get(key).period_end < metric.period_end) latest.set(key, metric);
  }
  const result = {};
  for (const name of PORTFOLIO_KPIS) {
    const aliases = name === "conversion_rate" ? ["conversion_rate", "average_conversion_rate"] : [name];
    const rows = [...latest.values()].filter((row) => aliases.includes(metricName(row)) && row.value !== null);
    if (name === "content_published") {
      const published = state.content.filter((item) => item.status === "published");
      result[name] = { value: published.length, apps_reporting: new Set(published.map((item) => item.app_id)).size, apps_total: state.apps.length };
      continue;
    }
    result[name] = {
      value: rows.length ? rows.reduce((sum, row) => sum + row.value, 0) : null,
      apps_reporting: new Set(rows.map((row) => row.app_id)).size,
      apps_total: state.apps.length,
    };
  }
  return result;
}

export function rankInsights(insights) {
  return insights
    .filter((item) => item.status === "open")
    .map((item) => ({ ...item, score: scoreInsight(item) }))
    .sort((a, b) => b.score - a.score);
}

export function createActionFromInsight(insight, input = {}) {
  const riskLevel = input.risk_level ?? insight.recommended_risk_level ?? 1;
  const decision = scoreDecision({
    expected_impact: insight.impact, confidence: insight.confidence, urgency: insight.urgency,
    effort: input.effort ?? insight.effort, reversibility: input.reversibility ?? insight.reversibility,
    strategic_relevance: insight.strategic_relevance, evidence_quality: insight.evidence_quality,
  });
  return {
    id: input.id,
    insight_id: insight.id,
    app_id: insight.app_id,
    title: input.title ?? insight.recommended_action,
    description: input.description ?? insight.reason,
    rationale: insight.observation,
    priority: decision.score,
    decision_score: decision,
    expected_impact: input.expected_impact ?? insight.expected_impact,
    confidence: insight.confidence,
    owner: input.owner ?? "WonderElian",
    risk_level: riskLevel,
    status: "proposed",
    approval_required: requiredApproval(riskLevel),
    executor: input.executor ?? "internal",
    provider: input.provider ?? "internal",
    measurement_window: input.measurement_window ?? null,
    created_at: input.created_at,
    updated_at: input.created_at,
    completed_at: null,
  };
}

export function analyzeFeedback(feedback) {
  const groups = new Map();
  for (const item of feedback) {
    const topic = (item.topic || "unclassified").trim().toLowerCase();
    const key = `${item.app_id}:${topic}`;
    if (!groups.has(key)) groups.set(key, { app_id:item.app_id, topic, items:[] });
    groups.get(key).items.push(item);
  }
  const themes = [...groups.values()].map((group) => {
    const severity = Math.max(1, ...group.items.map((item) => item.severity ?? (item.sentiment === "negative" ? 4 : 2)));
    return { ...group, frequency:group.items.length, severity, evidence:group.items.slice(0,3).map((item) => item.text), score:Math.min(100, Math.round(group.items.length * severity * 8.5)) };
  }).sort((a,b)=>b.score-a.score);
  return {
    themes,
    opportunities: themes.filter((theme) => theme.frequency >= 2 && theme.severity >= 3).map((theme) => ({
      app_id:theme.app_id, problem:theme.topic, affected_users:theme.frequency, frequency:theme.frequency,
      severity:theme.severity, evidence:theme.evidence, proposed_solution:"Review evidence and validate a focused product response.", opportunity_score:theme.score,
    })),
  };
}

export function generateBrief(state) {
  const appNames = new Map(state.apps.map((app) => [app.id, app.name]));
  const appNamesZh = new Map(state.apps.map((app) => [app.id, app.name_zh ?? app.name]));
  const healthByApp = new Map(calculateDataHealth(state).map((item)=>[item.app_id,item]));
  const ranked = state.insights.filter((item)=>item.status === "open").map((item) => {
    const health = healthByApp.get(item.app_id);
    const confidence = Math.min(item.confidence ?? 0, health?.confidence_cap ?? 0.65);
    const decisionScore = scoreDecision({
      expected_impact:item.impact, confidence, urgency:item.urgency,
      effort:item.effort, reversibility:item.reversibility,
      strategic_relevance:item.strategic_relevance, evidence_quality:item.evidence_quality,
    });
    return { ...item, confidence, score:decisionScore.score, decision_score:decisionScore };
  }).sort((a,b)=>b.score-a.score).slice(0,3);
  const changes = (state.detections ?? []).filter((item)=>item.type === "metric_change" && item.severity !== "low").slice(0,3);
  const dataHealth = calculateDataHealth(state);
  const dataRisks = dataHealth.filter((item)=>item.missing_critical_metrics.length || item.stale_providers.length || item.import_errors.length).slice(0,3);
  const recommendations = ranked.map((item) => ({
    app: appNames.get(item.app_id) ?? "Portfolio",
    app_zh: appNamesZh.get(item.app_id) ?? "产品组合",
    observation: item.observation,
    observation_zh: item.observation_zh,
    evidence: item.evidence,
    evidence_zh: item.evidence_zh,
    reason: item.interpretation ?? item.reason,
    reason_zh: item.interpretation_zh ?? item.reason_zh,
    action: item.recommended_action,
    action_zh: item.recommended_action_zh,
    expected_impact: item.expected_impact,
    expected_impact_zh: item.expected_impact_zh,
    confidence: item.confidence,
    reversibility: item.reversibility ?? 50,
    estimated_effort: item.effort ?? 50,
    approval_required: requiredApproval(item.recommended_risk_level ?? 1),
    risk_level: item.recommended_risk_level ?? 1,
    priority: item.score,
    decision_score: item.decision_score,
  }));
  const websites = state.websites ?? [];
  const reportingApps = new Set(state.metrics
    .filter((metric)=>metricName(metric) === "first_time_downloads" && metric.value !== null)
    .map((metric)=>metric.app_id)).size;
  return {
    generated_at: new Date().toISOString(),
    primary_outcome: state.metadata.primary_outcome,
    kpis: aggregatePortfolioKpis(state),
    website_summary: {
      sites_tracked:websites.length,
      sites_live:websites.filter((site)=>site.health_status === "live").length,
      analytics_connected:websites.filter((site)=>site.analytics_status === "connected").length,
      traffic_metrics_available:(state.website_metrics ?? []).filter((metric)=>metric.value !== null).length,
      data_through:state.metadata.data_through?.website_health ?? null,
    },
    portfolio_summary: `${state.apps.length} apps and ${websites.length} websites are tracked. ${reportingApps} of ${state.apps.length} apps currently ${reportingApps === 1 ? "reports" : "report"} the primary outcome; recommendations are qualified by data coverage.`,
    portfolio_summary_zh: `已追踪 ${state.apps.length} 个应用和 ${websites.length} 个网站。目前 ${reportingApps} 个上报北极星指标；所有建议均受数据覆盖度约束。`,
    what_changed: changes,
    no_material_change: changes.length === 0,
    winners: changes.filter((item)=>item.direction === "rising").slice(0,3),
    problems: [...changes.filter((item)=>item.direction === "falling"), ...ranked.filter((item)=>item.category === "measurement")].slice(0,3),
    opportunities: ranked.filter((item)=>item.category !== "measurement").slice(0,3),
    data_risks: dataRisks,
    marketing_playbooks: evaluateMarketingPlaybooks(state),
    decisions: recommendations,
    recommendations,
  };
}

export function validateState(state) {
  const collections = ["apps", "metrics", "channels", "campaigns", "content", "attributions", "insights", "actions", "feedback", "opportunities", "experiments", "providers", "jobs", "events", "audit", "detections", "executions", "approvals", "action_outcomes", "learnings", "operating_memory", "ingestion_runs", "cycles"];
  if (String(state?.metadata?.schema_version).startsWith("3")) collections.push("provider_syncs", "reconciliations", "search_observations", "geo_observations", "instrumentation");
  for (const optional of ["websites", "website_observations", "website_metrics", "website_operations"]) if (state?.[optional] !== undefined) collections.push(optional);
  if (!state?.metadata?.schema_version) throw new Error("metadata.schema_version is required");
  for (const name of collections) if (!Array.isArray(state[name])) throw new Error(`${name} must be an array`);
  for (const name of collections) {
    const ids = state[name].filter((row) => row.id).map((row) => row.id);
    if (ids.length !== new Set(ids).size) throw new Error(`Duplicate ids in ${name}`);
  }
  const appIds = new Set(state.apps.map((app) => app.id));
  for (const name of ["metrics", "campaigns", "content", "attributions", "insights", "actions", "feedback", "experiments", "detections", "executions", "learnings", "operating_memory"]) {
    for (const row of state[name]) if (row.app_id && !appIds.has(row.app_id)) throw new Error(`${name}.${row.id} references missing app ${row.app_id}`);
  }
  if (state.websites) {
    const websiteIds = new Set(state.websites.map((website) => website.id));
    for (const website of state.websites) if (website.app_id && !appIds.has(website.app_id)) throw new Error(`websites.${website.id} references missing app ${website.app_id}`);
    for (const name of ["website_observations", "website_metrics", "website_operations"]) {
      for (const row of state[name] ?? []) if (!websiteIds.has(row.website_id)) throw new Error(`${name}.${row.id} references missing website ${row.website_id}`);
    }
  }
  for (const metric of state.metrics) validateMetricRecord(metric);
  for (const action of state.actions) if (action.risk_level !== undefined) requiredApproval(action.risk_level);
  return state;
}
