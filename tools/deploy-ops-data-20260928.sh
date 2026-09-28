#!/usr/bin/env bash
set -euo pipefail

readonly commit=24aaec8706c6e74d483019fabace8c0cf12b3472
readonly site=/srv/wonderelian/ops.wonderelian.com
readonly stage=/srv/wonderelian/.ops-data-20260928
readonly backup=/srv/wonderelian/backups/ops-before-data-20260928
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
  b6af92c807e81eecab7d4a8cb261ec7c9df91bf49d69e43b78587b1cf6c910ae "$stage/data/state.json" \
  20bf22ceb37a4dbccf65a285df586a075be38d8371de3d166779045f4ad779c3 "$stage/data/brief.json" \
  d2caf8cceacf3e7fcae38df50c993011d8e39967725f494e068d5771ae137b27 "$stage/data/data-health.json" | sha256sum -c -

for file in state brief data-health feedback-analysis; do
  jq -e . "$stage/data/$file.json" >/dev/null
done
jq -e '.metadata.data_through.website_analytics == "2026-09-27" and (.websites | length) == 7 and (.content | length) == 214' "$stage/data/state.json" >/dev/null
jq -e '.daily_portfolio.website_latest_date == "2026-09-27" and .daily_portfolio.app_latest_date == "2026-09-21"' "$stage/data/brief.json" >/dev/null
jq -e '.daily_portfolio.days[-1].website_totals == {"active_users":16,"page_views":23,"sessions":21,"cta_clicks":1}' "$stage/data/brief.json" >/dev/null
jq -e '.daily_portfolio.cumulative[-1].website_totals == {"active_users":908,"page_views":3357,"sessions":1635,"cta_clicks":779}' "$stage/data/brief.json" >/dev/null
for file in index.html app.js styles.css dashboard-model.js; do
  cmp "$site/$file" "$stage/$file"
done
nginx -t

exchange() {
  python3 -c 'import ctypes,sys; lib=ctypes.CDLL(None,use_errno=True); result=lib.renameat2(-100,sys.argv[1].encode(),-100,sys.argv[2].encode(),2); assert result==0,ctypes.get_errno()' "$site" "$stage"
}
exchange

if ! curl -fsS --resolve ops.wonderelian.com:443:127.0.0.1 https://ops.wonderelian.com/data/brief.json \
  | jq -e '.daily_portfolio.website_latest_date == "2026-09-27" and .daily_portfolio.app_latest_date == "2026-09-21" and .daily_portfolio.days[-1].website_totals == {"active_users":16,"page_views":23,"sessions":21,"cta_clicks":1} and .daily_portfolio.cumulative[-1].website_totals.active_users == 908' >/dev/null; then
  exchange
  echo ROLLED_BACK_DATA
  exit 1
fi

echo DEPLOY_OK_DATA_20260928
