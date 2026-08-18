import { homedir } from "node:os";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";
import { normalizeCodexAutomation, parsePublicAutomationMetadata } from "./providers/codex-automation-provider.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const automationFile = process.env.CODEX_AUTOMATION_FILE
  ?? join(homedir(), ".codex", "automations", "style-atlas-analytics", "automation.toml");
const metadata = parsePublicAutomationMetadata(await readFile(automationFile, "utf8"));
const now = new Date();
const job = normalizeCodexAutomation(metadata, {
  now,
  lastRun: "2026-08-17T12:59:00.000Z",
  result: {
    verified_publications: 4,
    community_replies: 3,
    seo_endpoints_verified: 7,
    attributable_downloads: null,
  },
});

const store = new JsonStore(join(root, "data", "state.json"));
await store.mutate((state) => {
  state.jobs = state.jobs.filter((item) => item.id !== "job-codex-style-atlas-growth");
  const index = state.jobs.findIndex((item) => item.id === job.id);
  if (index === -1) state.jobs.push(job);
  else state.jobs[index] = job;
  state.audit = state.audit.filter((item) => item.id !== "audit-sync-codex-style-atlas-automation-20260818");
  const auditId = "audit-sync-unified-ai-coo-automation-20260818";
  if (!state.audit.some((item) => item.id === auditId)) {
    state.audit.unshift({
      id: auditId,
      at: now.toISOString(),
      actor: "AI COO OS",
      app_id: "style-atlas",
      source: "codex_automation_metadata_and_verified_ops_log",
      action: "sync_unified_codex_automation_registry",
      input: { external_writes: false },
      result: "Registered the single active AI COO heartbeat in the current task: Analytics checks at 03:30, 09:30, 15:30 and 20:30 Beijing, with growth operations only at 20:30; the old task target was removed.",
      status: "success",
      error: null,
    });
  }
  return job;
});

console.log(`CODEX_AUTOMATION_SYNC_OK jobs=1 status=${job.status} schedule=${job.schedule}`);
