#!/usr/bin/env bash
set -euo pipefail
readonly site=/srv/wonderelian/ops.wonderelian.com
readonly stage=/srv/wonderelian/.ops-data-20261005
readonly backup=/srv/wonderelian/backups/ops-before-data-20261005
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
 e4e6761ae6f38aff59cf6bc2ea43c3825b8707949a8a3b73b721490d8d139ce4 "$stage/state.json" \
 5f79967a03c6d850e70190c16d9d50648fd3daad7749391555e4e74924cfdd82 "$stage/brief.json" \
 ce01e8d169669b592eba0d13e9d1ecebb44e93b59549d1a8bfb3d36ff0efb4e4 "$stage/data-health.json" | sha256sum -c -
jq -e '.metadata.data_through.website_analytics=="2026-10-04" and (.websites|length)==7 and (.content|length)==232' "$stage/state.json" >/dev/null
jq -e '.daily_portfolio.website_latest_date=="2026-10-04" and .daily_portfolio.app_latest_date=="2026-09-21" and .daily_portfolio.days[-1].website_totals=={"active_users":4,"page_views":6,"sessions":9,"cta_clicks":null} and .daily_portfolio.cumulative[-1].website_totals=={"active_users":957,"page_views":3646,"sessions":1765,"cta_clicks":845}' "$stage/brief.json" >/dev/null
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
echo DEPLOY_OK_DATA_20261005
