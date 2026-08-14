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
    const key = `${metric.app_id}:${metric.name}`;
    if (!latest.has(key) || latest.get(key).period_end < metric.period_end) latest.set(key, metric);
  }
  const result = {};
  for (const name of PORTFOLIO_KPIS) {
    const rows = [...latest.values()].filter((row) => row.name === name && row.value !== null);
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
  return {
    id: input.id,
    insight_id: insight.id,
    app_id: insight.app_id,
    title: input.title ?? insight.recommended_action,
    description: input.description ?? insight.reason,
    rationale: insight.observation,
    priority: scoreInsight(insight),
    expected_impact: input.expected_impact ?? insight.expected_impact,
    confidence: insight.confidence,
    owner: input.owner ?? "WonderElian",
    status: "proposed",
    approval_required: true,
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
  const ranked = rankInsights(state.insights).slice(0, 3);
  return {
    generated_at: new Date().toISOString(),
    primary_outcome: state.metadata.primary_outcome,
    kpis: aggregatePortfolioKpis(state),
    portfolio_summary: `${state.apps.length} apps are tracked; ${new Set(state.metrics.filter((metric)=>metric.name === "first_time_downloads" && metric.value !== null).map((metric)=>metric.app_id)).size} currently report the primary outcome.`,
    portfolio_summary_zh: `已追踪 ${state.apps.length} 个应用；目前 ${new Set(state.metrics.filter((metric)=>metric.name === "first_time_downloads" && metric.value !== null).map((metric)=>metric.app_id)).size} 个上报北极星指标。`,
    winners: [],
    problems: rankInsights(state.insights).filter((item)=>item.category === "measurement" || item.category === "conversion").slice(0,3),
    opportunities: rankInsights(state.insights).filter((item)=>item.category !== "measurement").slice(0,3),
    recommendations: ranked.map((item) => ({
      app: appNames.get(item.app_id) ?? "Portfolio",
      app_zh: appNamesZh.get(item.app_id) ?? "产品组合",
      observation: item.observation,
      observation_zh: item.observation_zh,
      evidence: item.evidence,
      evidence_zh: item.evidence_zh,
      reason: item.reason,
      reason_zh: item.reason_zh,
      action: item.recommended_action,
      action_zh: item.recommended_action_zh,
      expected_impact: item.expected_impact,
      expected_impact_zh: item.expected_impact_zh,
      confidence: item.confidence,
      priority: item.score,
    })),
  };
}

export function validateState(state) {
  const collections = ["apps", "metrics", "channels", "campaigns", "content", "insights", "actions", "feedback", "opportunities", "experiments", "providers", "jobs", "events", "audit"];
  if (!state?.metadata?.schema_version) throw new Error("metadata.schema_version is required");
  for (const name of collections) if (!Array.isArray(state[name])) throw new Error(`${name} must be an array`);
  for (const name of collections) {
    const ids = state[name].filter((row) => row.id).map((row) => row.id);
    if (ids.length !== new Set(ids).size) throw new Error(`Duplicate ids in ${name}`);
  }
  const appIds = new Set(state.apps.map((app) => app.id));
  for (const name of ["metrics", "campaigns", "content", "insights", "actions", "feedback", "experiments"]) {
    for (const row of state[name]) if (row.app_id && !appIds.has(row.app_id)) throw new Error(`${name}.${row.id} references missing app ${row.app_id}`);
  }
  for (const metric of state.metrics) {
    if (metric.value !== null && typeof metric.value !== "number") throw new Error(`Metric ${metric.id} value must be number or null`);
  }
  return state;
}
