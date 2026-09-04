#!/usr/bin/env bash
set -euo pipefail

readonly PUBLIC_COMMIT="00e15553f76c821c06919f0404a3bc46fa256a27"
readonly ROOT="${OPS_ROOT:-/srv/wonderelian/ops.wonderelian.com}"
readonly RAW_BASE_URL="https://raw.githubusercontent.com/Yonge6/wonderelian-ai-coo-os/${PUBLIC_COMMIT}/public/data"
readonly TEMP_DIR="$(mktemp -d /tmp/ai-coo-ga4-20260903.XXXXXX)"
readonly BACKUP_DIR="/srv/wonderelian/backups/ops-ga4-20260903-$(date +%Y%m%d%H%M%S)"
trap 'find "$TEMP_DIR" -type f -delete 2>/dev/null || true; rmdir "$TEMP_DIR" 2>/dev/null || true' EXIT

for file in state.json brief.json data-health.json; do
  curl --retry 3 --retry-all-errors --connect-timeout 10 --max-time 60 \
    -fsSL "$RAW_BASE_URL/$file" -o "$TEMP_DIR/$file"
done

printf '%s  %s\n' \
  "8203092a8692f894119d984bbeb76c42e43fe23abfafcdcca6ba005d36870280" "$TEMP_DIR/state.json" \
  "2f4942686ba85c7f5090f51905a27294eb6df69471f55c2ebb153fb28ba1daa5" "$TEMP_DIR/brief.json" \
  "556bb580e3cdda88f4eade2a47e786bee2135e8ecfbaaa07f49b3ea8fa6d0c7c" "$TEMP_DIR/data-health.json" \
  | sha256sum -c -

python3 - "$TEMP_DIR" <<'PY'
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
state = json.loads((root / "state.json").read_text(encoding="utf-8"))
brief = json.loads((root / "brief.json").read_text(encoding="utf-8"))
json.loads((root / "data-health.json").read_text(encoding="utf-8"))

latest = next(row for row in brief["daily_portfolio"]["days"] if row["date"] == "2026-09-03")
yixiu = next(row for row in latest["websites"] if row["website_id"] == "site-yixiu")
human_design = next(row for row in latest["websites"] if row["website_id"] == "site-human-design")
required_urls = {
    "https://www.youtube.com/shorts/_sMmBoAl0zU",
    "https://www.youtube.com/shorts/N4DcQXJAB34",
}
content_urls = {row.get("publish_url") for row in state["content"]}

assert len(state["websites"]) == 7
assert state["metadata"]["data_through"]["website_analytics"] == "2026-09-03"
assert state["metadata"]["data_through"]["app_store"] is None
assert brief["daily_portfolio"]["latest_date"] == "2026-09-03"
assert latest["website_totals"] == {
    "active_users": 56,
    "page_views": 119,
    "sessions": 80,
    "cta_clicks": 94,
}
assert yixiu["metrics"] == {
    "active_users": 21,
    "page_views": 53,
    "sessions": 26,
    "cta_clicks": 62,
}
assert human_design["metrics"] == {
    "active_users": None,
    "page_views": None,
    "sessions": None,
    "cta_clicks": None,
}
assert len(state["content"]) == 144
assert required_urls <= content_urls
assert all(row.get("first_time_downloads") is None for row in state["content"])
assert all(row.get("trial_starts") is None for row in state["content"])
assert all(row.get("paid_conversions") is None for row in state["content"])
print("JSON_OK date=2026-09-03 websites=7 content=144 yixiu=21/53/26/62 app_store=null")
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

grep -q '"website_analytics": "2026-09-03"' "$ROOT/data/state.json"
grep -q '"latest_date": "2026-09-03"' "$ROOT/data/brief.json"
grep -q '"active_users": 56' "$ROOT/data/brief.json"
echo "DEPLOY_OK_GA4_20260903_00E1555"
