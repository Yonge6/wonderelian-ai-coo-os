#!/usr/bin/env bash
set -euo pipefail

readonly PUBLIC_COMMIT="17fc02733b108070a2681a4234ade68e746c5e62"
readonly ROOT="${OPS_ROOT:-/srv/wonderelian/ops.wonderelian.com}"
readonly RAW_BASE_URL="https://raw.githubusercontent.com/Yonge6/wonderelian-ai-coo-os/${PUBLIC_COMMIT}/public"
readonly TEMP_DIR="$(mktemp -d /tmp/ai-coo-content-pagination-20260828.XXXXXX)"
readonly BACKUP_DIR="/srv/wonderelian/backups/ops-content-pagination-20260828-$(date +%Y%m%d%H%M%S)"
readonly BEFORE_DATA_HASHES="$TEMP_DIR/data-before.sha256"
readonly AFTER_DATA_HASHES="$TEMP_DIR/data-after.sha256"
trap 'find "$TEMP_DIR" -type f -delete 2>/dev/null || true; rmdir "$TEMP_DIR" 2>/dev/null || true' EXIT

readonly -a FILES=("index.html" "app.js" "styles.css")
declare -Ar EXPECTED_SHA256=(
  ["index.html"]="6f64bc2187be5cc8914bd2cf14b62118586956bd5db020e96da60265aeb5c4d4"
  ["app.js"]="f834a9ec1c35a5b4cc519806a242ac17926d3f62a7fd1e26da7181cb0ee3b05d"
  ["styles.css"]="28b026fbe3488407bcf4e3172fb81979cfe57d5a1854bbedb69e38865de0e302"
)

for file in "${FILES[@]}"; do
  curl --retry 3 --retry-all-errors --connect-timeout 10 --max-time 60 \
    -fsSL "$RAW_BASE_URL/$file" -o "$TEMP_DIR/$file"
  actual="$(sha256sum "$TEMP_DIR/$file" | cut -d' ' -f1)"
  test "$actual" = "${EXPECTED_SHA256[$file]}"
done

python3 - "$ROOT" <<'PY'
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
state = json.loads((root / "data/state.json").read_text(encoding="utf-8"))
brief = json.loads((root / "data/brief.json").read_text(encoding="utf-8"))
json.loads((root / "data/data-health.json").read_text(encoding="utf-8"))
json.loads((root / "data/feedback-analysis.json").read_text(encoding="utf-8"))
latest = next(row for row in brief["daily_portfolio"]["days"] if row["date"] == "2026-08-27")

assert state["metadata"]["data_through"]["website_analytics"] == "2026-08-27"
assert state["metadata"]["data_through"]["app_store"] is None
assert brief["daily_portfolio"]["latest_date"] == "2026-08-27"
assert latest["website_totals"] == {
    "active_users": 35,
    "page_views": 89,
    "sessions": 50,
    "cta_clicks": 28,
}
print("CURRENT_DATA_OK date=2026-08-27 app_store=null")
PY

sha256sum \
  "$ROOT/data/state.json" \
  "$ROOT/data/brief.json" \
  "$ROOT/data/data-health.json" \
  "$ROOT/data/feedback-analysis.json" \
  > "$BEFORE_DATA_HASHES"

mkdir -p "$BACKUP_DIR"
for file in "${FILES[@]}"; do
  cp -a "$ROOT/$file" "$BACKUP_DIR/$file"
  cp "$TEMP_DIR/$file" "$ROOT/$file"
  chmod 0644 "$ROOT/$file"
done

rollback() {
  for file in "${FILES[@]}"; do
    cp -a "$BACKUP_DIR/$file" "$ROOT/$file"
  done
  nginx -t
  echo "ROLLED_BACK"
  exit 1
}

nginx -t || rollback
grep -q "20260828-content-pagination" "$ROOT/index.html" || rollback
grep -q "const contentPageSize=6" "$ROOT/app.js" || rollback
grep -q "paginateContent" "$ROOT/app.js" || rollback
grep -q "data-content-page" "$ROOT/app.js" || rollback
grep -q "content-row dd{overflow-wrap:anywhere}" "$ROOT/styles.css" || rollback

sha256sum \
  "$ROOT/data/state.json" \
  "$ROOT/data/brief.json" \
  "$ROOT/data/data-health.json" \
  "$ROOT/data/feedback-analysis.json" \
  > "$AFTER_DATA_HASHES"
cmp -s "$BEFORE_DATA_HASHES" "$AFTER_DATA_HASHES" || rollback

curl -kfsS --resolve "ops.wonderelian.com:443:127.0.0.1" https://ops.wonderelian.com/ \
  | grep -q "20260828-content-pagination" || rollback

echo "DEPLOY_OK_CONTENT_PAGINATION_20260828_17FC027"
