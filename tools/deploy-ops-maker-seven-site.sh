#!/usr/bin/env bash
set -euo pipefail

readonly PUBLIC_COMMIT="02d3b9d5bc8830d5e29693e15ba7c148034a2661"
readonly ROOT="${OPS_ROOT:-/srv/wonderelian/ops.wonderelian.com}"
readonly RAW_BASE="https://raw.githubusercontent.com/Yonge6/wonderelian-ai-coo-os/${PUBLIC_COMMIT}/public"

readonly -a FILES=(
  "index.html"
  "app.js"
  "styles.css"
  "data/state.json"
  "data/brief.json"
  "data/data-health.json"
)

declare -Ar EXPECTED_SHA256=(
  ["index.html"]="573536330b6beb290d226afdede06456760a79230388c3ca07a40a73b1356994"
  ["app.js"]="b686006247b114b1021f9942e323d3bd12cb0795150c77663efe590e44bad721"
  ["styles.css"]="e8da93676e72d1cfe4304a790d2f77c16d9599616d7c03680c0e391af9e60dae"
  ["data/state.json"]="e8a4028393fcff1385b01157bd04784ccfa7750d473132aac05ce06889c07ede"
  ["data/brief.json"]="e256cd66fd510c9e6a291a3d1a073114323ae6567a3c15bff78f153b9680871c"
  ["data/data-health.json"]="d4de734790b9eb46df4b8d5b6b1d759fe7b05ed52864311c687cd947c5c62074"
)

readonly TEMP_DIR="$(mktemp -d /tmp/ai-coo-maker-seven-site.XXXXXX)"
readonly BACKUP_DIR="/srv/wonderelian/backups/ops-maker-seven-site-$(date +%Y%m%d%H%M%S)"
trap 'rm -rf "$TEMP_DIR"' EXIT

for file in "${FILES[@]}"; do
  mkdir -p "$TEMP_DIR/$(dirname "$file")"
  curl --retry 3 --retry-all-errors --connect-timeout 15 --max-time 120 \
    -fsSL "$RAW_BASE/$file" -o "$TEMP_DIR/$file"
  actual="$(sha256sum "$TEMP_DIR/$file" | cut -d' ' -f1)"
  test "$actual" = "${EXPECTED_SHA256[$file]}"
done

python3 - "$TEMP_DIR" <<'PY'
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
state = json.loads((root / "data/state.json").read_text(encoding="utf-8"))
brief = json.loads((root / "data/brief.json").read_text(encoding="utf-8"))
json.loads((root / "data/data-health.json").read_text(encoding="utf-8"))
maker = next((row for row in state.get("websites", []) if row.get("id") == "site-maker-business-lab"), None)
yixiu = next((row for row in state.get("apps", []) if row.get("id") == "yixiu-meditation"), None)
style_atlas = next((row for row in state.get("apps", []) if row.get("id") == "style-atlas"), None)
yixiu_job = next((row for row in state.get("jobs", []) if row.get("id") == "job-codex-ai-coo-unified"), None)
assert len(state.get("websites", [])) == 7
assert len(state.get("website_operations", [])) == 7
assert maker and maker.get("health_status") == "live"
assert maker.get("analytics_status") == "tag_detected"
assert yixiu and yixiu.get("app_store_version") == "1.3"
assert yixiu.get("promotion_priority") == 1
assert yixiu.get("promotion_status") == "active_highest_priority"
assert style_atlas and style_atlas.get("promotion_status") == "paused_by_owner"
assert yixiu_job and yixiu_job.get("app_id") == "yixiu-meditation"
assert brief.get("website_summary", {}).get("sites_tracked") == 7
assert state.get("metadata", {}).get("data_through", {}).get("website_analytics") == "2026-08-21"
assert brief.get("daily_portfolio", {}).get("latest_date") == "2026-08-21"
print("JSON_OK websites=7 analytics=2026-08-21 yixiu=1.3 priority=1")
PY

mkdir -p "$BACKUP_DIR/data"
for file in "${FILES[@]}"; do
  cp -a "$ROOT/$file" "$BACKUP_DIR/$file"
  cp "$TEMP_DIR/$file" "$ROOT/$file"
  chmod 0644 "$ROOT/$file"
done

if ! nginx -t; then
  for file in "${FILES[@]}"; do
    cp -a "$BACKUP_DIR/$file" "$ROOT/$file"
  done
  nginx -t
  echo "ROLLED_BACK"
  exit 1
fi

grep -q "20260821-maker-seven-site" "$ROOT/index.html"
grep -q "site-maker-business-lab" "$ROOT/data/state.json"
grep -q '"app_store_version": "1.3"' "$ROOT/data/state.json"
grep -q '"promotion_status": "active_highest_priority"' "$ROOT/data/state.json"
grep -q '"promotion_status": "paused_by_owner"' "$ROOT/data/state.json"
grep -q '"website_analytics": "2026-08-21"' "$ROOT/data/state.json"
grep -q '"sites_tracked": 7' "$ROOT/data/brief.json"
curl -fsS --resolve "ops.wonderelian.com:443:127.0.0.1" https://ops.wonderelian.com/ \
  | grep -q "20260821-maker-seven-site"

echo "DEPLOY_OK_GA4_20260821_02d3b9d"
