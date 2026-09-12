#!/usr/bin/env bash
set -euo pipefail
readonly commit=b8a09bd6a7b733c9c98dfa51b3b2858d1353fed7
readonly site=/srv/wonderelian/ops.wonderelian.com
readonly stage=/srv/wonderelian/.ops-ga4-20260911
readonly backup=/srv/wonderelian/backups/ops-before-ga4-20260911
test ! -e "$stage"
test ! -e "$backup"
cp -a "$site" "$stage"
for file in state.json brief.json data-health.json; do
  curl --retry 2 --connect-timeout 10 --max-time 60 -fsSL "https://raw.githubusercontent.com/Yonge6/wonderelian-ai-coo-os/$commit/public/data/$file" -o "$stage/data/$file"
done
printf '%s  %s\n' \
 d8e52bdaa4d9b6cac180d8016aef172832fb5e3020b46efa3d2ca13446e2d637 "$stage/data/state.json" \
 50b50e27ac48db170b811585f9f29571fc44d2de611310e2f371a2d452ff27d1 "$stage/data/brief.json" \
 e24e3fa742ceb19fb9e6daf8e3af21991a3a7c07eda6a0aa9ea530fd96c5468e "$stage/data/data-health.json" | sha256sum -c -
jq -e '.metadata.data_through.website_analytics == "2026-09-11" and (.websites|length)==7' "$stage/data/state.json" >/dev/null
jq -e '.daily_portfolio.latest_date == "2026-09-11" and .daily_portfolio.days[-1].website_totals == {"active_users":25,"page_views":42,"sessions":29,"cta_clicks":5} and .daily_portfolio.cumulative[-1].website_totals == {"active_users":635,"page_views":2286,"sessions":1065,"cta_clicks":606}' "$stage/data/brief.json" >/dev/null
jq -e . "$stage/data/data-health.json" >/dev/null
chmod 0755 "$stage" "$stage/data"
chmod 0644 "$stage/data/"{state,brief,data-health}.json
nginx -t
cp -a "$site" "$backup"
exchange() {
  python3 -c 'import ctypes,sys; lib=ctypes.CDLL(None,use_errno=True); result=lib.renameat2(-100,sys.argv[1].encode(),-100,sys.argv[2].encode(),2); assert result==0,ctypes.get_errno()' "$site" "$stage"
}
exchange
if ! curl -fsS --resolve ops.wonderelian.com:443:127.0.0.1 https://ops.wonderelian.com/data/brief.json | jq -e '.daily_portfolio.latest_date == "2026-09-11" and .daily_portfolio.cumulative[-1].website_totals.active_users == 635' >/dev/null; then
  exchange
  echo ROLLED_BACK
  exit 1
fi
echo DEPLOY_OK_GA4_20260911
