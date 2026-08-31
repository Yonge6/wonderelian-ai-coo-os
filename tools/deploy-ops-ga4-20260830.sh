#!/usr/bin/env bash
set -euo pipefail

readonly PUBLIC_COMMIT="575f80251a8bbd13b69dbb3be3d075215f811aed"
readonly ROOT="${OPS_ROOT:-/srv/wonderelian/ops.wonderelian.com}"
readonly RAW_BASE_URL="https://raw.githubusercontent.com/Yonge6/wonderelian-ai-coo-os/${PUBLIC_COMMIT}/public/data"
readonly TEMP_DIR="$(mktemp -d /tmp/ai-coo-ga4-20260830.XXXXXX)"
readonly BACKUP_DIR="/srv/wonderelian/backups/ops-ga4-20260830-$(date +%Y%m%d%H%M%S)"
trap 'find "$TEMP_DIR" -type f -delete 2>/dev/null || true; rmdir "$TEMP_DIR" 2>/dev/null || true' EXIT

for file in state.json brief.json data-health.json; do
  curl --retry 3 --retry-all-errors --connect-timeout 10 --max-time 60 \
    -fsSL "$RAW_BASE_URL/$file" -o "$TEMP_DIR/$file"
done

printf '%s  %s\n' \
  "f709843514670a384baf309774fdadc69bfe9f2b25a446e8ab7f624a2cd681d0" "$TEMP_DIR/state.json" \
  "4d663c0ad45374034309de77c0a6f38231ce4c2d6aa93782184fb600524871a8" "$TEMP_DIR/brief.json" \
  "932676d5de8a7894b7c57981a2121f7e1923829c17e52f7d5dbe1335ba6ab6c7" "$TEMP_DIR/data-health.json" \
  | sha256sum -c -

python3 - "$TEMP_DIR" <<'PY'
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
state = json.loads((root / "state.json").read_text(encoding="utf-8"))
brief = json.loads((root / "brief.json").read_text(encoding="utf-8"))
json.loads((root / "data-health.json").read_text(encoding="utf-8"))

latest = next(row for row in brief["daily_portfolio"]["days"] if row["date"] == "2026-08-30")
yixiu = next(row for row in latest["websites"] if row["website_id"] == "site-yixiu")
content = [row for row in state["content"] if row.get("published_at") == "2026-08-30"]

assert len(state["websites"]) == 7
assert state["metadata"]["data_through"]["website_analytics"] == "2026-08-30"
assert state["metadata"]["data_through"]["app_store"] is None
assert brief["daily_portfolio"]["latest_date"] == "2026-08-30"
assert latest["website_totals"] == {
    "active_users": 24,
    "page_views": 103,
    "sessions": 34,
    "cta_clicks": 8,
}
assert yixiu["metrics"] == {
    "active_users": 13,
    "page_views": 24,
    "sessions": 15,
    "cta_clicks": 2,
}
assert len(state["content"]) == 134
assert content == []
print("JSON_OK date=2026-08-30 websites=7 content=134 yixiu=13/24/15/2 app_store=null")
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

grep -q '"website_analytics": "2026-08-30"' "$ROOT/data/state.json"
grep -q '"latest_date": "2026-08-30"' "$ROOT/data/brief.json"
grep -q '"active_users": 24' "$ROOT/data/brief.json"
echo "DEPLOY_OK_GA4_20260830_575F802"
