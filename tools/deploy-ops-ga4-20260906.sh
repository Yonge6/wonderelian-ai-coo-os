#!/usr/bin/env bash
set -euo pipefail

readonly PUBLIC_COMMIT="a661685d1a2e3feb75dc99ef026133ab4ca7a7ac"
readonly ROOT="${OPS_ROOT:-/srv/wonderelian/ops.wonderelian.com}"
readonly RAW_BASE_URL="https://raw.githubusercontent.com/Yonge6/wonderelian-ai-coo-os/${PUBLIC_COMMIT}/public/data"
readonly TEMP_DIR="$(mktemp -d /tmp/ai-coo-ga4-20260906.XXXXXX)"
readonly BACKUP_DIR="/srv/wonderelian/backups/ops-ga4-20260906-$(date +%Y%m%d%H%M%S)"
trap 'find "$TEMP_DIR" -type f -delete 2>/dev/null || true; rmdir "$TEMP_DIR" 2>/dev/null || true' EXIT

for file in state.json brief.json data-health.json; do
  curl --retry 3 --retry-all-errors --connect-timeout 10 --max-time 60 \
    -fsSL "$RAW_BASE_URL/$file" -o "$TEMP_DIR/$file"
done

printf '%s  %s\n' \
  "030245cbc81589e0e5f1546fd8f676283ee7d5da27160ee48f34767516363c17" "$TEMP_DIR/state.json" \
  "86eb13e4a63976606dc2e465c71a10785ef4596b27bc1e23bcaa3445e1d17c15" "$TEMP_DIR/brief.json" \
  "e54b4100d328d581dac8fe2a6d4066a39d2950d6b277faec9a228ed7c57996b1" "$TEMP_DIR/data-health.json" \
  | sha256sum -c -

python3 - "$TEMP_DIR" <<'PY'
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
state = json.loads((root / "state.json").read_text(encoding="utf-8"))
brief = json.loads((root / "brief.json").read_text(encoding="utf-8"))
json.loads((root / "data-health.json").read_text(encoding="utf-8"))

latest = next(row for row in brief["daily_portfolio"]["days"] if row["date"] == "2026-09-06")
yixiu = next(row for row in latest["websites"] if row["website_id"] == "site-yixiu")
human_design = next(row for row in latest["websites"] if row["website_id"] == "site-human-design")
maker = next(row for row in latest["websites"] if row["website_id"] == "site-maker-business-lab")
app = next(row for row in state["apps"] if row["id"] == "yixiu-meditation")

assert len(state["websites"]) == 7
assert state["metadata"]["data_through"]["website_analytics"] == "2026-09-06"
assert state["metadata"]["data_through"]["app_store"] is None
assert brief["daily_portfolio"]["latest_date"] == "2026-09-06"
assert latest["website_totals"] == {
    "active_users": 27,
    "page_views": 55,
    "sessions": 36,
    "cta_clicks": 10,
}
assert yixiu["metrics"] == {
    "active_users": 18,
    "page_views": 24,
    "sessions": 19,
    "cta_clicks": None,
}
assert human_design["metrics"] == {
    "active_users": None,
    "page_views": None,
    "sessions": None,
    "cta_clicks": None,
}
assert maker["metrics"] == {
    "active_users": 1,
    "page_views": 2,
    "sessions": 1,
    "cta_clicks": None,
}
assert app["app_store_version"] == "1.9"
assert len(state["content"]) == 145
assert all(row.get("first_time_downloads") is None for row in state["content"])
assert all(row.get("trial_starts") is None for row in state["content"])
assert all(row.get("paid_conversions") is None for row in state["content"])
print("JSON_OK date=2026-09-06 websites=7 content=145 yixiu=18/24/19/null app_store=null")
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

grep -q '"website_analytics": "2026-09-06"' "$ROOT/data/state.json"
grep -q '"latest_date": "2026-09-06"' "$ROOT/data/brief.json"
grep -q '"active_users": 27' "$ROOT/data/brief.json"
echo "DEPLOY_OK_GA4_20260906_A661685"
