#!/usr/bin/env bash
set -euo pipefail

readonly commit=56ec7f155b20343fa6c069b2b777de3bbfd72118
readonly site=/srv/wonderelian/ops.wonderelian.com
readonly stage=/srv/wonderelian/.ops-data-20260926
readonly backup=/srv/wonderelian/backups/ops-before-data-20260926
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
  curl -fsSL --connect-timeout 10 --max-time 120 "$base/$file.json" -o "$stage/data/$file.json"
  chmod 0644 "$stage/data/$file.json"
done

printf '%s  %s\n' \
  4042c3fd71449ed49581563493e86d3d6501a5005977df65c0d7c4f54de49061 "$stage/data/state.json" \
  af573ee27435c54f8af622b2e464b5b359744006ba7f9239f5e15e86f1946492 "$stage/data/brief.json" \
  509986763798034674dc7522eb6006d40807cbf397137ff961ea3e3700f3d242 "$stage/data/data-health.json" | sha256sum -c -

for file in state brief data-health feedback-analysis; do
  jq -e . "$stage/data/$file.json" >/dev/null
done
jq -e '.daily_portfolio.website_latest_date == "2026-09-25" and .daily_portfolio.app_latest_date == "2026-09-21"' "$stage/data/brief.json" >/dev/null
jq -e '.daily_portfolio.days[-1].website_totals == {"active_users":20,"page_views":27,"sessions":22,"cta_clicks":2}' "$stage/data/brief.json" >/dev/null
jq -e '.daily_portfolio.cumulative[-1].website_totals == {"active_users":883,"page_views":3284,"sessions":1592,"cta_clicks":778}' "$stage/data/brief.json" >/dev/null
jq -e '[.content[] | select(.published_at == "2026-09-25" and .status == "published" and ((.publish_url // .url // "") | length > 0))] | length == 4' "$stage/data/state.json" >/dev/null
nginx -t

exchange() {
  python3 -c 'import ctypes,sys; lib=ctypes.CDLL(None,use_errno=True); result=lib.renameat2(-100,sys.argv[1].encode(),-100,sys.argv[2].encode(),2); assert result==0,ctypes.get_errno()' "$site" "$stage"
}
exchange

if ! curl -fsS --resolve ops.wonderelian.com:443:127.0.0.1 https://ops.wonderelian.com/data/brief.json | jq -e '.daily_portfolio.website_latest_date == "2026-09-25" and .daily_portfolio.app_latest_date == "2026-09-21" and .daily_portfolio.days[-1].website_totals.active_users == 20 and .daily_portfolio.cumulative[-1].website_totals.active_users == 883' >/dev/null; then
  exchange
  echo ROLLED_BACK_DATA
  exit 1
fi

echo DEPLOY_OK_DATA_20260926
