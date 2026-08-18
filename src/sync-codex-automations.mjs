import { homedir } from "node:os";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";
import { normalizeCodexAutomation, parsePublicAutomationMetadata } from "./providers/codex-automation-provider.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const automationFile = process.env.CODEX_AUTOMATION_FILE
  ?? join(homedir(), ".codex", "automations", "style-atlas", "automation.toml");
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
  const index = state.jobs.findIndex((item) => item.id === job.id);
  if (index === -1) state.jobs.push(job);
  else state.jobs[index] = job;
  const auditId = "audit-sync-codex-style-atlas-automation-20260818";
  if (!state.audit.some((item) => item.id === auditId)) {
    state.audit.unshift({
      id: auditId,
      at: now.toISOString(),
      actor: "AI COO OS",
      app_id: "style-atlas",
      source: "codex_automation_metadata_and_verified_ops_log",
      action: "sync_codex_automation_registry",
      input: { external_writes: false },
      result: "Registered the active daily 20:30 Beijing Style Atlas growth task; latest verified run recorded 4 public posts, 3 community replies, 7 SEO endpoints, and no verified attributable-download outcome.",
      status: "success",
      error: null,
    });
  }
  return job;
});

console.log(`CODEX_AUTOMATION_SYNC_OK jobs=1 status=${job.status} schedule=${job.schedule}`);
