const PRIVATE_KEYS = /^(asset_path|password|passwd|secret|token|access_token|refresh_token|cookie|cookies|authorization|auth_header|oauth|credentials|credential|private_id|approval_id|session|session_data|execution_log|config|approvals|operating_memory|ingestion_runs)$/i;
const SENSITIVE_PATTERNS = [
  { name:"local absolute path", pattern:/(?:\/Users\/|\/home\/|[A-Za-z]:\\Users\\)/ },
  { name:"email address", pattern:/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i },
  { name:"authorization header", pattern:/\b(?:authorization|bearer)\s*[:= ]\s*[A-Za-z0-9._~+\/-]{8,}/i },
  { name:"secret assignment", pattern:/\b(?:password|passwd|api[_-]?key|secret|access[_-]?token|refresh[_-]?token|cookie)\b\s*[:=]\s*["']?[^\s,"'}]{6,}/i },
  { name:"private key", pattern:/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
];

export function sanitizePublicData(value) {
  if (Array.isArray(value)) return value.map(sanitizePublicData);
  if (!value || typeof value !== "object") {
    if (typeof value === "string" && SENSITIVE_PATTERNS.some(({pattern})=>pattern.test(value))) return "[redacted]";
    return value;
  }
  return Object.fromEntries(Object.entries(value).flatMap(([key, item]) => PRIVATE_KEYS.test(key) ? [] : [[key, sanitizePublicData(item)]]));
}

export function assertPublicDataSafe(value) {
  const raw = typeof value === "string" ? value : JSON.stringify(value);
  const hit = SENSITIVE_PATTERNS.find(({pattern})=>pattern.test(raw));
  if (hit) throw new Error(`Public build contains sensitive pattern: ${hit.name}`);
  return true;
}
