export class ProviderUnavailableError extends Error {
  constructor(provider, message, { code = "PROVIDER_UNAVAILABLE", retryable = false } = {}) {
    super(`${provider} unavailable: ${message}`);
    this.name = "ProviderUnavailableError";
    this.provider = provider;
    this.code = code;
    this.retryable = retryable;
  }
}

export class ProviderAuthRequiredError extends ProviderUnavailableError {
  constructor(provider, missing = []) {
    super(provider, "BLOCKED — AUTH REQUIRED", { code:"AUTH_REQUIRED", retryable:false });
    this.name = "ProviderAuthRequiredError";
    this.missing = missing;
  }
}

export function normalizeMetric({ appId, name, value, unit, periodStart, periodEnd, provider, provenance }) {
  const source = typeof provenance === "object" ? provenance.source : provenance;
  return normalizeMetricRecord({
    app_id:appId, metric:name, value, unit, period_start:periodStart, period_end:periodEnd,
    source:source ?? provider, provider,
    source_reference:typeof provenance === "object" ? provenance.source_reference : String(provenance ?? provider),
    imported_at:typeof provenance === "object" ? provenance.imported_at : undefined,
    verified_at:typeof provenance === "object" ? provenance.verified_at : null,
    freshness:typeof provenance === "object" ? provenance.freshness : "unknown",
    confidence:typeof provenance === "object" ? provenance.confidence : null,
    notes:typeof provenance === "object" ? provenance.notes : null,
  });
}

export class MetricProvider {
  constructor({ id, capabilities = [] }) { this.id=id; this.capabilities=capabilities; }
  async health() { throw new Error("Provider must implement health()"); }
  async fetchMetrics() { throw new Error("Provider must implement fetchMetrics()"); }
  async fetchContent() { return []; }
  async fetchFeedback() { return []; }
}

export function providerStatus(provider, health = {}) {
  return {
    provider:provider.id, status:health.status ?? "unknown", capabilities:provider.capabilities ?? [],
    authentication_required:Boolean(health.authentication_required), error:health.error ?? null,
    checked_at:new Date().toISOString(),
  };
}
import { normalizeMetricRecord } from "../metrics.mjs";
