#!/usr/bin/env bash
set -euo pipefail

readonly PUBLIC_COMMIT="607d8e6677eac71be04a57565ed7f0377cc1b702"
readonly ROOT="${OPS_ROOT:-/srv/wonderelian/ops.wonderelian.com}"
readonly RAW_BASE_URL="https://raw.githubusercontent.com/Yonge6/wonderelian-ai-coo-os/${PUBLIC_COMMIT}/public/data"
readonly TEMP_DIR="$(mktemp -d /tmp/ai-coo-ga4-20260824.XXXXXX)"
readonly BACKUP_DIR="/srv/wonderelian/backups/ops-ga4-20260824-$(date +%Y%m%d%H%M%S)"
trap 'rm -rf "$TEMP_DIR"' EXIT

for file in state.json brief.json data-health.json; do
  curl --retry 3 --retry-all-errors --connect-timeout 10 --max-time 60 \
    -fsSL "$RAW_BASE_URL/$file" -o "$TEMP_DIR/$file"
done

printf '%s  %s\n' \
  "7ad6d504e1ba8015fcb686c81aba933999dcb48fae6ce65e2b8a8b6188a63b30" "$TEMP_DIR/state.json" \
  "76c62f05ba48c6a65b97b57333fcd4fb99900c57b0430292ca531a8dfd8110c3" "$TEMP_DIR/brief.json" \
  "c6ab1076f30c3588aa76896c14c0ff59513dcd5ad5e59a0623b1bc8047bee89d" "$TEMP_DIR/data-health.json" \
  | sha256sum -c -

python3 - "$TEMP_DIR" <<'PY'
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
state = json.loads((root / "state.json").read_text(encoding="utf-8"))
brief = json.loads((root / "brief.json").read_text(encoding="utf-8"))
json.loads((root / "data-health.json").read_text(encoding="utf-8"))

latest = next(row for row in brief["daily_portfolio"]["days"] if row["date"] == "2026-08-24")
yixiu_content = [
    row for row in state["content"]
    if row.get("app_id") == "yixiu-meditation" and row.get("published_at") == "2026-08-24"
]

assert len(state["websites"]) == 7
assert state["metadata"]["data_through"]["website_analytics"] == "2026-08-24"
assert state["metadata"]["data_through"]["app_store"] is None
assert brief["daily_portfolio"]["latest_date"] == "2026-08-24"
assert latest["website_totals"] == {
    "active_users": 36,
    "page_views": 101,
    "sessions": 52,
    "cta_clicks": 8,
}
assert len(yixiu_content) == 19
assert all(row.get("status") == "published" and row.get("url") for row in yixiu_content)
assert all(row.get("first_time_downloads") is None for row in yixiu_content)
assert len([row for row in state["websites"] if row.get("analytics_status") == "connected"]) == 6
print("JSON_OK date=2026-08-24 websites=7 yixiu_content=19 app_store=null")
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

grep -q '"website_analytics": "2026-08-24"' "$ROOT/data/state.json"
grep -q '"latest_date": "2026-08-24"' "$ROOT/data/brief.json"
grep -q 'yixiu-youtube-rain-sleep-long-20260824' "$ROOT/data/state.json"
echo "DEPLOY_OK_GA4_20260824_607D8E6"
