#!/usr/bin/env bash
set -euo pipefail

readonly PUBLIC_COMMIT="c15c502179bde262c21ec62fad6bca8acc81042a"
readonly ROOT="${OPS_ROOT:-/srv/wonderelian/ops.wonderelian.com}"
readonly RAW_BASE_URL="https://raw.githubusercontent.com/Yonge6/wonderelian-ai-coo-os/${PUBLIC_COMMIT}/public/data"
readonly TEMP_DIR="$(mktemp -d /tmp/ai-coo-ga4-20260910.XXXXXX)"
readonly BACKUP_DIR="/srv/wonderelian/backups/ops-ga4-20260910-$(date +%Y%m%d%H%M%S)"
trap 'find "$TEMP_DIR" -type f -delete 2>/dev/null || true; rmdir "$TEMP_DIR" 2>/dev/null || true' EXIT

for file in state.json brief.json data-health.json; do
  curl --retry 3 --retry-all-errors --connect-timeout 10 --max-time 60 \
    -fsSL "$RAW_BASE_URL/$file" -o "$TEMP_DIR/$file"
done

printf '%s  %s\n' \
  "92c229c00b780f95de6fcfce5ff578d7eede28af5a7a06db930d7202d552759e" "$TEMP_DIR/state.json" \
  "a26f7e5e91de523b3ed49d747fc14375c1220e83ebc34dba35cb20c8ababb99e" "$TEMP_DIR/brief.json" \
  "0b281b29426f92c7e47a12e855f7b0fa9402409e65e4fd9271528e98c3d7ba03" "$TEMP_DIR/data-health.json" \
  | sha256sum -c -

python3 - "$TEMP_DIR" <<'PY'
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
state = json.loads((root / "state.json").read_text(encoding="utf-8"))
brief = json.loads((root / "brief.json").read_text(encoding="utf-8"))
json.loads((root / "data-health.json").read_text(encoding="utf-8"))

latest = next(row for row in brief["daily_portfolio"]["days"] if row["date"] == "2026-09-10")
style_atlas = next(row for row in latest["websites"] if row["website_id"] == "site-style-atlas")
yixiu = next(row for row in latest["websites"] if row["website_id"] == "site-yixiu")
human_design = next(row for row in latest["websites"] if row["website_id"] == "site-human-design")
wendao = next(row for row in latest["websites"] if row["website_id"] == "site-wendao")
xiazi = next(row for row in latest["websites"] if row["website_id"] == "site-xiazi")
wonderelian = next(row for row in latest["websites"] if row["website_id"] == "site-wonderelian")
maker = next(row for row in latest["websites"] if row["website_id"] == "site-maker-business-lab")
app = next(row for row in state["apps"] if row["id"] == "yixiu-meditation")
automation = next(row for row in state["jobs"] if row["id"] == "job-codex-ai-coo-unified")

assert len(state["websites"]) == 7
assert state["metadata"]["data_through"]["website_analytics"] == "2026-09-10"
assert state["metadata"]["data_through"]["app_store"] is None
assert brief["daily_portfolio"]["latest_date"] == "2026-09-10"
assert latest["website_totals"] == {
    "active_users": 64,
    "page_views": 140,
    "sessions": 74,
    "cta_clicks": 22,
}
assert style_atlas["metrics"] == {"active_users": 6, "page_views": 11, "sessions": 6, "cta_clicks": None}
assert yixiu["metrics"] == {"active_users": 20, "page_views": 28, "sessions": 23, "cta_clicks": 5}
assert human_design["metrics"] == {"active_users": None, "page_views": None, "sessions": None, "cta_clicks": None}
assert wendao["metrics"] == {"active_users": 6, "page_views": 7, "sessions": 6, "cta_clicks": 5}
assert xiazi["metrics"] == {"active_users": 11, "page_views": 11, "sessions": 11, "cta_clicks": None}
assert wonderelian["metrics"] == {"active_users": 18, "page_views": 37, "sessions": 23, "cta_clicks": 12}
assert maker["metrics"] == {"active_users": 3, "page_views": 46, "sessions": 5, "cta_clicks": None}
assert app["app_store_version"] == "1.10"
assert automation["schedule"] == "daily:08:30,20:30:Asia/Shanghai"
assert len(state["content"]) == 145
assert all(row.get("first_time_downloads") is None for row in state["content"])
assert all(row.get("trial_starts") is None for row in state["content"])
assert all(row.get("paid_conversions") is None for row in state["content"])
print("JSON_OK date=2026-09-10 websites=7 content=145 yixiu=20/28/23/5 maker=3/46/5/null app_store=null")
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

grep -q '"website_analytics": "2026-09-10"' "$ROOT/data/state.json"
grep -q '"latest_date": "2026-09-10"' "$ROOT/data/brief.json"
grep -q '"active_users": 64' "$ROOT/data/brief.json"
echo "DEPLOY_OK_GA4_20260910_C15C502"
