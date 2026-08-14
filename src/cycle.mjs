import { generateBrief } from "./domain.mjs";
import { calculateDataHealth } from "./metrics.mjs";
import { createExecution, detectDataRisks, detectMetricChanges, detectionsToInsights, recordActionOutcome, transitionExecution } from "./operations.mjs";
import { runJobsOnce } from "./jobs.mjs";

function upsertById(collection, rows) {
  const index = new Map(collection.map((item, position)=>[item.id,position]));
  for (const row of rows) {
    if (index.has(row.id)) collection[index.get(row.id)] = row;
    else { index.set(row.id, collection.length); collection.push(row); }
  }
}

function audit(state, { id = crypto.randomUUID(), at, action, result, app_id = "style-atlas", input = null, status = "success" }) {
  state.audit.unshift({ id, at, actor:"AI COO OS", app_id, source:"phase_2_operating_cycle", action, input, result, status, error:null });
}

export async function runOperatingCycle(state, { appId = "style-atlas", now = new Date() } = {}) {
  const cycleId = `cycle-${appId}-${now.toISOString().replace(/[:.]/g,"-")}`;
  const stageResults = {};
  const handlers = {
    import_acquisition_metrics: async () => {
      const verified = state.metrics.filter((metric)=>metric.app_id === appId && metric.verified_at && metric.value !== null);
      stageResults.observe = { verified_observations:verified.length, newest_period_end:verified.map((item)=>item.period_end).sort().at(-1) ?? null, new_records:0 };
      return { result:stageResults.observe };
    },
    update_content_performance: async () => {
      const collecting = state.content.filter((item)=>item.app_id === appId && ["collecting","partial"].includes(item.measurement_status)).length;
      return { result:{ collecting, new_verified_results:0 } };
    },
    refresh_customer_feedback: async () => ({ status:"blocked", result:{ imported:0 }, error:"No authenticated review provider or verified feedback snapshot is available." }),
    calculate_anomalies: async () => {
      const changes = detectMetricChanges(state.metrics.filter((metric)=>metric.app_id === appId), { now:now.toISOString() });
      const risks = detectDataRisks(state, { now }).filter((item)=>item.app_id === appId);
      upsertById(state.detections, [...changes, ...risks]);
      stageResults.detect = { material_changes:changes.length, data_risks:risks.length };
      return { result:stageResults.detect };
    },
    generate_insights: async () => {
      const generated = detectionsToInsights(state.detections.filter((item)=>item.app_id === appId), { existingIds:new Set(state.insights.map((item)=>item.id)), now:now.toISOString() });
      state.insights.push(...generated);
      stageResults.decide = { insights_created:generated.length };
      return { result:stageResults.decide };
    },
    refresh_daily_brief: async () => {
      const brief = generateBrief(state);
      state.metadata.last_brief_at = now.toISOString();
      stageResults.brief = { decisions:brief.decisions.length, no_material_change:brief.no_material_change };
      return { result:stageResults.brief };
    },
    evaluate_experiments: async () => {
      let awaiting=0;
      for (const experiment of state.experiments.filter((item)=>item.app_id === appId && item.status === "running")) {
        const contentIds = experiment.content_ids ?? [];
        const values = state.content.filter((item)=>contentIds.includes(item.id)).map((item)=>item.first_time_downloads).filter((value)=>value !== null && value !== undefined);
        if (!values.length) { experiment.current_result=null; experiment.result_status="awaiting_verified_attribution_data"; experiment.confidence=null; awaiting+=1; }
      }
      return { result:{ experiments_awaiting_verified_attribution:awaiting } };
    },
    measure_completed_actions: async () => {
      const outstanding = state.actions.filter((action)=>action.app_id === appId && action.status === "completed" && !state.action_outcomes.some((outcome)=>outcome.action_id === action.id));
      for (const action of outstanding) state.action_outcomes.push(recordActionOutcome({ action_id:action.id, app_id:appId, metric:"first_time_downloads", metric_before:null, metric_after:null, measurement_period:action.measurement_window ?? null, observed_effect:"Awaiting comparable verified attribution data.", confidence:null, result:"inconclusive", notes:"Completion is verified; acquisition effect is not yet measurable." }, { id:`outcome-${action.id}`, now:now.toISOString() }));
      return { result:{ outcomes_opened:outstanding.length } };
    },
  };
  const jobs = await runJobsOnce(state, handlers, { now, force:true });

  const actionId = `action-${cycleId}-health-review`;
  const action = {
    id:actionId, insight_id:"sa-channel-attribution-gap", app_id:appId,
    title:"Refresh Style Atlas data health and attribution readiness",
    title_zh:"刷新 Style Atlas 数据健康与归因准备状态",
    description:"Recalculate provider freshness, missing metrics, and campaign attribution coverage from verified records.",
    rationale:"A read-only data-health review is the highest-value executable operation while no newer verified App Store snapshot exists.",
    expected_impact:"Prevents decisions from treating unavailable campaign outcomes as zero.",
    confidence:1, priority:86, owner:"AI COO OS", risk_level:0, approval_required:false,
    executor:"internal", provider:"internal_data_health", status:"completed",
    created_at:now.toISOString(), updated_at:now.toISOString(), completed_at:now.toISOString(), measurement_window:null,
  };
  if (!state.actions.some((item)=>item.id === actionId)) state.actions.push(action);
  let execution = createExecution(action, { id:`execution-${cycleId}`, now:now.toISOString() });
  execution = transitionExecution(execution, "executing", { now:now.toISOString() });
  const dataHealth = calculateDataHealth(state, { now }).find((item)=>item.app_id === appId);
  execution.execution_log.push({ at:now.toISOString(), event:"calculated_data_health", result:{ coverage_score:dataHealth.coverage_score, missing_critical_metrics:dataHealth.missing_critical_metrics, attribution:dataHealth.attribution } });
  execution = transitionExecution(execution, "completed", { now:now.toISOString(), result:"Data health and attribution readiness refreshed.", output_identifier:`data-health:${appId}:${now.toISOString()}` });
  if (!state.executions.some((item)=>item.id === execution.id)) state.executions.push(execution);
  const internalOutcome = recordActionOutcome({ action_id:actionId, app_id:appId, metric:null, metric_before:null, metric_after:null, measurement_period:null, observed_effect:"Data health was refreshed without changing any external system.", confidence:1, result:"not_measurable", notes:"Level 0 read-only operating action." }, { id:`outcome-${actionId}`, now:now.toISOString() });
  if (!state.action_outcomes.some((item)=>item.id === internalOutcome.id)) state.action_outcomes.push(internalOutcome);

  const brief = generateBrief(state);
  const cycle = {
    id:cycleId, app_id:appId, started_at:now.toISOString(), completed_at:now.toISOString(), status:"completed",
    observed:{ verified_metric_records:state.metrics.filter((item)=>item.app_id === appId && item.verified_at).length },
    detected:{ material_changes:brief.what_changed.length, result:brief.no_material_change ? "No material change detected." : "Material change detected." },
    decided:{ action_id:actionId, decision:"Run a Level 0 data-health and attribution readiness refresh." },
    approved:{ required:false }, executed:{ execution_id:execution.id, status:execution.state },
    measured:{ outcome_id:internalOutcome.id, result:internalOutcome.result }, learned:{ new_learnings:0 },
    job_ids:jobs.map((job)=>job.id),
  };
  state.cycles.push(cycle);
  audit(state, { id:`audit-${cycleId}`, at:now.toISOString(), action:"run_style_atlas_coo_cycle", input:{ verified_sources:["manual_app_store_connect","local_ops_log"], external_writes:false }, result:{ cycle_id:cycleId, material_changes:brief.what_changed.length, action_id:actionId, execution_state:execution.state } });
  return { cycle, brief, data_health:dataHealth, jobs };
}

