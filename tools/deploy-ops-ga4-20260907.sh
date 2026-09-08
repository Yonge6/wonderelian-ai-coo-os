#!/usr/bin/env bash
set -euo pipefail

readonly PUBLIC_COMMIT="607af8d8729bac9b68acded4c1aef99aad5453cf"
readonly ROOT="${OPS_ROOT:-/srv/wonderelian/ops.wonderelian.com}"
readonly RAW_BASE_URL="https://raw.githubusercontent.com/Yonge6/wonderelian-ai-coo-os/${PUBLIC_COMMIT}/public/data"
readonly TEMP_DIR="$(mktemp -d /tmp/ai-coo-ga4-20260907.XXXXXX)"
readonly BACKUP_DIR="/srv/wonderelian/backups/ops-ga4-20260907-$(date +%Y%m%d%H%M%S)"
trap 'find "$TEMP_DIR" -type f -delete 2>/dev/null || true; rmdir "$TEMP_DIR" 2>/dev/null || true' EXIT

for file in state.json brief.json data-health.json; do
  curl --retry 3 --retry-all-errors --connect-timeout 10 --max-time 60 \
    -fsSL "$RAW_BASE_URL/$file" -o "$TEMP_DIR/$file"
done

printf '%s  %s\n' \
  "d1aa1d45b10480afddc91e5c235dae97c8cbeacb7c7339a764cd54061b2b7c9b" "$TEMP_DIR/state.json" \
  "abdd2cfcf7740108498f62436390c2748a57fbd1cba3def73916dad1abc1be7f" "$TEMP_DIR/brief.json" \
  "a84c76650c8049f91d5005983488836dd497b5d3451d431e137c0f777b750ca5" "$TEMP_DIR/data-health.json" \
  | sha256sum -c -

python3 - "$TEMP_DIR" <<'PY'
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
state = json.loads((root / "state.json").read_text(encoding="utf-8"))
brief = json.loads((root / "brief.json").read_text(encoding="utf-8"))
json.loads((root / "data-health.json").read_text(encoding="utf-8"))

latest = next(row for row in brief["daily_portfolio"]["days"] if row["date"] == "2026-09-07")
style_atlas = next(row for row in latest["websites"] if row["website_id"] == "site-style-atlas")
yixiu = next(row for row in latest["websites"] if row["website_id"] == "site-yixiu")
human_design = next(row for row in latest["websites"] if row["website_id"] == "site-human-design")
maker = next(row for row in latest["websites"] if row["website_id"] == "site-maker-business-lab")
app = next(row for row in state["apps"] if row["id"] == "yixiu-meditation")
automation = next(row for row in state["jobs"] if row["id"] == "job-codex-ai-coo-unified")

assert len(state["websites"]) == 7
assert state["metadata"]["data_through"]["website_analytics"] == "2026-09-07"
assert state["metadata"]["data_through"]["app_store"] is None
assert brief["daily_portfolio"]["latest_date"] == "2026-09-07"
assert latest["website_totals"] == {
    "active_users": 22,
    "page_views": 40,
    "sessions": 31,
    "cta_clicks": 7,
}
assert style_atlas["metrics"] == {
    "active_users": None,
    "page_views": None,
    "sessions": None,
    "cta_clicks": None,
}
assert yixiu["metrics"] == {
    "active_users": 15,
    "page_views": 24,
    "sessions": 18,
    "cta_clicks": 4,
}
assert human_design["metrics"] == {
    "active_users": None,
    "page_views": None,
    "sessions": None,
    "cta_clicks": None,
}
assert maker["metrics"] == {
    "active_users": 1,
    "page_views": 4,
    "sessions": 1,
    "cta_clicks": None,
}
assert app["app_store_version"] == "1.9"
assert automation["schedule"] == "daily:08:30,20:30:Asia/Shanghai"
assert len(state["content"]) == 145
assert all(row.get("first_time_downloads") is None for row in state["content"])
assert all(row.get("trial_starts") is None for row in state["content"])
assert all(row.get("paid_conversions") is None for row in state["content"])
print("JSON_OK date=2026-09-07 websites=7 content=145 yixiu=15/24/18/4 app_store=null")
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

grep -q '"website_analytics": "2026-09-07"' "$ROOT/data/state.json"
grep -q '"latest_date": "2026-09-07"' "$ROOT/data/brief.json"
grep -q '"active_users": 22' "$ROOT/data/brief.json"
echo "DEPLOY_OK_GA4_20260907_607AF8D"
