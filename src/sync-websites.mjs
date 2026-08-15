import { JsonStore } from "./store.mjs";
import { WebsiteHealthProvider } from "./providers/website-health-provider.mjs";
import { fileURLToPath } from "node:url";

const store = new JsonStore(fileURLToPath(new URL("../data/state.json", import.meta.url)));
const provider = new WebsiteHealthProvider();
const now = new Date().toISOString();
const state = await store.read();
const result = await provider.fetchAll(state.websites, { now });

await store.mutate((next) => {
  const observationIndex = new Map(next.website_observations.map((row, index) => [row.id, index]));
  let inserted = 0;
  let updated = 0;
  for (const observation of result.observations) {
    const index = observationIndex.get(observation.id);
    if (index === undefined) {
      next.website_observations.push(observation);
      inserted += 1;
    } else {
      next.website_observations[index] = observation;
      updated += 1;
    }
  }
  next.website_observations = next.website_observations
    .sort((a, b) => String(b.observed_at).localeCompare(String(a.observed_at)))
    .filter((row, index, rows) => rows.slice(0, index).filter((item) => item.website_id === row.website_id).length < 90);

  for (const website of next.websites) {
    const observation = result.observations.find((row) => row.website_id === website.id);
    website.health_status = observation?.reachable ? "live" : "unavailable";
    website.analytics_status = observation?.analytics_detected ? website.analytics_status === "connected" ? "connected" : "tag_detected" : "not_connected";
    website.last_checked_at = now;
  }

  const healthProvider = next.providers.find((row) => row.id === provider.id);
  const reachable = result.observations.filter((row) => row.reachable).length;
  Object.assign(healthProvider, {
    status:reachable === next.websites.length ? "live" : "partial",
    last_sync:now,
    last_successful_import:now,
    data_through:result.data_through,
    freshness:"fresh",
    error:reachable === next.websites.length ? null : `${reachable}/${next.websites.length} websites reachable.`,
  });

  const healthJob = next.jobs.find((row) => row.id === "job-six-website-health");
  if (healthJob) Object.assign(healthJob, {
    last_run:now,
    next_run:new Date(new Date(now).getTime() + 86_400_000).toISOString(),
    status:"scheduled",
    result:{records_received:result.observations.length, reachable, data_through:result.data_through},
    error:null,
  });

  const syncId = `sync-${provider.id}-${now.replace(/[:.]/g, "-")}`;
  next.provider_syncs.push({
    id:syncId,
    app_id:null,
    provider:provider.id,
    period_start:result.data_through,
    period_end:result.data_through,
    started_at:now,
    completed_at:now,
    status:reachable === next.websites.length ? "succeeded" : "partial",
    records_received:result.observations.length,
    records_inserted:inserted,
    records_updated:updated,
    records_unchanged:0,
    data_through:result.data_through,
    error:null,
  });
  next.audit.unshift({
    id:crypto.randomUUID(),
    at:now,
    actor:process.env.GITHUB_ACTIONS ? "GitHub Actions" : "AI COO OS",
    app_id:null,
    source:process.env.GITHUB_ACTIONS ? "scheduled_website_health" : "authorized_website_operations_expansion",
    action:"sync_six_website_health",
    input:{external_writes:false, websites:next.websites.length},
    result:{reachable, total:next.websites.length, inserted, updated, analytics_tags_detected:result.observations.filter((row) => row.analytics_detected).length, data_through:result.data_through},
    status:reachable === next.websites.length ? "success" : "partial",
    error:null,
  });
  next.metadata.last_website_health_at = now;
  next.metadata.data_through.website_health = result.data_through;
});

console.log(`WEBSITE_SYNC_OK sites=${result.observations.length} reachable=${result.observations.filter((row) => row.reachable).length} analytics_tags=${result.observations.filter((row) => row.analytics_detected).length}`);
