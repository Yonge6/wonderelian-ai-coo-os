#!/usr/bin/env bash
set -euo pipefail

readonly PUBLIC_COMMIT="90ab3534b99b7d4a06a3da802452cfa751529a36"
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
  ["index.html"]="87aa417e5753414e93dfcea4c952d14ea9e355f35887302c152b0e74d6358736"
  ["app.js"]="f674fa1e6b761f0b9f18981732c4296c7157bc5aec6c32aa2478df6d38f7c48e"
  ["styles.css"]="e8da93676e72d1cfe4304a790d2f77c16d9599616d7c03680c0e391af9e60dae"
  ["data/state.json"]="7e9f9ce7a5d9f5f9414f82cd4b10b1369c9efa907f8f28cb127655a8d4eb446d"
  ["data/brief.json"]="7e16a2e36e61fe2979cf5ab9d27745eb9148d63d7d500d0b71755a2746a7fb67"
  ["data/data-health.json"]="479f52e34fa1aa3744a83d1939670b42c5bfd97085db5617a8ad967f57a9a8f6"
)

readonly TEMP_DIR="$(mktemp -d /tmp/ai-coo-content-first.XXXXXX)"
readonly BACKUP_DIR="/srv/wonderelian/backups/ops-content-first-$(date +%Y%m%d%H%M%S)"
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
for relative in ("data/state.json", "data/brief.json", "data/data-health.json"):
    with (root / relative).open(encoding="utf-8") as handle:
        json.load(handle)
print("JSON_OK")
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

grep -q "20260819-content-first" "$ROOT/index.html"
grep -q "sortedPublishedContent" "$ROOT/app.js"
grep -q "table-pagination" "$ROOT/styles.css"
curl -fsS -H "Host: ops.wonderelian.com" http://127.0.0.1/ \
  | grep -q "20260819-content-first"

echo "DEPLOY_OK_CONTENT_FIRST_90ab353"
