import { calculateDataHealth, metricName } from "./metrics.mjs";

export const ACTION_RISK = {
  0: { name: "read_only", approval_required: false },
  1: { name: "internal_reversible", approval_required: false },
  2: { name: "external_reversible", approval_required: true },
  3: { name: "high_consequence", approval_required: true },
};

export const EXECUTION_TRANSITIONS = {
  waiting: ["ready", "blocked", "cancelled"],
  ready: ["executing", "blocked", "cancelled"],
  executing: ["completed", "failed", "blocked", "cancelled"],
  blocked: ["ready", "cancelled"],
  failed: ["ready", "cancelled"],
  completed: [],
  cancelled: [],
};

export const DEFAULT_THRESHOLDS = {
  default: { minimum_absolute_change: 1, minimum_percentage_change: 20, minimum_sample_size: 10 },
  average_conversion_rate: { minimum_absolute_change: 0.5, minimum_percentage_change: 15, minimum_sample_size: 100 },
  conversion_rate: { minimum_absolute_change: 0.5, minimum_percentage_change: 15, minimum_sample_size: 100 },
  first_time_downloads: { minimum_absolute_change: 5, minimum_percentage_change: 20, minimum_sample_size: 20 },
  impressions: { minimum_absolute_change: 100, minimum_percentage_change: 25, minimum_sample_size: 100 },
  product_page_views: { minimum_absolute_change: 25, minimum_percentage_change: 20, minimum_sample_size: 50 },
};

export function scoreDecision(input) {
  const normalized = {
    expected_impact: input.expected_impact ?? input.impact ?? 0,
    confidence: Math.round((input.confidence ?? 0) * 100),
    urgency: input.urgency ?? 0,
    effort_advantage: 100 - (input.effort ?? 50),
    reversibility: input.reversibility ?? 50,
    strategic_relevance: input.strategic_relevance ?? 50,
    evidence_quality: input.evidence_quality ?? Math.round((input.confidence ?? 0) * 100),
  };
  const weights = { expected_impact:.25, confidence:.20, urgency:.15, effort_advantage:.10, reversibility:.10, strategic_relevance:.10, evidence_quality:.10 };
  const contributions = Object.fromEntries(Object.entries(weights).map(([key, weight]) => [key, Math.round(normalized[key] * weight * 10) / 10]));
  return { score: Math.round(Object.values(contributions).reduce((sum,value)=>sum+value,0)), inputs: normalized, weights, contributions };
}

function comparableGroups(metrics) {
  const groups = new Map();
  for (const record of metrics.filter((item)=>item.value !== null)) {
    const key = `${record.app_id}:${metricName(record)}:${record.provider}:${record.unit ?? ""}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }
  return [...groups.values()].map((rows)=>rows.sort((a,b)=>String(a.period_end).localeCompare(String(b.period_end))));
}

export function detectMetricChanges(metrics, { thresholds = DEFAULT_THRESHOLDS, now = new Date().toISOString() } = {}) {
  const detections = [];
  for (const rows of comparableGroups(metrics)) {
    if (rows.length < 2) continue;
    const previous = rows.at(-2); const current = rows.at(-1);
    const metric = metricName(current);
    const threshold = thresholds[metric] ?? thresholds.default;
    const absolute = current.value - previous.value;
    const percentage = previous.value === 0 ? null : (absolute / Math.abs(previous.value)) * 100;
    const sampleSize = current.sample_size ?? current.value;
    const clearsChange = Math.abs(absolute) >= threshold.minimum_absolute_change && (percentage === null || Math.abs(percentage) >= threshold.minimum_percentage_change);
    const clearsSample = sampleSize === null || sampleSize === undefined || sampleSize >= threshold.minimum_sample_size;
    if (!clearsChange || !clearsSample) continue;
    const magnitude = percentage === null ? 0 : Math.abs(percentage);
    detections.push({
      id: `detection-${current.id}`,
      app_id: current.app_id,
      type: "metric_change",
      metric,
      provider: current.provider,
      current_value: current.value,
      previous_baseline: previous.value,
      absolute_change: absolute,
      percentage_change: percentage === null ? null : Math.round(percentage * 10) / 10,
      sample_size: sampleSize ?? null,
      confidence: Math.min(current.confidence ?? 0.5, previous.confidence ?? 0.5),
      severity: magnitude >= 50 ? "high" : magnitude >= 25 ? "medium" : "low",
      direction: absolute > 0 ? "rising" : "falling",
      detected_at: now,
      source_metric_ids: [previous.id, current.id],
    });
  }
  return detections;
}

export function detectDataRisks(state, { now = new Date() } = {}) {
  return calculateDataHealth(state, { now }).flatMap((health) => {
    const rows = [];
    if (health.stale_providers.length) rows.push({ id:`data-risk-stale-${health.app_id}`, app_id:health.app_id, type:"stale_source", metric:null, current_value:null, previous_baseline:null, absolute_change:null, percentage_change:null, sample_size:null, confidence:1, severity:"medium", detected_at:now.toISOString(), evidence:`Stale providers: ${health.stale_providers.join(", ")}` });
    if (health.missing_critical_metrics.length) rows.push({ id:`data-risk-missing-${health.app_id}`, app_id:health.app_id, type:"missing_data", metric:null, current_value:null, previous_baseline:null, absolute_change:null, percentage_change:null, sample_size:null, confidence:1, severity:"medium", detected_at:now.toISOString(), evidence:`Missing critical metrics: ${health.missing_critical_metrics.join(", ")}` });
    const missingFeeds=health.providers.filter((provider)=>provider.status==="not_connected").map((provider)=>provider.id);
    if(missingFeeds.length) rows.push({id:`data-risk-feed-${health.app_id}`,app_id:health.app_id,type:"missing_feed",metric:null,current_value:null,previous_baseline:null,absolute_change:null,percentage_change:null,sample_size:null,confidence:1,severity:"medium",detected_at:now.toISOString(),evidence:`Missing provider integrations: ${missingFeeds.join(", ")}`});
    if(health.import_errors.length) rows.push({id:`data-risk-import-${health.app_id}`,app_id:health.app_id,type:"import_error",metric:null,current_value:null,previous_baseline:null,absolute_change:null,percentage_change:null,sample_size:null,confidence:1,severity:"medium",detected_at:now.toISOString(),evidence:`Provider errors: ${health.import_errors.map((item)=>item.provider).join(", ")}`});
    return rows;
  });
}

export function detectionsToInsights(detections, { existingIds = new Set(), now = new Date().toISOString() } = {}) {
  return detections.filter((detection)=>detection.severity !== "low" && detection.type === "metric_change").flatMap((detection) => {
    const id = `insight-${detection.id}`;
    if (existingIds.has(id)) return [];
    const direction = detection.direction === "rising" ? "increased" : "decreased";
    const interpretation = detection.direction === "rising"
      ? "Recent acquisition or conversion work may be attracting better-fit traffic; attribution should be checked before scaling."
      : "Traffic quality, listing conversion, or channel mix may have weakened; diagnose the source before increasing volume.";
    return [{
      id, app_id:detection.app_id, detection_id:detection.id, source:"change_detection", category:"performance", status:"open",
      title:`${detection.metric} changed materially`,
      observation:`${detection.metric} ${direction} materially.`,
      evidence:`${detection.previous_baseline} -> ${detection.current_value} (${detection.percentage_change === null ? "n/a" : `${detection.percentage_change}%`}).`,
      interpretation,
      reason:interpretation,
      recommended_action:"Break the change down by campaign and source before reallocating effort.",
      expected_impact:"Protects acquisition quality and focuses follow-up on attributable downloads.",
      impact:75, urgency:detection.direction === "falling" ? 80 : 65, confidence:detection.confidence,
      evidence_quality:Math.round(detection.confidence*100), effort:30, reversibility:90, strategic_relevance:90,
      detected_at:now,
    }];
  });
}

export function requiredApproval(riskLevel) {
  const risk = ACTION_RISK[riskLevel];
  if (!risk) throw new Error(`Invalid action risk level: ${riskLevel}`);
  return risk.approval_required;
}

export function createExecution(action, { id = crypto.randomUUID(), now = new Date().toISOString(), approval = null } = {}) {
  const riskLevel = action.risk_level ?? 2;
  const needsApproval = requiredApproval(riskLevel);
  const approved = action.status === "approved" || action.status === "executing" || action.status === "completed" || Boolean(approval);
  return {
    id, action_id:action.id, insight_id:action.insight_id ?? null, app_id:action.app_id,
    risk_level:riskLevel, state:needsApproval && !approved ? "waiting" : "ready",
    executor:action.executor ?? "internal", provider:action.provider ?? "internal",
    approval_id:approval?.id ?? action.approval_id ?? null, execution_log:[], output_url:null, output_identifier:null,
    result:null, measurement_window:action.measurement_window ?? null, created_at:now, updated_at:now,
  };
}

export function transitionExecution(execution, nextState, { approval = null, now = new Date().toISOString(), result = null, output_url = null, output_identifier = null } = {}) {
  const allowed = EXECUTION_TRANSITIONS[execution.state] ?? [];
  if (!allowed.includes(nextState)) throw new Error(`Invalid execution transition: ${execution.state} -> ${nextState}`);
  if (["ready","executing","completed"].includes(nextState) && requiredApproval(execution.risk_level) && !(approval?.status === "approved" || execution.approval_id)) throw new Error("Approved external execution requires an approval record");
  if (nextState === "completed" && execution.risk_level >= 2 && !output_url && !output_identifier && !execution.output_url && !execution.output_identifier) throw new Error("Completed external execution requires a verified output URL or identifier");
  return { ...execution, state:nextState, result:result ?? execution.result, output_url:output_url ?? execution.output_url, output_identifier:output_identifier ?? execution.output_identifier, updated_at:now, completed_at:nextState === "completed" ? now : execution.completed_at ?? null };
}

export function recordActionOutcome(input, { id = crypto.randomUUID(), now = new Date().toISOString() } = {}) {
  const allowed = ["positive", "neutral", "negative", "inconclusive", "not_measurable"];
  if (!input.action_id) throw new Error("Action outcome requires action_id");
  if (!allowed.includes(input.result)) throw new Error("Invalid action outcome result");
  for (const field of ["metric_before", "metric_after"]) if (input[field] !== null && input[field] !== undefined && typeof input[field] !== "number") throw new Error(`${field} must be number or null`);
  return { id, action_id:input.action_id, app_id:input.app_id ?? null, metric:input.metric ?? null, metric_before:input.metric_before ?? null, metric_after:input.metric_after ?? null, measurement_period:input.measurement_period ?? null, observed_effect:input.observed_effect ?? null, confidence:input.confidence ?? null, result:input.result, notes:input.notes ?? null, created_at:now };
}

export function learningFromOutcome(outcome, { id = crypto.randomUUID(), now = new Date().toISOString(), category = "experiment" } = {}) {
  if (!["positive","neutral","negative"].includes(outcome.result)) return null;
  return { id, app_id:outcome.app_id, category, statement:outcome.observed_effect, evidence:[`action_outcome:${outcome.id}`], source:"action_outcome", confidence:outcome.confidence, created_at:now, last_validated_at:now, status:"active" };
}
