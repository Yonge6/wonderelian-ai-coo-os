#!/usr/bin/env bash
set -euo pipefail

readonly PUBLIC_COMMIT="d558afdef9a08b468389b93328ade5291f4f0e41"
readonly ROOT="${OPS_ROOT:-/srv/wonderelian/ops.wonderelian.com}"
readonly RAW_BASE_URL="https://cdn.jsdelivr.net/gh/Yonge6/wonderelian-ai-coo-os@${PUBLIC_COMMIT}/public/data"
readonly TEMP_DIR="$(mktemp -d /tmp/ai-coo-ga4-20260823.XXXXXX)"
readonly BACKUP_DIR="/srv/wonderelian/backups/ops-ga4-20260823-$(date +%Y%m%d%H%M%S)"
trap 'rm -rf "$TEMP_DIR"' EXIT

curl --retry 3 --retry-all-errors --connect-timeout 10 --max-time 60 \
  -fsSL "$RAW_BASE_URL/state.json" -o "$TEMP_DIR/state.json"
curl --retry 3 --retry-all-errors --connect-timeout 10 --max-time 60 \
  -fsSL "$RAW_BASE_URL/brief.json" -o "$TEMP_DIR/brief.json"
curl --retry 3 --retry-all-errors --connect-timeout 10 --max-time 60 \
  -fsSL "$RAW_BASE_URL/data-health.json" -o "$TEMP_DIR/data-health.json"

printf '%s  %s\n' \
  "9803cc67d6684f11f5df3c1b103870afec2dd5026f7c00dae704308ed9559541" "$TEMP_DIR/state.json" \
  "b1e6e8395989102f2df488e601c9132e2e5f62340a2861cfdae9562ce595cbd0" "$TEMP_DIR/brief.json" \
  "1ff1ae9237eaae35a0f33dd89fb44a034e65062583c46f39d2812d9d29c89591" "$TEMP_DIR/data-health.json" \
  | sha256sum -c -

python3 - "$TEMP_DIR" <<'PY'
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
state = json.loads((root / "state.json").read_text(encoding="utf-8"))
brief = json.loads((root / "brief.json").read_text(encoding="utf-8"))
json.loads((root / "data-health.json").read_text(encoding="utf-8"))

maker = next(row for row in state["websites"] if row["id"] == "site-maker-business-lab")
maker_metrics = [
    row for row in state["website_metrics"]
    if row["website_id"] == maker["id"] and row["period_end"] == "2026-08-23"
]
yixiu_content = [
    row for row in state["content"]
    if row["app_id"] == "yixiu-meditation" and row["published_at"] == "2026-08-23"
]
latest = next(row for row in brief["daily_portfolio"]["days"] if row["date"] == "2026-08-23")

assert len(state["websites"]) == 7
assert state["metadata"]["data_through"]["website_analytics"] == "2026-08-23"
assert brief["daily_portfolio"]["latest_date"] == "2026-08-23"
assert latest["website_totals"] == {
    "active_users": 17,
    "page_views": 38,
    "sessions": 22,
    "cta_clicks": 2,
}
assert maker["analytics_status"] == "connected"
assert maker_metrics
assert len(yixiu_content) == 7
assert all(row["status"] == "published" and row["url"] for row in yixiu_content)
assert all(row["first_time_downloads"] is None for row in yixiu_content)
print("JSON_OK date=2026-08-23 websites=7 maker=connected yixiu_content=7")
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

grep -q '"website_analytics": "2026-08-23"' "$ROOT/data/state.json"
grep -q '"latest_date": "2026-08-23"' "$ROOT/data/brief.json"
grep -q 'yixiu-instagram-rain-focus-20260823' "$ROOT/data/state.json"
grep -q '"analytics_status": "connected"' "$ROOT/data/state.json"
echo "DEPLOY_OK_GA4_20260823_D558AFD"
