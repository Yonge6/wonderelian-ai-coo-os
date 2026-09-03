#!/usr/bin/env bash
set -euo pipefail

readonly PUBLIC_COMMIT="368e999103d69c3999a229a13a91b58d304ede76"
readonly ROOT="${OPS_ROOT:-/srv/wonderelian/ops.wonderelian.com}"
readonly RAW_BASE_URL="https://raw.githubusercontent.com/Yonge6/wonderelian-ai-coo-os/${PUBLIC_COMMIT}/public/data"
readonly TEMP_DIR="$(mktemp -d /tmp/ai-coo-ga4-20260902.XXXXXX)"
readonly BACKUP_DIR="/srv/wonderelian/backups/ops-ga4-20260902-$(date +%Y%m%d%H%M%S)"
trap 'find "$TEMP_DIR" -type f -delete 2>/dev/null || true; rmdir "$TEMP_DIR" 2>/dev/null || true' EXIT

for file in state.json brief.json data-health.json; do
  curl --retry 3 --retry-all-errors --connect-timeout 10 --max-time 60 \
    -fsSL "$RAW_BASE_URL/$file" -o "$TEMP_DIR/$file"
done

printf '%s  %s\n' \
  "5b88a943af18f85d6eb53388af64f2b12fad52748d7a32ac5e58b9bf150ba872" "$TEMP_DIR/state.json" \
  "8431422b34eac6cea33703ab20903adc482633338af6eabdedff281ec3a332a7" "$TEMP_DIR/brief.json" \
  "49a947dacab5d7e545927a4f4ccbdce7b4103ff7a5d9c12c846e8b59f3d34691" "$TEMP_DIR/data-health.json" \
  | sha256sum -c -

python3 - "$TEMP_DIR" <<'PY'
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
state = json.loads((root / "state.json").read_text(encoding="utf-8"))
brief = json.loads((root / "brief.json").read_text(encoding="utf-8"))
json.loads((root / "data-health.json").read_text(encoding="utf-8"))

latest = next(row for row in brief["daily_portfolio"]["days"] if row["date"] == "2026-09-02")
yixiu = next(row for row in latest["websites"] if row["website_id"] == "site-yixiu")

assert len(state["websites"]) == 7
assert state["metadata"]["data_through"]["website_analytics"] == "2026-09-02"
assert state["metadata"]["data_through"]["app_store"] is None
assert brief["daily_portfolio"]["latest_date"] == "2026-09-02"
assert latest["website_totals"] == {
    "active_users": 45,
    "page_views": 58,
    "sessions": 49,
    "cta_clicks": 1,
}
assert yixiu["metrics"] == {
    "active_users": 40,
    "page_views": 48,
    "sessions": 43,
    "cta_clicks": None,
}
assert len(state["content"]) == 142
assert all(row.get("first_time_downloads") is None for row in state["content"])
assert all(row.get("trial_starts") is None for row in state["content"])
assert all(row.get("paid_conversions") is None for row in state["content"])
print("JSON_OK date=2026-09-02 websites=7 content=142 yixiu=40/48/43/null app_store=null")
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

grep -q '"website_analytics": "2026-09-02"' "$ROOT/data/state.json"
grep -q '"latest_date": "2026-09-02"' "$ROOT/data/brief.json"
grep -q '"active_users": 45' "$ROOT/data/brief.json"
echo "DEPLOY_OK_GA4_20260902_368E999"
