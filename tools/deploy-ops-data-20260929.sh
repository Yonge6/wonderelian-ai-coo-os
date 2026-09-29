#!/usr/bin/env bash
set -euo pipefail

readonly commit=b567850a5d8b30588d625a2bfb91b24b097acf28
readonly site=/srv/wonderelian/ops.wonderelian.com
readonly stage=/srv/wonderelian/.ops-data-20260929
readonly backup=/srv/wonderelian/backups/ops-before-data-20260929
readonly base="https://cdn.jsdelivr.net/gh/Yonge6/wonderelian-ai-coo-os@${commit}/public/data"

test -d "$site/data"
test ! -e "$stage"
test ! -e "$backup"
for file in state brief data-health feedback-analysis; do
  jq -e . "$site/data/$file.json" >/dev/null
done
nginx -t
cp -a "$site" "$backup"
cp -a "$site" "$stage"

for file in state brief data-health; do
  curl -fsSL --retry 3 --retry-all-errors --connect-timeout 10 --max-time 120 \
    "$base/$file.json" -o "$stage/data/$file.json"
  chmod 0644 "$stage/data/$file.json"
done

printf '%s  %s\n' \
  be903feac82c67bf3bf3d523a8b81f023f636fb8d717e05c90b31fe951ae8ac1 "$stage/data/state.json" \
  0973152e3cd7002d594633a4ed169dfff4aa40350139ab3c7e2f265c3f2cd1fd "$stage/data/brief.json" \
  7f0940b0ce658fa9eac1f2e9f819f737411873b9fcb7d297d90d938ccd705905 "$stage/data/data-health.json" | sha256sum -c -

for file in state brief data-health feedback-analysis; do
  jq -e . "$stage/data/$file.json" >/dev/null
done
jq -e '.metadata.data_through.website_analytics == "2026-09-28" and (.websites | length) == 7 and (.content | length) == 217' "$stage/data/state.json" >/dev/null
jq -e '[.content[] | select(.published_at == "2026-09-28" and .status == "published" and ((.publish_url // .url // "") | length > 0))] | length == 3' "$stage/data/state.json" >/dev/null
jq -e '.daily_portfolio.website_latest_date == "2026-09-28" and .daily_portfolio.app_latest_date == "2026-09-21"' "$stage/data/brief.json" >/dev/null
jq -e '.daily_portfolio.days[-1].website_totals == {"active_users":16,"page_views":25,"sessions":22,"cta_clicks":2}' "$stage/data/brief.json" >/dev/null
jq -e '.daily_portfolio.cumulative[-1].website_totals == {"active_users":918,"page_views":3383,"sessions":1655,"cta_clicks":781}' "$stage/data/brief.json" >/dev/null
for file in index.html app.js styles.css dashboard-model.js; do
  cmp "$site/$file" "$stage/$file"
done
nginx -t

exchange() {
  python3 -c 'import ctypes,sys; lib=ctypes.CDLL(None,use_errno=True); result=lib.renameat2(-100,sys.argv[1].encode(),-100,sys.argv[2].encode(),2); assert result==0,ctypes.get_errno()' "$site" "$stage"
}
exchange

if ! curl -fsS --resolve ops.wonderelian.com:443:127.0.0.1 https://ops.wonderelian.com/data/brief.json \
  | jq -e '.daily_portfolio.website_latest_date == "2026-09-28" and .daily_portfolio.app_latest_date == "2026-09-21" and .daily_portfolio.days[-1].website_totals == {"active_users":16,"page_views":25,"sessions":22,"cta_clicks":2} and .daily_portfolio.cumulative[-1].website_totals == {"active_users":918,"page_views":3383,"sessions":1655,"cta_clicks":781}' >/dev/null; then
  exchange
  echo ROLLED_BACK_DATA
  exit 1
fi

echo DEPLOY_OK_DATA_20260929
