#!/usr/bin/env bash
set -euo pipefail

readonly PUBLIC_COMMIT="18ae1f842c2ac60b95dd7b14878ce6d290064b43"
readonly ROOT="${OPS_ROOT:-/srv/wonderelian/ops.wonderelian.com}"
readonly RAW_BASE_URL="https://cdn.jsdelivr.net/gh/Yonge6/wonderelian-ai-coo-os@${PUBLIC_COMMIT}/public/data"
readonly TEMP_DIR="$(mktemp -d /tmp/ai-coo-maker-ga4-audit.XXXXXX)"
readonly BACKUP_DIR="/srv/wonderelian/backups/ops-maker-ga4-audit-$(date +%Y%m%d%H%M%S)"
trap 'rm -rf "$TEMP_DIR"' EXIT

curl --retry 3 --retry-all-errors --connect-timeout 10 --max-time 45 \
  -fsSL "$RAW_BASE_URL/state.json" -o "$TEMP_DIR/state.json"
curl --retry 3 --retry-all-errors --connect-timeout 10 --max-time 45 \
  -fsSL "$RAW_BASE_URL/brief.json" -o "$TEMP_DIR/brief.json"

printf '%s  %s\n' \
  "7b0e211ddfc3f13ab1f1a547f65f5f3744590bf5cdd0a3a668f03d0bffcc2df6" "$TEMP_DIR/state.json" \
  "f6871a636cd3b0281ba846b84d65bcf41adfef8b584b459ec7ea84f61345361f" "$TEMP_DIR/brief.json" \
  | sha256sum -c -

python3 - "$TEMP_DIR" <<'PY'
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
state = json.loads((root / "state.json").read_text(encoding="utf-8"))
brief = json.loads((root / "brief.json").read_text(encoding="utf-8"))
maker = next(row for row in state["websites"] if row["id"] == "site-maker-business-lab")
operation = next(row for row in state["website_operations"] if row["website_id"] == maker["id"])
audit = next(row for row in state["audit"] if row["action"] == "connect_maker_to_existing_portfolio_ga4")
assert len(state["websites"]) == 7
assert maker["analytics_status"] == "tag_detected"
assert "first completed-date GA4 Data API observation" in operation["next_action"]
assert audit["status"] == "waiting"
assert state["metadata"]["data_through"]["website_analytics"] == "2026-08-22"
assert brief["daily_portfolio"]["latest_date"] == "2026-08-22"
print("JSON_OK websites=7 maker_realtime_verified=1 daily_observations=0 analytics=2026-08-22")
PY

mkdir -p "$BACKUP_DIR/data"
cp -a "$ROOT/data/state.json" "$BACKUP_DIR/data/state.json"
cp -a "$ROOT/data/brief.json" "$BACKUP_DIR/data/brief.json"
cp "$TEMP_DIR/state.json" "$ROOT/data/state.json"
cp "$TEMP_DIR/brief.json" "$ROOT/data/brief.json"
chmod 0644 "$ROOT/data/state.json" "$ROOT/data/brief.json"

if ! nginx -t; then
  cp -a "$BACKUP_DIR/data/state.json" "$ROOT/data/state.json"
  cp -a "$BACKUP_DIR/data/brief.json" "$ROOT/data/brief.json"
  nginx -t
  echo "ROLLED_BACK"
  exit 1
fi

grep -q 'connect_maker_to_existing_portfolio_ga4' "$ROOT/data/state.json"
grep -q '"latest_date": "2026-08-22"' "$ROOT/data/brief.json"
echo "DEPLOY_OK_MAKER_GA4_AUDIT_18ae1f8"
