export class ProviderUnavailableError extends Error {
  constructor(provider, message) {
    super(`${provider} unavailable: ${message}`);
    this.name = "ProviderUnavailableError";
  }
}

export function normalizeMetric({ appId, name, value, unit, periodStart, periodEnd, provider, provenance }) {
  return {
    id: crypto.randomUUID(), app_id: appId, name, value: value ?? null, unit,
    period_start: periodStart, period_end: periodEnd, provider, provenance,
    collected_at: new Date().toISOString(),
  };
}
