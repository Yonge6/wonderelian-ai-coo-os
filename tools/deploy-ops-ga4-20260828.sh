#!/usr/bin/env bash
set -euo pipefail

readonly PUBLIC_COMMIT="36060de8d469f276a2010f85710533cbd9b7c785"
readonly ROOT="${OPS_ROOT:-/srv/wonderelian/ops.wonderelian.com}"
readonly RAW_BASE_URL="https://raw.githubusercontent.com/Yonge6/wonderelian-ai-coo-os/${PUBLIC_COMMIT}/public/data"
readonly TEMP_DIR="$(mktemp -d /tmp/ai-coo-ga4-20260828.XXXXXX)"
readonly BACKUP_DIR="/srv/wonderelian/backups/ops-ga4-20260828-$(date +%Y%m%d%H%M%S)"
trap 'find "$TEMP_DIR" -type f -delete 2>/dev/null || true; rmdir "$TEMP_DIR" 2>/dev/null || true' EXIT

for file in state.json brief.json data-health.json; do
  curl --retry 3 --retry-all-errors --connect-timeout 10 --max-time 60 \
    -fsSL "$RAW_BASE_URL/$file" -o "$TEMP_DIR/$file"
done

printf '%s  %s\n' \
  "9d812d909f1f7dea6685bbf687380cd7a268e0e931d02f22c96193c576444881" "$TEMP_DIR/state.json" \
  "abb6081a2e9a9010d64d1e66d16ee6cdf25ebb1ea19418eeccf96e641ddb079c" "$TEMP_DIR/brief.json" \
  "ff8d329c6adf761d1fd35e5c041235ea86df61240ed124c44ee92ed096ba5cbb" "$TEMP_DIR/data-health.json" \
  | sha256sum -c -

python3 - "$TEMP_DIR" <<'PY'
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
state = json.loads((root / "state.json").read_text(encoding="utf-8"))
brief = json.loads((root / "brief.json").read_text(encoding="utf-8"))
json.loads((root / "data-health.json").read_text(encoding="utf-8"))

latest = next(row for row in brief["daily_portfolio"]["days"] if row["date"] == "2026-08-28")
yixiu_content = [
    row for row in state["content"]
    if row.get("app_id") == "yixiu-meditation" and row.get("published_at") == "2026-08-28"
]
expected_urls = {
    "https://www.instagram.com/wonderelian/p/DclicEam6q-/",
    "https://www.pinterest.com/pin/1147643917690317384/",
}

assert len(state["websites"]) == 7
assert state["metadata"]["data_through"]["website_analytics"] == "2026-08-28"
assert state["metadata"]["data_through"]["app_store"] is None
assert brief["daily_portfolio"]["latest_date"] == "2026-08-28"
assert latest["website_totals"] == {
    "active_users": 41,
    "page_views": 77,
    "sessions": 60,
    "cta_clicks": 21,
}
assert len(yixiu_content) == 2
assert {row["publish_url"] for row in yixiu_content} == expected_urls
assert all(row.get("first_time_downloads") is None for row in yixiu_content)
assert all(row.get("trial_starts") is None for row in yixiu_content)
assert all(row.get("paid_conversions") is None for row in yixiu_content)
assert len([row for row in state["websites"] if row.get("analytics_status") == "connected"]) == 6
assert any(
    row.get("id") == "audit-yixiu-content-ledger-20260828" and row.get("status") == "success"
    for row in state["audit"]
)
print("JSON_OK date=2026-08-28 websites=7 yixiu_content=2 app_store=null")
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

grep -q '"website_analytics": "2026-08-28"' "$ROOT/data/state.json"
grep -q '"latest_date": "2026-08-28"' "$ROOT/data/brief.json"
grep -q '"active_users": 41' "$ROOT/data/brief.json"
echo "DEPLOY_OK_GA4_20260828_36060DE"
