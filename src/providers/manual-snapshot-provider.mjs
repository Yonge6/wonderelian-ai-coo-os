import { normalizeMetricRecord } from "../metrics.mjs";

export class ManualSnapshotProvider {
  id = "manual_verified_snapshot";
  capabilities = ["acquisition", "revenue", "content_performance", "feedback"];

  async health() {
    return { status:"available", mode:"manual", authentication_required:false };
  }

  importMetrics(snapshot, { now = new Date().toISOString() } = {}) {
    if (!snapshot.verified_at) throw new Error("Manual snapshot requires verified_at");
    return snapshot.metrics.map((item)=>normalizeMetricRecord({
      ...item, app_id:snapshot.app_id, source:snapshot.source, provider:snapshot.provider ?? this.id,
      source_reference:snapshot.source_reference, imported_at:now, verified_at:snapshot.verified_at,
      freshness:"manual", confidence:item.confidence ?? snapshot.confidence ?? 1,
      notes:item.notes ?? snapshot.notes ?? null,
    }, { now }));
  }

  importFeedback(snapshot, { now = new Date().toISOString() } = {}) {
    if (!snapshot.verified_at || !snapshot.source_reference) throw new Error("Verified feedback snapshot requires provenance");
    return snapshot.items.map((item)=>({
      ...item, id:item.id ?? crypto.randomUUID(), app_id:snapshot.app_id, provider:snapshot.provider ?? this.id,
      source_reference:snapshot.source_reference, verified_at:snapshot.verified_at, imported_at:now,
    }));
  }
}
