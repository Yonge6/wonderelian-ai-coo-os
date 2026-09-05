#!/usr/bin/env bash
set -euo pipefail

readonly PUBLIC_COMMIT="f4c81aa9421559a9b5d6f49618ee029fa727115f"
readonly ROOT="${OPS_ROOT:-/srv/wonderelian/ops.wonderelian.com}"
readonly RAW_BASE_URL="https://raw.githubusercontent.com/Yonge6/wonderelian-ai-coo-os/${PUBLIC_COMMIT}/public/data"
readonly TEMP_DIR="$(mktemp -d /tmp/ai-coo-yixiu-v1-9.XXXXXX)"
readonly BACKUP_DIR="/srv/wonderelian/backups/ops-yixiu-v1-9-$(date +%Y%m%d%H%M%S)"
trap 'find "$TEMP_DIR" -type f -delete 2>/dev/null || true; rmdir "$TEMP_DIR" 2>/dev/null || true' EXIT

for file in state.json brief.json data-health.json; do
  curl --retry 3 --retry-all-errors --connect-timeout 10 --max-time 60 \
    -fsSL "$RAW_BASE_URL/$file" -o "$TEMP_DIR/$file"
done

printf '%s  %s\n' \
  "a7b49028d033cde09c2873532b1ed08e96c5e085f716db4681db76dccbbf79b0" "$TEMP_DIR/state.json" \
  "3482dffa00c0429efd5045feb48732edabb5f59cfcd1e3bad13d21f9e7e5cfe6" "$TEMP_DIR/brief.json" \
  "f102bd28b1e394da250c8d1248bfc3cfa0e6eb9e2b379633d478afbe33e569fd" "$TEMP_DIR/data-health.json" \
  | sha256sum -c -

python3 - "$TEMP_DIR" <<'PY'
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
state = json.loads((root / "state.json").read_text(encoding="utf-8"))
brief = json.loads((root / "brief.json").read_text(encoding="utf-8"))
json.loads((root / "data-health.json").read_text(encoding="utf-8"))

yixiu = next(row for row in state["apps"] if row["id"] == "yixiu-meditation")
assert yixiu["app_store_version"] == "1.9"
assert yixiu["app_store_release_date"] == "2026-09-04T22:45:01.000Z"
assert state["metadata"]["data_through"]["website_analytics"] == "2026-09-04"
assert state["metadata"]["data_through"]["app_store"] is None
assert brief["daily_portfolio"]["latest_date"] == "2026-09-04"
assert any(row.get("id") == "operational-change-yixiu-v1-9-live-20260905" for row in state["detections"])
assert len(state["content"]) == 145
print("JSON_OK date=2026-09-04 yixiu_version=1.9 content=145 app_store_metrics=null")
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

grep -q '"app_store_version": "1.9"' "$ROOT/data/state.json"
grep -q '"website_analytics": "2026-09-04"' "$ROOT/data/state.json"
grep -q '"latest_date": "2026-09-04"' "$ROOT/data/brief.json"
echo "DEPLOY_OK_YIXIU_V1_9_F4C81AA"
