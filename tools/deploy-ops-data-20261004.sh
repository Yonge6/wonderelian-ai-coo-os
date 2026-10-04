#!/usr/bin/env bash
set -euo pipefail
readonly site=/srv/wonderelian/ops.wonderelian.com
readonly stage=/srv/wonderelian/.ops-data-20261004
readonly backup=/srv/wonderelian/backups/ops-before-data-20261004
test -d "$site/data"
test ! -L "$stage" && test ! -L "$backup"
nginx -t
mkdir -p "$stage" "$backup"
frontend_before="$(sha256sum "$site/index.html" "$site/app.js" "$site/noesis.js" "$site/noesis.css" "$site/product-usage.js" "$site/web-project-usage.js")"
for file in state brief data-health; do
 jq -e . "$site/data/$file.json" >/dev/null
 if test -e "$backup/$file.json"; then cmp -s "$site/data/$file.json" "$backup/$file.json"; else cp -p "$site/data/$file.json" "$backup/$file.json"; fi
 test -f "$stage/$file.json" && test ! -L "$stage/$file.json"
 jq -e . "$stage/$file.json" >/dev/null
done
printf '%s  %s\n' \
 560e231d7a80e803fa7702f83a12dc3ead84aac478449d8344cef879e23ab603 "$stage/state.json" \
 4ac4cccc428409872ff6629f28d85554b9f4ec7e2bbe54a46713af4fa84a2d81 "$stage/brief.json" \
 031e99d10ed75db34f3fcd3b035b678fad328fa0bceb690de51aac9de3a6e5b3 "$stage/data-health.json" | sha256sum -c -
jq -e '.metadata.data_through.website_analytics=="2026-10-03" and (.websites|length)==7 and (.content|length)==229' "$stage/state.json" >/dev/null
jq -e '.daily_portfolio.website_latest_date=="2026-10-03" and .daily_portfolio.app_latest_date=="2026-09-21" and .daily_portfolio.days[-1].website_totals=={"active_users":14,"page_views":20,"sessions":18,"cta_clicks":1} and .daily_portfolio.cumulative[-1].website_totals=={"active_users":956,"page_views":3639,"sessions":1756,"cta_clicks":845}' "$stage/brief.json" >/dev/null
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
echo DEPLOY_OK_DATA_20261004
