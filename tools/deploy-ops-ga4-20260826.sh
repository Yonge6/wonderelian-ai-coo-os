#!/usr/bin/env bash
set -euo pipefail

readonly PUBLIC_COMMIT="ba8b667d715d821303a32e4b8ed92607864a0d98"
readonly ROOT="${OPS_ROOT:-/srv/wonderelian/ops.wonderelian.com}"
readonly RAW_BASE_URL="https://raw.githubusercontent.com/Yonge6/wonderelian-ai-coo-os/${PUBLIC_COMMIT}/public/data"
readonly TEMP_DIR="$(mktemp -d /tmp/ai-coo-ga4-20260826.XXXXXX)"
readonly BACKUP_DIR="/srv/wonderelian/backups/ops-ga4-20260826-$(date +%Y%m%d%H%M%S)"
trap 'rm -rf "$TEMP_DIR"' EXIT

for file in state.json brief.json data-health.json; do
  curl --retry 3 --retry-all-errors --connect-timeout 10 --max-time 60 \
    -fsSL "$RAW_BASE_URL/$file" -o "$TEMP_DIR/$file"
done

printf '%s  %s\n' \
  "3bffe2ecbd76de8baa6a3a1322402112979dc9451a22d6db7d61ffdfaa1a7426" "$TEMP_DIR/state.json" \
  "2407684ae213aa87d2de8b759bb326ccb699838a8fa4c5aafd89558439c0e13a" "$TEMP_DIR/brief.json" \
  "4358b21db9f1f56635c36b3d7e4f076feaa0df0b93308a251f226208055c50d3" "$TEMP_DIR/data-health.json" \
  | sha256sum -c -

python3 - "$TEMP_DIR" <<'PY'
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
state = json.loads((root / "state.json").read_text(encoding="utf-8"))
brief = json.loads((root / "brief.json").read_text(encoding="utf-8"))
json.loads((root / "data-health.json").read_text(encoding="utf-8"))

latest = next(row for row in brief["daily_portfolio"]["days"] if row["date"] == "2026-08-26")
yixiu_content = [
    row for row in state["content"]
    if row.get("app_id") == "yixiu-meditation" and row.get("published_at") == "2026-08-26"
]

assert len(state["websites"]) == 7
assert state["metadata"]["data_through"]["website_analytics"] == "2026-08-26"
assert state["metadata"]["data_through"]["app_store"] is None
assert brief["daily_portfolio"]["latest_date"] == "2026-08-26"
assert latest["website_totals"] == {
    "active_users": 17,
    "page_views": 70,
    "sessions": 22,
    "cta_clicks": 14,
}
assert len(yixiu_content) == 1
assert all(row.get("status") == "published" and row.get("url") for row in yixiu_content)
assert all(row.get("first_time_downloads") is None for row in yixiu_content)
assert len([row for row in state["websites"] if row.get("analytics_status") == "connected"]) == 6
print("JSON_OK date=2026-08-26 websites=7 yixiu_content=1 app_store=null")
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

grep -q '"website_analytics": "2026-08-26"' "$ROOT/data/state.json"
grep -q '"latest_date": "2026-08-26"' "$ROOT/data/brief.json"
grep -q 'yixiu-youtube-mountain-wind-sleep-short-20260826' "$ROOT/data/state.json"
echo "DEPLOY_OK_GA4_20260826_BA8B667"
