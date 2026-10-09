#!/usr/bin/env bash
set -euo pipefail
readonly site=/srv/wonderelian/ops.wonderelian.com
readonly stage=/srv/wonderelian/.ops-data-20261009
readonly backup=/srv/wonderelian/backups/ops-before-data-20261009
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
 c79e67cd0e9a0d964c37b3e8805970f7669e2e3a37038a9af2f6cf744693b4b1 "$stage/state.json" \
 b1145d19a47f62936fa98724f56d69c8cc77675f60eb49735dcbaa05a111bf8e "$stage/brief.json" \
 280d96d71f0163cc30da1c0189f6057ac5918ca1490ef6c5d709ed1fbfb3cb32 "$stage/data-health.json" | sha256sum -c -
jq -e '.metadata.data_through.website_analytics=="2026-10-08" and (.websites|length)==7 and (.content|length)==240' "$stage/state.json" >/dev/null
jq -e '.daily_portfolio.website_latest_date=="2026-10-08" and .daily_portfolio.app_latest_date=="2026-09-21" and .daily_portfolio.days[-1].website_totals=={"active_users":12,"page_views":74,"sessions":21,"cta_clicks":null} and .daily_portfolio.cumulative[-1].website_totals=={"active_users":961,"page_views":3774,"sessions":1807,"cta_clicks":845}' "$stage/brief.json" >/dev/null
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
echo DEPLOY_OK_DATA_20261009
