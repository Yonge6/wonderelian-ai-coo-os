#!/usr/bin/env bash
set -euo pipefail
readonly site=/srv/wonderelian/ops.wonderelian.com
readonly stage=/srv/wonderelian/.ops-data-20261010
readonly backup=/srv/wonderelian/backups/ops-before-data-20261010
test -d "$site/data"
test ! -L "$stage" && test ! -L "$backup"
nginx -t
mkdir -p "$backup"
frontend_before="$(sha256sum "$site/index.html" "$site/app.js" "$site/noesis.js" "$site/noesis.css" "$site/product-usage.js" "$site/web-project-usage.js")"
for file in state brief data-health; do
 jq -e . "$site/data/$file.json" >/dev/null
 if test -e "$backup/$file.json"; then cmp -s "$site/data/$file.json" "$backup/$file.json"; else cp -p "$site/data/$file.json" "$backup/$file.json"; fi
 test -f "$stage/$file.json" && test ! -L "$stage/$file.json"
 jq -e . "$stage/$file.json" >/dev/null
done
printf '%s  %s\n' \
 850af4f801cc216bc311fb1894ad21ce9e435dee52c31219c1240e7d72d5942b "$stage/state.json" \
 449bd3de9c9c42810349826788fc4d2fa19d1f5dc172444d650209daeb6b37f9 "$stage/brief.json" \
 d182313b419498527319199b0505d4f9e22b1912155ea2acd456b31d31a3cc58 "$stage/data-health.json" | sha256sum -c -
jq -e '.metadata.data_through.website_analytics=="2026-10-09" and (.websites|length)==7 and (.content|length)==242' "$stage/state.json" >/dev/null
jq -e '.daily_portfolio.website_latest_date=="2026-10-09" and .daily_portfolio.app_latest_date=="2026-09-21" and .daily_portfolio.days[-1].website_totals=={"active_users":7,"page_views":36,"sessions":15,"cta_clicks":1} and .daily_portfolio.cumulative[-1].website_totals=={"active_users":961,"page_views":3810,"sessions":1823,"cta_clicks":846}' "$stage/brief.json" >/dev/null
rollback(){ for file in state brief data-health; do cp -p "$backup/$file.json" "$site/data/$file.json"; done; echo ROLLED_BACK_DATA; }
trap rollback ERR
for file in state brief data-health; do install -m 0644 "$stage/$file.json" "$site/data/$file.json.next"; mv "$site/data/$file.json.next" "$site/data/$file.json"; done
for file in state brief data-health; do
 expected="$(sha256sum "$stage/$file.json" | cut -d' ' -f1)"
 observed="$(curl -fsS --resolve ops.wonderelian.com:443:127.0.0.1 "https://ops.wonderelian.com/data/$file.json" | sha256sum | cut -d' ' -f1)"
 test "$expected" = "$observed"
done
test "$frontend_before" = "$(sha256sum "$site/index.html" "$site/app.js" "$site/noesis.js" "$site/noesis.css" "$site/product-usage.js" "$site/web-project-usage.js")"
nginx -t
trap - ERR
echo DEPLOY_OK_DATA_20261010
