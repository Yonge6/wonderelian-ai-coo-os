export const FRESHNESS_STATES = ["live", "fresh", "delayed", "stale", "manual", "unknown", "blocked"];
export const VERIFICATION_TYPES = ["manual_verified", "api_verified", "calculated", "inferred"];

const REQUIRED_PROVENANCE = [
  "app_id", "metric", "period_start", "period_end", "source", "provider",
  "source_reference", "imported_at", "verified_at", "freshness", "confidence", "notes",
];

export function metricName(record) {
  return record.metric ?? record.name;
}

export function normalizeMetricRecord(input, { id = crypto.randomUUID(), now = new Date().toISOString() } = {}) {
  const record = {
    id,
    app_id: input.app_id ?? input.appId,
    metric: input.metric ?? input.name,
    name: input.metric ?? input.name,
    value: input.value ?? null,
    unit: input.unit ?? null,
    period_start: input.period_start ?? input.periodStart,
    period_end: input.period_end ?? input.periodEnd,
    source: input.source,
    provider: input.provider,
    source_reference: input.source_reference ?? input.sourceReference,
    imported_at: input.imported_at ?? input.importedAt ?? now,
    verified_at: input.verified_at ?? input.verifiedAt ?? null,
    freshness: input.freshness ?? "unknown",
    confidence: input.confidence ?? null,
    notes: input.notes ?? null,
    verification_type:input.verification_type ?? (input.verified_at || input.verifiedAt ? "manual_verified" : "inferred"),
  };
  validateMetricRecord(record);
  return record;
}

export function validateMetricRecord(record) {
  for (const field of REQUIRED_PROVENANCE) {
    if (!(field in record)) throw new Error(`Metric provenance field ${field} is required`);
  }
  if (!record.app_id || !record.metric || !record.period_start || !record.period_end) throw new Error("Metric identity and period are required");
  if (!record.source || !record.provider || !record.source_reference) throw new Error("Metric source provenance is required");
  if (record.value !== null && typeof record.value !== "number") throw new Error(`Metric ${record.id ?? record.metric} value must be number or null`);
  if (!FRESHNESS_STATES.includes(record.freshness)) throw new Error(`Invalid metric freshness: ${record.freshness}`);
  if (record.confidence !== null && (typeof record.confidence !== "number" || record.confidence < 0 || record.confidence > 1)) throw new Error("Metric confidence must be null or between 0 and 1");
  if (!VERIFICATION_TYPES.includes(record.verification_type ?? "manual_verified")) throw new Error(`Invalid metric verification type: ${record.verification_type}`);
  return record;
}

export function observationAge(record, now = new Date()) {
  const timestamp = record.verified_at ?? record.imported_at ?? record.period_end;
  const then = new Date(timestamp);
  if (Number.isNaN(then.getTime())) return { age_days: null, age_state: "unknown" };
  const ageDays = Math.max(0, (now.getTime() - then.getTime()) / 86_400_000);
  return { age_days: Math.round(ageDays * 10) / 10, age_state: ageDays <= 2 ? "fresh" : ageDays <= 7 ? "aging" : "stale" };
}

export function latestMetricRecords(metrics) {
  const latest = new Map();
  for (const record of metrics) {
    const key = `${record.app_id}:${metricName(record)}:${record.provider}`;
    const current = latest.get(key);
    if (!current || String(current.period_end) < String(record.period_end)) latest.set(key, record);
  }
  return [...latest.values()];
}

export function calculateAttributionCoverage(state, appId) {
  const published = (state.content ?? []).filter((item) => item.app_id === appId && item.status === "published");
  const linked = published.filter((item) => (item.campaign_id || item.campaign_url) && item.app_store_campaign_url && item.landing_url && (item.publish_url || item.url));
  const measured = linked.filter((item) => item.first_time_downloads !== null && item.first_time_downloads !== undefined);
  return {
    published_assets: published.length,
    linked_assets: linked.length,
    measured_assets: measured.length,
    link_coverage: published.length ? Math.round((linked.length / published.length) * 100) : null,
    outcome_coverage: linked.length ? Math.round((measured.length / linked.length) * 100) : null,
  };
}

export function validateAttributionRecord(record) {
  const required = ["content_id", "campaign_id", "source", "medium", "content", "landing_url", "app_store_campaign_url", "publish_url"];
  for (const field of required) if (!record[field]) throw new Error(`Attribution field ${field} is required`);
  if (record.first_time_downloads !== null && record.first_time_downloads !== undefined && typeof record.first_time_downloads !== "number") throw new Error("Attributed downloads must be number or null");
  return record;
}

function providerRowsForApp(state, appId) {
  const used = new Set(state.metrics.filter((metric) => metric.app_id === appId).map((metric) => metric.provider));
  return (state.providers ?? []).filter((provider) => provider.app_id === appId || provider.app_ids?.includes(appId) || used.has(provider.id));
}

export function calculateDataHealth(state, { now = new Date() } = {}) {
  const latest = latestMetricRecords(state.metrics);
  return state.apps.map((app) => {
    const providers = providerRowsForApp(state, app.id).map((provider) => {
      const records = latest.filter((record) => record.app_id === app.id && record.provider === provider.id);
      const newest = records.sort((a, b) => String(b.verified_at ?? b.imported_at).localeCompare(String(a.verified_at ?? a.imported_at)))[0];
      const age = newest ? observationAge(newest, now) : { age_days: null, age_state: "unknown" };
      const failedJob = (state.jobs ?? []).filter((job) => job.app_id === app.id && job.provider === provider.id && job.status === "failed").sort((a,b)=>String(b.last_run).localeCompare(String(a.last_run)))[0];
      return {
        id: provider.id,
        name: provider.name ?? provider.id,
        status: provider.status,
        mode: provider.mode ?? provider.type,
        last_successful_import: provider.last_successful_import ?? newest?.imported_at ?? provider.last_sync ?? null,
        freshness: newest?.freshness ?? provider.freshness ?? "unknown",
        age_state: age.age_state,
        age_days: age.age_days,
        data_available: provider.data_available ?? [...new Set(records.map(metricName))],
        authentication_required: Boolean(provider.authentication_required),
        error: failedJob?.error ?? provider.error ?? null,
      };
    });
    const critical = app.kpis?.length ? app.kpis : (app.platforms?.includes("iOS") ? ["first_time_downloads"] : []);
    const available = new Set(latest.filter((record) => record.app_id === app.id && record.value !== null).map(metricName));
    const missing = critical.filter((metric) => !available.has(metric));
    const attribution = calculateAttributionCoverage(state, app.id);
    const staleProviders = providers.filter((provider) => provider.age_state === "stale" || provider.status === "stale").map((provider) => provider.id);
    const errors = providers.filter((provider) => provider.error).map((provider) => ({ provider: provider.id, error: provider.error }));
    const scoreParts = [critical.length ? (critical.length - missing.length) / critical.length : null, providers.length ? providers.filter((p)=>!p.error && p.status !== "unavailable").length / providers.length : null, attribution.link_coverage === null ? null : attribution.link_coverage / 100].filter((value)=>value !== null);
    return {
      app_id: app.id,
      providers,
      last_successful_import: providers.map((provider)=>provider.last_successful_import).filter(Boolean).sort().at(-1) ?? null,
      stale_providers: staleProviders,
      missing_critical_metrics: missing,
      import_errors: errors,
      attribution,
      coverage_score: scoreParts.length ? Math.round((scoreParts.reduce((sum,value)=>sum+value,0)/scoreParts.length)*100) : 0,
      confidence_cap: missing.length || staleProviders.length || errors.length ? 0.65 : 0.95,
    };
  });
}
