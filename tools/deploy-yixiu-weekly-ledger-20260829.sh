#!/usr/bin/env bash
set -euo pipefail

readonly PUBLIC_COMMIT="a1279ef6a3863ee0e283ea8cf74d581888669472"
readonly ROOT="${OPS_ROOT:-/srv/wonderelian/ops.wonderelian.com}"
readonly RAW_BASE_URL="https://raw.githubusercontent.com/Yonge6/wonderelian-ai-coo-os/${PUBLIC_COMMIT}/public"
readonly TEMP_DIR="$(mktemp -d /tmp/ai-coo-yixiu-weekly-ledger-20260829.XXXXXX)"
readonly BACKUP_DIR="/srv/wonderelian/backups/ops-yixiu-weekly-ledger-20260829-$(date +%Y%m%d%H%M%S)"
trap 'find "$TEMP_DIR" -type f -delete 2>/dev/null || true; find "$TEMP_DIR" -depth -type d -empty -delete 2>/dev/null || true' EXIT

readonly -a FILES=("index.html" "app.js" "data/state.json" "data/brief.json" "data/data-health.json")
declare -Ar EXPECTED_SHA256=(
  ["index.html"]="b179dc86f2fb4b33067622b66dab42710a7e92fa897ae4c044a6c1ec7e52b761"
  ["app.js"]="cfae27d9789eb3c317d987132f409f82d94ca6fe9b8cdb39a9e9c2b52c07c532"
  ["data/state.json"]="87a9aab6d2b44eb59fded066183a118723583c402bba55390192a91930148f86"
  ["data/brief.json"]="dc757fb71a186034c67e7266748343f5242eb27c666edfe91250ed82cd14dc6a"
  ["data/data-health.json"]="8399a75b0490254f27830bfc6c160394643010af877f6468360e3ac83c022296"
)

for file in "${FILES[@]}"; do
  mkdir -p "$TEMP_DIR/$(dirname "$file")"
  curl --retry 3 --retry-all-errors --connect-timeout 10 --max-time 60 \
    -fsSL "$RAW_BASE_URL/$file" -o "$TEMP_DIR/$file"
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

weekly = [
    row for row in state["content"]
    if row.get("app_id") == "yixiu-meditation" and row.get("published_at", "") >= "2026-08-26"
]
urls = [row.get("publish_url") or row.get("url") for row in state["content"]]
latest = next(row for row in brief["daily_portfolio"]["days"] if row["date"] == "2026-08-28")
audit = next(row for row in state["audit"] if row["id"] == "audit-yixiu-weekly-publications-20260829")

assert len(state["content"]) == 127
assert len(weekly) == 48
assert len(urls) == len(set(url.rstrip("/").replace("https://youtube.com", "https://www.youtube.com") for url in urls))
assert all(url and url.startswith("https://") for url in urls)
assert all(row.get("first_time_downloads") is None for row in weekly)
assert all(row.get("trial_starts") is None for row in weekly)
assert all(row.get("paid_conversions") is None for row in weekly)
assert audit["status"] == "success"
assert audit["action"] == "sync_verified_yixiu_weekly_publications_2026_08_26_29"
assert state["metadata"]["data_through"]["website_analytics"] == "2026-08-28"
assert state["metadata"]["data_through"]["app_store"] is None
assert latest["website_totals"] == {
    "active_users": 41,
    "page_views": 77,
    "sessions": 60,
    "cta_clicks": 21,
}
print("PAYLOAD_OK content=127 yixiu_weekly=48 inserted=45 app_store=null")
PY

mkdir -p "$BACKUP_DIR/data"
for file in "${FILES[@]}"; do
  cp -a "$ROOT/$file" "$BACKUP_DIR/$file"
done

rollback() {
  for file in "${FILES[@]}"; do
    cp -a "$BACKUP_DIR/$file" "$ROOT/$file"
  done
  nginx -t
  echo "ROLLED_BACK"
  exit 1
}

for file in "${FILES[@]}"; do
  cp "$TEMP_DIR/$file" "$ROOT/$file"
  chmod 0644 "$ROOT/$file"
done

nginx -t || rollback
grep -q "20260829-yixiu-weekly-ledger" "$ROOT/index.html" || rollback
grep -q "const activityContentPageSize=10" "$ROOT/app.js" || rollback
grep -q '"id": "audit-yixiu-weekly-publications-20260829"' "$ROOT/data/state.json" || rollback
grep -q '"latest_date": "2026-08-28"' "$ROOT/data/brief.json" || rollback

for file in "${FILES[@]}"; do
  actual="$(sha256sum "$ROOT/$file" | cut -d' ' -f1)"
  test "$actual" = "${EXPECTED_SHA256[$file]}" || rollback
done

curl -kfsS --resolve "ops.wonderelian.com:443:127.0.0.1" https://ops.wonderelian.com/ \
  -o "$TEMP_DIR/loopback-index.html" || rollback
grep -q "20260829-yixiu-weekly-ledger" "$TEMP_DIR/loopback-index.html" || rollback
curl -kfsS --resolve "ops.wonderelian.com:443:127.0.0.1" https://ops.wonderelian.com/data/state.json \
  -o "$TEMP_DIR/loopback-state.json" || rollback
grep -q '"id": "audit-yixiu-weekly-publications-20260829"' "$TEMP_DIR/loopback-state.json" || rollback

echo "DEPLOY_OK_YIXIU_WEEKLY_LEDGER_20260829_A1279EF"
