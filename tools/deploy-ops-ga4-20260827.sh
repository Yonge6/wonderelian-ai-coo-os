#!/usr/bin/env bash
set -euo pipefail

readonly PUBLIC_COMMIT="ce30477fc0d8010a5a0f31f39b474a073880b0ff"
readonly ROOT="${OPS_ROOT:-/srv/wonderelian/ops.wonderelian.com}"
readonly RAW_BASE_URL="https://raw.githubusercontent.com/Yonge6/wonderelian-ai-coo-os/${PUBLIC_COMMIT}/public/data"
readonly TEMP_DIR="$(mktemp -d /tmp/ai-coo-ga4-20260827.XXXXXX)"
readonly BACKUP_DIR="/srv/wonderelian/backups/ops-ga4-20260827-$(date +%Y%m%d%H%M%S)"
trap 'find "$TEMP_DIR" -type f -delete 2>/dev/null || true; rmdir "$TEMP_DIR" 2>/dev/null || true' EXIT

for file in state.json brief.json data-health.json; do
  curl --retry 3 --retry-all-errors --connect-timeout 10 --max-time 60 \
    -fsSL "$RAW_BASE_URL/$file" -o "$TEMP_DIR/$file"
done

printf '%s  %s\n' \
  "39660bbdd7ba0357912b163e781b6e77f0182e41e976d0a872e286ed62b453ab" "$TEMP_DIR/state.json" \
  "780b132985ca00faa5259fe367b976dc8434bbc757c627e34de307fa5bd3240c" "$TEMP_DIR/brief.json" \
  "33a64e4c2d0d180bf81ad116d9f14bc6f3463046932d8b8ead4ac3e2521e1bba" "$TEMP_DIR/data-health.json" \
  | sha256sum -c -

python3 - "$TEMP_DIR" <<'PY'
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
state = json.loads((root / "state.json").read_text(encoding="utf-8"))
brief = json.loads((root / "brief.json").read_text(encoding="utf-8"))
json.loads((root / "data-health.json").read_text(encoding="utf-8"))

latest = next(row for row in brief["daily_portfolio"]["days"] if row["date"] == "2026-08-27")
yixiu_content = [
    row for row in state["content"]
    if row.get("app_id") == "yixiu-meditation" and row.get("published_at") == "2026-08-27"
]

assert len(state["websites"]) == 7
assert state["metadata"]["data_through"]["website_analytics"] == "2026-08-27"
assert state["metadata"]["data_through"]["app_store"] is None
assert brief["daily_portfolio"]["latest_date"] == "2026-08-27"
assert latest["website_totals"] == {
    "active_users": 35,
    "page_views": 89,
    "sessions": 50,
    "cta_clicks": 28,
}
assert len(yixiu_content) == 0
assert len([row for row in state["websites"] if row.get("analytics_status") == "connected"]) == 6
assert any(
    row.get("id") == "audit-ops-log-sync-20260827" and row.get("status") == "success"
    for row in state["audit"]
)
print("JSON_OK date=2026-08-27 websites=7 yixiu_content=0 app_store=null")
PY

mkdir -p "$BACKUP_DIR/data"
cp -a "$ROOT/data/state.json" "$BACKUP_DIR/data/state.json"
cp -a "$ROOT/data/brief.json" "$BACKUP_DIR/data/brief.json"
cp -a "$ROOT/data/data-health.json" "$BACKUP_DIR/data/data-health.json"
cp "$TEMP_DIR/state.json" "$ROOT/data/state.json"
cp "$TEMP_DIR/brief.json" "$ROOT/data/brief.json"
cp "$TEMP_DIR/data-health.json" "$ROOT/data/data-health.json"
chmod 0644 "$ROOT/data/state.json" "$ROOT/data/brief.json" "$ROOT/data/data-health.json"

if ! nginx -t; then
  cp -a "$BACKUP_DIR/data/state.json" "$ROOT/data/state.json"
  cp -a "$BACKUP_DIR/data/brief.json" "$ROOT/data/brief.json"
  cp -a "$BACKUP_DIR/data/data-health.json" "$ROOT/data/data-health.json"
  nginx -t
  echo "ROLLED_BACK"
  exit 1
fi

grep -q '"website_analytics": "2026-08-27"' "$ROOT/data/state.json"
grep -q '"latest_date": "2026-08-27"' "$ROOT/data/brief.json"
grep -q '"active_users": 35' "$ROOT/data/brief.json"
echo "DEPLOY_OK_GA4_20260827_CE30477"
