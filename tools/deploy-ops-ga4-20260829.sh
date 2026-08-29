#!/usr/bin/env bash
set -euo pipefail

readonly PUBLIC_COMMIT="62bf5ebacba15def3de114a3bb2eb65a98b7cb27"
readonly ROOT="${OPS_ROOT:-/srv/wonderelian/ops.wonderelian.com}"
readonly RAW_BASE_URL="https://raw.githubusercontent.com/Yonge6/wonderelian-ai-coo-os/${PUBLIC_COMMIT}/public/data"
readonly TEMP_DIR="$(mktemp -d /tmp/ai-coo-ga4-20260829.XXXXXX)"
readonly BACKUP_DIR="/srv/wonderelian/backups/ops-ga4-20260829-$(date +%Y%m%d%H%M%S)"
trap 'find "$TEMP_DIR" -type f -delete 2>/dev/null || true; rmdir "$TEMP_DIR" 2>/dev/null || true' EXIT

for file in state.json brief.json data-health.json; do
  curl --retry 3 --retry-all-errors --connect-timeout 10 --max-time 60 \
    -fsSL "$RAW_BASE_URL/$file" -o "$TEMP_DIR/$file"
done

printf '%s  %s\n' \
  "9e72f9350abaee199aae5cd0f84d67a65b09409fea4db5d5835f4ef42c40a01c" "$TEMP_DIR/state.json" \
  "40505cda3669ad9b69d0f54aacf70224a69bf133616f661d780669bb0e1a32ac" "$TEMP_DIR/brief.json" \
  "42bf3abad62653ac3ac270baf63c8b3c8b1f714336ae9c96bee4a927409d80e8" "$TEMP_DIR/data-health.json" \
  | sha256sum -c -

python3 - "$TEMP_DIR" <<'PY'
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
state = json.loads((root / "state.json").read_text(encoding="utf-8"))
brief = json.loads((root / "brief.json").read_text(encoding="utf-8"))
json.loads((root / "data-health.json").read_text(encoding="utf-8"))

latest = next(row for row in brief["daily_portfolio"]["days"] if row["date"] == "2026-08-29")
yixiu_content = [
    row for row in state["content"]
    if row.get("app_id") == "yixiu-meditation" and row.get("published_at") == "2026-08-29"
]
late_ids = {
    "yixiu-owned-best-sleep-sounds-20260829",
    "yixiu-pinterest-best-sleep-sounds-20260829",
    "yixiu-instagram-underwater-white-noise-reel-20260829",
    "yixiu-pinterest-one-minute-reset-video-20260829",
    "yixiu-github-nature-sound-collection-release-20260829",
    "yixiu-youtube-white-noise-community-20260829",
    "yixiu-youtube-channel-home-profile-20260829",
}

assert len(state["websites"]) == 7
assert state["metadata"]["data_through"]["website_analytics"] == "2026-08-29"
assert state["metadata"]["data_through"]["app_store"] is None
assert brief["daily_portfolio"]["latest_date"] == "2026-08-29"
assert latest["website_totals"] == {
    "active_users": 27,
    "page_views": 90,
    "sessions": 44,
    "cta_clicks": 2,
}
assert len(yixiu_content) == 30
assert late_ids.issubset({row["id"] for row in yixiu_content})
assert all(row.get("first_time_downloads") is None for row in yixiu_content)
assert all(row.get("trial_starts") is None for row in yixiu_content)
assert all(row.get("paid_conversions") is None for row in yixiu_content)
assert any(
    row.get("id") == "audit-yixiu-late-publications-20260830" and row.get("status") == "success"
    for row in state["audit"]
)
print("JSON_OK date=2026-08-29 websites=7 yixiu_content=30 content=134 app_store=null")
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

grep -q '"website_analytics": "2026-08-29"' "$ROOT/data/state.json"
grep -q '"latest_date": "2026-08-29"' "$ROOT/data/brief.json"
grep -q '"active_users": 27' "$ROOT/data/brief.json"
grep -q 'audit-yixiu-late-publications-20260830' "$ROOT/data/state.json"
echo "DEPLOY_OK_GA4_20260829_62BF5EB"
