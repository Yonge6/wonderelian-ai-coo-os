#!/usr/bin/env bash
set -euo pipefail
readonly commit=47016c1b41b73fc197961b5e076f796662e455ca
readonly site=/srv/wonderelian/ops.wonderelian.com
readonly stage=/srv/wonderelian/.ops-data-20261002
readonly backup=/srv/wonderelian/backups/ops-before-data-20261002
test -d "$site/data"
test ! -L "$stage" && test ! -L "$backup"
nginx -t
mkdir -p "$stage" "$backup"
frontend_before="$(sha256sum "$site/index.html" "$site/app.js" "$site/noesis.js" "$site/noesis.css" "$site/product-usage.js")"
for file in state brief data-health; do
 jq -e . "$site/data/$file.json" >/dev/null
 if test -e "$backup/$file.json"; then cmp -s "$site/data/$file.json" "$backup/$file.json"; else cp -p "$site/data/$file.json" "$backup/$file.json"; fi
 # Transferred over the existing SSH path from the exact pinned commit after
 # repeated GitHub-origin connection resets. Hash checks below are mandatory.
 test -f "$stage/$file.json" && test ! -L "$stage/$file.json"
 jq -e . "$stage/$file.json" >/dev/null
done
printf '%s  %s\n' \
 4cf644375cf9656ffdcc0c1d5cce5ccbc2d1bf6ee316f6c50d93b7c9d64f31cf "$stage/state.json" \
 4483f3b77726293f27f146fbb2b9767ed41be46ab53b3d9fb24329905b4d32be "$stage/brief.json" \
 49cbea3502cdf3eee19bfe531c8dc688d7230ff7b0b00fe15bb1f8b2111716e2 "$stage/data-health.json" | sha256sum -c -
jq -e '.metadata.data_through.website_analytics=="2026-10-01" and (.websites|length)==7' "$stage/state.json" >/dev/null
jq -e '.daily_portfolio.website_latest_date=="2026-10-01" and .daily_portfolio.app_latest_date=="2026-09-21" and .daily_portfolio.days[-1].website_totals=={"active_users":21,"page_views":97,"sessions":39,"cta_clicks":41} and .daily_portfolio.cumulative[-1].website_totals=={"active_users":937,"page_views":3549,"sessions":1703,"cta_clicks":834}' "$stage/brief.json" >/dev/null
rollback(){ for file in state brief data-health; do cp -p "$backup/$file.json" "$site/data/$file.json"; done; echo ROLLED_BACK_DATA; }
trap rollback ERR
for file in state brief data-health; do install -m 0644 "$stage/$file.json" "$site/data/$file.json.next"; mv "$site/data/$file.json.next" "$site/data/$file.json"; done
for file in state brief data-health; do
 expected="$(sha256sum "$stage/$file.json" | cut -d' ' -f1)"
 observed="$(curl -fsS --resolve ops.wonderelian.com:443:127.0.0.1 "https://ops.wonderelian.com/data/$file.json" | sha256sum | cut -d' ' -f1)"
 test "$expected" = "$observed"
done
test "$frontend_before" = "$(sha256sum "$site/index.html" "$site/app.js" "$site/noesis.js" "$site/noesis.css" "$site/product-usage.js")"
nginx -t
trap - ERR
echo DEPLOY_OK_DATA_20261002
