#!/usr/bin/env bash
set -euo pipefail

readonly PUBLIC_COMMIT="cbd860c5db8c16d9c81511270d1be457a31c33bd"
readonly ROOT="${OPS_ROOT:-/srv/wonderelian/ops.wonderelian.com}"
readonly RAW_BASE_URL="https://raw.githubusercontent.com/Yonge6/wonderelian-ai-coo-os/${PUBLIC_COMMIT}/public/data"
readonly TEMP_DIR="$(mktemp -d /tmp/ai-coo-ga4-20260909.XXXXXX)"
readonly BACKUP_DIR="/srv/wonderelian/backups/ops-ga4-20260909-$(date +%Y%m%d%H%M%S)"
trap 'find "$TEMP_DIR" -type f -delete 2>/dev/null || true; rmdir "$TEMP_DIR" 2>/dev/null || true' EXIT

for file in state.json brief.json data-health.json; do
  curl --retry 3 --retry-all-errors --connect-timeout 10 --max-time 60 \
    -fsSL "$RAW_BASE_URL/$file" -o "$TEMP_DIR/$file"
done

printf '%s  %s\n' \
  "292b727c4b30f99fec073d7a85408c34522a0843dc17bf8b5c152fc4a9f14285" "$TEMP_DIR/state.json" \
  "371187570a02214f9addba582b4eb9ae8a091aec4bbacc5788139c56782e2979" "$TEMP_DIR/brief.json" \
  "d53db278bfb175582e5493ffe1ad5a8d1958225594433b31e58b5b3930fcf7d4" "$TEMP_DIR/data-health.json" \
  | sha256sum -c -

python3 - "$TEMP_DIR" <<'PY'
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
state = json.loads((root / "state.json").read_text(encoding="utf-8"))
brief = json.loads((root / "brief.json").read_text(encoding="utf-8"))
json.loads((root / "data-health.json").read_text(encoding="utf-8"))

latest = next(row for row in brief["daily_portfolio"]["days"] if row["date"] == "2026-09-09")
style_atlas = next(row for row in latest["websites"] if row["website_id"] == "site-style-atlas")
yixiu = next(row for row in latest["websites"] if row["website_id"] == "site-yixiu")
human_design = next(row for row in latest["websites"] if row["website_id"] == "site-human-design")
wendao = next(row for row in latest["websites"] if row["website_id"] == "site-wendao")
maker = next(row for row in latest["websites"] if row["website_id"] == "site-maker-business-lab")
app = next(row for row in state["apps"] if row["id"] == "yixiu-meditation")
automation = next(row for row in state["jobs"] if row["id"] == "job-codex-ai-coo-unified")

assert len(state["websites"]) == 7
assert state["metadata"]["data_through"]["website_analytics"] == "2026-09-09"
assert state["metadata"]["data_through"]["app_store"] is None
assert brief["daily_portfolio"]["latest_date"] == "2026-09-09"
assert latest["website_totals"] == {
    "active_users": 25,
    "page_views": 38,
    "sessions": 27,
    "cta_clicks": 21,
}
assert style_atlas["metrics"] == {
    "active_users": 1,
    "page_views": 1,
    "sessions": 1,
    "cta_clicks": None,
}
assert yixiu["metrics"] == {
    "active_users": 9,
    "page_views": 12,
    "sessions": 9,
    "cta_clicks": None,
}
assert human_design["metrics"] == {
    "active_users": None,
    "page_views": None,
    "sessions": None,
    "cta_clicks": None,
}
assert wendao["metrics"] == {
    "active_users": 10,
    "page_views": 17,
    "sessions": 10,
    "cta_clicks": 15,
}
assert maker["metrics"] == {
    "active_users": 1,
    "page_views": 2,
    "sessions": 2,
    "cta_clicks": None,
}
assert app["app_store_version"] == "1.10"
assert automation["schedule"] == "daily:08:30,20:30:Asia/Shanghai"
assert len(state["content"]) == 145
assert all(row.get("first_time_downloads") is None for row in state["content"])
assert all(row.get("trial_starts") is None for row in state["content"])
assert all(row.get("paid_conversions") is None for row in state["content"])
print("JSON_OK date=2026-09-09 websites=7 content=145 yixiu=9/12/9/null maker=1/2/2/null app_store=null")
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

grep -q '"website_analytics": "2026-09-09"' "$ROOT/data/state.json"
grep -q '"latest_date": "2026-09-09"' "$ROOT/data/brief.json"
grep -q '"active_users": 25' "$ROOT/data/brief.json"
echo "DEPLOY_OK_GA4_20260909_CBD860C"
