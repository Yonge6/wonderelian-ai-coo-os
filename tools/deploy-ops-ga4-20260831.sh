#!/usr/bin/env bash
set -euo pipefail

readonly PUBLIC_COMMIT="8cb4229ce57ecfb51802189d164eb74decbadc5c"
readonly ROOT="${OPS_ROOT:-/srv/wonderelian/ops.wonderelian.com}"
readonly RAW_BASE_URL="https://raw.githubusercontent.com/Yonge6/wonderelian-ai-coo-os/${PUBLIC_COMMIT}/public/data"
readonly TEMP_DIR="$(mktemp -d /tmp/ai-coo-ga4-20260831.XXXXXX)"
readonly BACKUP_DIR="/srv/wonderelian/backups/ops-ga4-20260831-$(date +%Y%m%d%H%M%S)"
trap 'find "$TEMP_DIR" -type f -delete 2>/dev/null || true; rmdir "$TEMP_DIR" 2>/dev/null || true' EXIT

for file in state.json brief.json data-health.json; do
  curl --retry 3 --retry-all-errors --connect-timeout 10 --max-time 60 \
    -fsSL "$RAW_BASE_URL/$file" -o "$TEMP_DIR/$file"
done

printf '%s  %s\n' \
  "f2ebf4659be4e13eb8fc5d9e8594cf49127d984d77f2ed122d2984cffef1a8ec" "$TEMP_DIR/state.json" \
  "3f27ab0986347d29e1311f547da4c37c4a960090dfec07fa28f52d2cfc92d6cb" "$TEMP_DIR/brief.json" \
  "cbeb14322a108bcca40a511d83a810dd1bc0afd686638a1609f800b684d123e0" "$TEMP_DIR/data-health.json" \
  | sha256sum -c -

python3 - "$TEMP_DIR" <<'PY'
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
state = json.loads((root / "state.json").read_text(encoding="utf-8"))
brief = json.loads((root / "brief.json").read_text(encoding="utf-8"))
json.loads((root / "data-health.json").read_text(encoding="utf-8"))

latest = next(row for row in brief["daily_portfolio"]["days"] if row["date"] == "2026-08-31")
yixiu = next(row for row in latest["websites"] if row["website_id"] == "site-yixiu")
content = [row for row in state["content"] if row.get("published_at") == "2026-08-30"]

assert len(state["websites"]) == 7
assert state["metadata"]["data_through"]["website_analytics"] == "2026-08-31"
assert state["metadata"]["data_through"]["app_store"] is None
assert brief["daily_portfolio"]["latest_date"] == "2026-08-31"
assert latest["website_totals"] == {
    "active_users": 46,
    "page_views": 157,
    "sessions": 60,
    "cta_clicks": 8,
}
assert yixiu["metrics"] == {
    "active_users": 33,
    "page_views": 54,
    "sessions": 42,
    "cta_clicks": 4,
}
assert len(state["content"]) == 142
assert len(content) == 8
assert all(row.get("first_time_downloads") is None for row in content)
assert all(row.get("trial_starts") is None for row in content)
assert all(row.get("paid_conversions") is None for row in content)
print("JSON_OK date=2026-08-31 websites=7 content=142 yixiu=33/54/42/4 app_store=null")
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

grep -q '"website_analytics": "2026-08-31"' "$ROOT/data/state.json"
grep -q '"latest_date": "2026-08-31"' "$ROOT/data/brief.json"
grep -q '"active_users": 46' "$ROOT/data/brief.json"
echo "DEPLOY_OK_GA4_20260831_8CB4229"
