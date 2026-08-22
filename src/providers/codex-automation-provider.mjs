const PUBLIC_FIELDS = new Set(["id", "kind", "name", "status", "rrule"]);

function unquote(value) {
  const trimmed = value.trim();
  if (!trimmed.startsWith('"') || !trimmed.endsWith('"')) return trimmed;
  return JSON.parse(trimmed);
}

export function parsePublicAutomationMetadata(text) {
  const metadata = {};
  for (const line of String(text).split(/\r?\n/)) {
    const match = line.match(/^([a-z_]+)\s*=\s*(.+)$/i);
    if (!match || !PUBLIC_FIELDS.has(match[1])) continue;
    metadata[match[1]] = unquote(match[2]);
  }
  return metadata;
}

export function dailyScheduleFromRrule(rrule, timeZone = "Asia/Shanghai") {
  const fields = Object.fromEntries(String(rrule).split(";").map((part) => part.split("=", 2)));
  const everyDay = fields.FREQ === "WEEKLY" && fields.BYDAY === "MO,TU,WE,TH,FR,SA,SU";
  const hours = String(fields.BYHOUR ?? "").split(",").map(Number);
  const minute = Number(fields.BYMINUTE);
  if (!everyDay || !hours.length || hours.some((hour) => !Number.isInteger(hour)) || !Number.isInteger(minute)) return null;
  const times = hours.map((hour) => `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
  return `daily:${times.join(",")}:${timeZone}`;
}

export function nextShanghaiDailyRun(schedule, now = new Date()) {
  const match = String(schedule).match(/^daily:((?:\d{2}:\d{2})(?:,\d{2}:\d{2})*):Asia\/Shanghai$/);
  if (!match) return null;
  const shanghaiNow = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  const candidates = match[1].split(",").map((time) => {
    const [hour, minute] = time.split(":").map(Number);
    let candidate = Date.UTC(
      shanghaiNow.getUTCFullYear(),
      shanghaiNow.getUTCMonth(),
      shanghaiNow.getUTCDate(),
      hour - 8,
      minute,
    );
    if (candidate <= now.getTime()) candidate += 24 * 60 * 60 * 1000;
    return candidate;
  });
  return new Date(Math.min(...candidates)).toISOString();
}

export function normalizeCodexAutomation(metadata, options = {}) {
  if (metadata.id !== "style-atlas-analytics") throw new Error("Only the approved unified AI COO automation may be synchronized");
  if (metadata.kind !== "heartbeat") throw new Error("Unsupported Codex automation kind");
  const schedule = dailyScheduleFromRrule(metadata.rrule);
  if (!schedule) throw new Error("Unsupported Codex automation schedule");
  const enabled = String(metadata.status).toUpperCase() === "ACTIVE";
  return {
    id: "job-codex-ai-coo-unified",
    type: "run_codex_ai_coo_automation",
    provider: "codex_automation",
    app_id: "yixiu-meditation",
    name: "WonderElian AI COO Yixiu Growth and Analytics Monitoring",
    name_zh: metadata.name,
    schedule,
    last_run: options.lastRun ?? null,
    next_run: enabled ? nextShanghaiDailyRun(schedule, options.now ?? new Date()) : null,
    status: enabled ? "scheduled" : "cancelled",
    duration: null,
    result: options.result ?? null,
    error: null,
    retry_count: 0,
    verification_type: "local_metadata_verified",
  };
}
