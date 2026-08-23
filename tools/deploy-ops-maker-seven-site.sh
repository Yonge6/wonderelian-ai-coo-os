#!/usr/bin/env bash
set -euo pipefail

readonly PUBLIC_COMMIT="4c1b9583d91c7474ffc29fd822642c9f36f51e7d"
readonly ROOT="${OPS_ROOT:-/srv/wonderelian/ops.wonderelian.com}"
readonly ARCHIVE_URL="https://github.com/Yonge6/wonderelian-ai-coo-os/archive/${PUBLIC_COMMIT}.tar.gz"

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
  ["data/state.json"]="79be6a5af2ed069fc55e32e78d92fafa9c29c4544771379342cc639b3d7f45c8"
  ["data/brief.json"]="1cb6534dfdc1e278db1aaf87532b2cb02f10c74c6cb3f333151be7bad4afc15e"
  ["data/data-health.json"]="84daaa6871c83f007c10f5cfc7ff30807fbd2d518626382d27492be19d7c0903"
)

readonly TEMP_DIR="$(mktemp -d /tmp/ai-coo-maker-seven-site.XXXXXX)"
readonly BACKUP_DIR="/srv/wonderelian/backups/ops-maker-seven-site-$(date +%Y%m%d%H%M%S)"
trap 'rm -rf "$TEMP_DIR"' EXIT

echo "FETCH_ARCHIVE_START"
curl --retry 5 --retry-all-errors --connect-timeout 15 --max-time 300 \
  -fsSL "$ARCHIVE_URL" -o "$TEMP_DIR/source.tar.gz"
tar -xzf "$TEMP_DIR/source.tar.gz" -C "$TEMP_DIR"
readonly SOURCE_PUBLIC="$TEMP_DIR/wonderelian-ai-coo-os-${PUBLIC_COMMIT}/public"

for file in "${FILES[@]}"; do
  test -f "$SOURCE_PUBLIC/$file"
  actual="$(sha256sum "$SOURCE_PUBLIC/$file" | cut -d' ' -f1)"
  test "$actual" = "${EXPECTED_SHA256[$file]}"
done
echo "ARCHIVE_HASHES_OK"

python3 - "$SOURCE_PUBLIC" <<'PY'
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
assert state.get("metadata", {}).get("data_through", {}).get("website_analytics") == "2026-08-22"
assert brief.get("daily_portfolio", {}).get("latest_date") == "2026-08-22"
assert len([row for row in state.get("content", []) if row.get("app_id") == "yixiu-meditation" and row.get("published_at") == "2026-08-22"]) == 7
print("JSON_OK websites=7 analytics=2026-08-22 yixiu=1.3 content=7 priority=1")
PY

mkdir -p "$BACKUP_DIR/data"
for file in "${FILES[@]}"; do
  cp -a "$ROOT/$file" "$BACKUP_DIR/$file"
  cp "$SOURCE_PUBLIC/$file" "$ROOT/$file"
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
grep -q '"website_analytics": "2026-08-22"' "$ROOT/data/state.json"
grep -q '"latest_date": "2026-08-22"' "$ROOT/data/brief.json"
grep -q 'yixiu-instagram-deep-ocean-20260822' "$ROOT/data/state.json"
grep -q '"sites_tracked": 7' "$ROOT/data/brief.json"
curl -fsS --resolve "ops.wonderelian.com:443:127.0.0.1" https://ops.wonderelian.com/ \
  | grep -q "20260821-maker-seven-site"

echo "DEPLOY_OK_GA4_20260822_4c1b958"
