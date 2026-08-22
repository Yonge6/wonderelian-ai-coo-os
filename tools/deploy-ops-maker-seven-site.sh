#!/usr/bin/env bash
set -euo pipefail

readonly PUBLIC_COMMIT="6f97b0d2fe4240263178a2ac660bebc9804c5113"
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
  ["data/state.json"]="87c325819066e33376624acb7e6533725f8755d1b8710c66cc5d8ad779c7ad29"
  ["data/brief.json"]="1582ac2cbf783b38e2da983de136a31758667e0c71eb92800330bc76591de897"
  ["data/data-health.json"]="bee1d94a8c0a095eb918367aa9fb445a73c92fecb69817322e3b3dfeac844df6"
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
print("JSON_OK websites=7 maker=live yixiu=1.3 priority=1 style_atlas=paused")
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
grep -q '"sites_tracked": 7' "$ROOT/data/brief.json"
curl -fsS --resolve "ops.wonderelian.com:443:127.0.0.1" https://ops.wonderelian.com/ \
  | grep -q "20260821-maker-seven-site"

echo "DEPLOY_OK_YIXIU_PRIORITY_6f97b0d"
