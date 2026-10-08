#!/usr/bin/env bash
set -euo pipefail
readonly site=/srv/wonderelian/ops.wonderelian.com
readonly stage=/srv/wonderelian/.ops-data-20261008
readonly backup=/srv/wonderelian/backups/ops-before-data-20261008
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
 ce7e6e523a851f8cd51e47d8205cc1cb62c5596b77b1f1749d514ecdba4419bc "$stage/state.json" \
 a50e2e0929f7f7c78a965ea6ebcc0bf556f2bc240a76508e09baa9f7d006ab50 "$stage/brief.json" \
 101879911f94f58c86b21a28eba6e1453b2ce66b5f778569bc5693f2bcb333bd "$stage/data-health.json" | sha256sum -c -
jq -e '.metadata.data_through.website_analytics=="2026-10-07" and (.websites|length)==7 and (.content|length)==238' "$stage/state.json" >/dev/null
jq -e '.daily_portfolio.website_latest_date=="2026-10-07" and .daily_portfolio.app_latest_date=="2026-09-21" and .daily_portfolio.days[-1].website_totals=={"active_users":4,"page_views":15,"sessions":8,"cta_clicks":null} and .daily_portfolio.cumulative[-1].website_totals=={"active_users":958,"page_views":3696,"sessions":1788,"cta_clicks":845}' "$stage/brief.json" >/dev/null
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
echo DEPLOY_OK_DATA_20261008
