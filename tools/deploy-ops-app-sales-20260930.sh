#!/usr/bin/env bash
set -euo pipefail

readonly commit=e968b8ac707819a706efe65038e95245ed2f0619
readonly site=/srv/wonderelian/ops.wonderelian.com
readonly stage=/srv/wonderelian/.ops-app-sales-20260930
readonly backup=/srv/wonderelian/backups/ops-before-app-sales-20260930
readonly base="https://cdn.jsdelivr.net/gh/Yonge6/wonderelian-ai-coo-os@${commit}/public"

test -d "$site/data"
test ! -e "$stage"
test ! -e "$backup"
for file in state brief data-health feedback-analysis; do
  jq -e . "$site/data/$file.json" >/dev/null
done
nginx -t
cp -a "$site" "$backup"
cp -a "$site" "$stage"

files=(index.html app.js styles.css data/state.json data/brief.json data/data-health.json)
for file in "${files[@]}"; do
  curl -fsSL --retry 3 --retry-all-errors --connect-timeout 10 --max-time 120 \
    "$base/$file" -o "$stage/$file"
  chmod 0644 "$stage/$file"
done

printf '%s  %s\n' \
  b221563ef66dbae32bfefde2708c8d08ef4ad5ff031bbf7f479d220e4e6cd1a7 "$stage/index.html" \
  db26fa48434c4f5b994f5912e9fd8a9e6129bcc27710740d16fd7cbda4f23533 "$stage/app.js" \
  18ede84e07f40318cc6a1a5658372ee0d8a7fe86d09bad5ff1efe73d3619a414 "$stage/styles.css" \
  335e0405e35817318b0051fcd746bd5d80fa22acd4212a41b71f7b1bff20bd "$stage/data/state.json" \
  5c90553ce933564fc8bd4d22db3a48676edb7e908780c0aeca7a36e969c1ef6f "$stage/data/brief.json" \
  aa3a26391c0ec86c2e6dbbfbb1ea28e2315048df81518688423ec77d0f49932d "$stage/data/data-health.json" | sha256sum -c -

for file in state brief data-health feedback-analysis; do
  jq -e . "$stage/data/$file.json" >/dev/null
done
jq -e '.app_store_sales_snapshots[-1].period_end == "2026-09-29" and .app_store_sales_snapshots[-1].totals.app_units == 78 and .app_store_sales_snapshots[-1].totals.in_app_purchase_units == 2 and .app_store_sales_snapshots[-1].financial.matched_app_id == "wendao" and .app_store_sales_snapshots[-1].financial.estimated_total_proceeds == 11.41' "$stage/data/state.json" >/dev/null
grep -q '20260930-app-sales' "$stage/index.html"
grep -q 'App Store 销售快照' "$stage/app.js"
nginx -t

exchange() {
  python3 -c 'import ctypes,sys; lib=ctypes.CDLL(None,use_errno=True); result=lib.renameat2(-100,sys.argv[1].encode(),-100,sys.argv[2].encode(),2); assert result==0,ctypes.get_errno()' "$site" "$stage"
}
exchange

if ! curl -fsS --resolve ops.wonderelian.com:443:127.0.0.1 https://ops.wonderelian.com/ | grep -q '20260930-app-sales'; then
  exchange
  echo ROLLED_BACK_HTML
  exit 1
fi
if ! curl -fsS --resolve ops.wonderelian.com:443:127.0.0.1 https://ops.wonderelian.com/data/state.json \
  | jq -e '.app_store_sales_snapshots[-1].totals.app_units == 78 and .app_store_sales_snapshots[-1].financial.matched_product == "Wendao Complete Reading Lifetime" and .app_store_sales_snapshots[-1].financial.estimated_total_proceeds == 11.41' >/dev/null; then
  exchange
  echo ROLLED_BACK_DATA
  exit 1
fi

echo DEPLOY_OK_APP_SALES_20260930
