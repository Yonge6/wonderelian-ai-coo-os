#!/usr/bin/env bash
set -euo pipefail

readonly commit=32bd8d451ec5e03b69cf381ca981ad04405680b2
readonly site=/srv/wonderelian/ops.wonderelian.com
readonly stage=/srv/wonderelian/.ops-app-data-20261001
readonly backup=/srv/wonderelian/backups/ops-before-app-data-20261001
readonly base="https://raw.githubusercontent.com/Yonge6/wonderelian-ai-coo-os/${commit}/public/data"

test -d "$site/data"
test ! -e "$stage"
test ! -e "$backup"
mkdir -p "$stage" "$backup"

for file in state brief data-health; do
  jq -e . "$site/data/$file.json" >/dev/null
  cp -p "$site/data/$file.json" "$backup/$file.json"
done

frontend_before="$(sha256sum "$site/index.html" "$site/app.js" "$site/styles.css")"
nginx -t

for file in state brief data-health; do
  curl -fsSL --retry 3 --retry-all-errors --connect-timeout 10 --max-time 120 \
    "$base/$file.json" -o "$stage/$file.json"
  chmod 0644 "$stage/$file.json"
done

printf '%s  %s\n' \
  46623fb992b1b8e4ba2ee2e24ef13f3fecc758bd797b04fe1466a31f4e983c7f "$stage/state.json" \
  f409430866d7ca0c811f5f7a0d721d82a0499377bfde3afde13cc7cb0807507a "$stage/brief.json" \
  dca6c1c1dcba77e6f488e1c28173bc48b72a5f8f3bd46156487ab7cbbf5ce4d9 "$stage/data-health.json" | sha256sum -c -

jq -e '.metadata.data_through.website_analytics == "2026-09-30" and .metadata.data_through.app_store_sales == "2026-09-30"' "$stage/state.json" >/dev/null
jq -e '([.app_store_sales_snapshots[] | select(.id == "app-store-sales-2026-09-30" and .totals.app_units == 72 and .totals.in_app_purchase_units == 2 and .totals.sales_amount == 1.77)] | length) == 1' "$stage/state.json" >/dev/null
jq -e '([.app_store_sales_snapshots[] | select(.id == "app-store-sales-2026-09-30")][0].financial | .estimated_total_proceeds == 11.41 and .currency == "CNY")' "$stage/state.json" >/dev/null
jq -e '.daily_portfolio.website_latest_date == "2026-09-30" and .daily_portfolio.app_latest_date == "2026-09-21"' "$stage/brief.json" >/dev/null

rollback() {
  for file in state brief data-health; do
    cp -p "$backup/$file.json" "$site/data/$file.json"
  done
  echo ROLLED_BACK_APP_DATA
}
trap rollback ERR

for file in state brief data-health; do
  install -m 0644 "$stage/$file.json" "$site/data/$file.json.next"
  mv "$site/data/$file.json.next" "$site/data/$file.json"
done

for file in state brief data-health; do
  expected="$(sha256sum "$stage/$file.json" | cut -d' ' -f1)"
  observed="$(curl -fsS --resolve ops.wonderelian.com:443:127.0.0.1 "https://ops.wonderelian.com/data/$file.json" | sha256sum | cut -d' ' -f1)"
  test "$observed" = "$expected"
done

test "$frontend_before" = "$(sha256sum "$site/index.html" "$site/app.js" "$site/styles.css")"
nginx -t
trap - ERR
echo DEPLOY_OK_APP_DATA_20261001
