export const JOB_STATUSES = ["scheduled", "running", "succeeded", "failed", "blocked", "cancelled"];

export function nextRunFor(job, now = new Date()) {
  if (job.schedule === "manual") return null;
  const match = String(job.schedule).match(/^every:(\d+)(m|h|d)$/);
  if (!match) return null;
  const multiplier = { m:60_000, h:3_600_000, d:86_400_000 }[match[2]];
  return new Date(now.getTime() + Number(match[1]) * multiplier).toISOString();
}

export function isJobDue(job, now = new Date()) {
  if (job.status === "cancelled" || job.schedule === "manual") return false;
  return !job.next_run || new Date(job.next_run).getTime() <= now.getTime();
}

export async function runJob(job, handler, { now = new Date(), force = false } = {}) {
  if (!force && !isJobDue(job, now)) return { ...job };
  const started = Date.now();
  const running = { ...job, status:"running", last_run:now.toISOString(), error:null };
  try {
    const result = await handler(running);
    return { ...running, status:result?.status === "blocked" ? "blocked" : "succeeded", duration:Date.now()-started, result:result?.result ?? result ?? null, error:result?.error ?? null, retry_count:result?.status === "blocked" ? (job.retry_count ?? 0) : 0, next_run:nextRunFor(job, now) };
  } catch (error) {
    return { ...running, status:"failed", duration:Date.now()-started, result:null, error:error.message, retry_count:(job.retry_count ?? 0)+1, next_run:nextRunFor(job, now) };
  }
}

export async function runJobsOnce(state, handlers, { now = new Date(), force = false, jobIds = null } = {}) {
  const selected = jobIds ? new Set(jobIds) : null;
  const results = [];
  for (let index=0; index<state.jobs.length; index+=1) {
    const job = state.jobs[index];
    if (selected && !selected.has(job.id)) continue;
    const handler = handlers[job.type];
    if (!handler) continue;
    const updated = await runJob(job, handler, { now, force });
    state.jobs[index] = updated;
    if (updated.last_run === now.toISOString()) results.push(updated);
  }
  return results;
}

