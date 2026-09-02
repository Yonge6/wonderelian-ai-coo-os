#!/usr/bin/env bash
set -euo pipefail

readonly PUBLIC_COMMIT="0ff86e4bf3a3bea9fdbfead4598355978951e142"
readonly ROOT="${OPS_ROOT:-/srv/wonderelian/ops.wonderelian.com}"
readonly RAW_BASE_URL="https://raw.githubusercontent.com/Yonge6/wonderelian-ai-coo-os/${PUBLIC_COMMIT}/public/data"
readonly TEMP_DIR="$(mktemp -d /tmp/ai-coo-ga4-20260901.XXXXXX)"
readonly BACKUP_DIR="/srv/wonderelian/backups/ops-ga4-20260901-$(date +%Y%m%d%H%M%S)"
trap 'find "$TEMP_DIR" -type f -delete 2>/dev/null || true; rmdir "$TEMP_DIR" 2>/dev/null || true' EXIT

for file in state.json brief.json data-health.json; do
  curl --retry 3 --retry-all-errors --connect-timeout 10 --max-time 60 \
    -fsSL "$RAW_BASE_URL/$file" -o "$TEMP_DIR/$file"
done

printf '%s  %s\n' \
  "3f76e879a452644a3437d5cae7261b363c8b37d4cf7e8b91dbcbd54089d9b0d0" "$TEMP_DIR/state.json" \
  "582cbe83743a1e72c1bf437a8c569e787e2ebc0b6c4358df4af1776d4c9a6501" "$TEMP_DIR/brief.json" \
  "ec12318abc64ac5186acb57a3a27ddc5bb20ddac5c4cbdb77efab8f8e287c890" "$TEMP_DIR/data-health.json" \
  | sha256sum -c -

python3 - "$TEMP_DIR" <<'PY'
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
state = json.loads((root / "state.json").read_text(encoding="utf-8"))
brief = json.loads((root / "brief.json").read_text(encoding="utf-8"))
json.loads((root / "data-health.json").read_text(encoding="utf-8"))

latest = next(row for row in brief["daily_portfolio"]["days"] if row["date"] == "2026-09-01")
yixiu = next(row for row in latest["websites"] if row["website_id"] == "site-yixiu")

assert len(state["websites"]) == 7
assert state["metadata"]["data_through"]["website_analytics"] == "2026-09-01"
assert state["metadata"]["data_through"]["app_store"] is None
assert brief["daily_portfolio"]["latest_date"] == "2026-09-01"
assert latest["website_totals"] == {
    "active_users": 33,
    "page_views": 51,
    "sessions": 42,
    "cta_clicks": 34,
}
assert yixiu["metrics"] == {
    "active_users": 25,
    "page_views": 30,
    "sessions": 29,
    "cta_clicks": 1,
}
assert len(state["content"]) == 142
assert all(row.get("first_time_downloads") is None for row in state["content"])
assert all(row.get("trial_starts") is None for row in state["content"])
assert all(row.get("paid_conversions") is None for row in state["content"])
print("JSON_OK date=2026-09-01 websites=7 content=142 yixiu=25/30/29/1 app_store=null")
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

grep -q '"website_analytics": "2026-09-01"' "$ROOT/data/state.json"
grep -q '"latest_date": "2026-09-01"' "$ROOT/data/brief.json"
grep -q '"active_users": 33' "$ROOT/data/brief.json"
echo "DEPLOY_OK_GA4_20260901_0FF86E4"
