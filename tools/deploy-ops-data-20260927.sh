#!/usr/bin/env bash
set -euo pipefail

readonly commit=c561d8c73d347c382196cbcaf9e81d4f91c5eb82
readonly site=/srv/wonderelian/ops.wonderelian.com
readonly stage=/srv/wonderelian/.ops-data-20260927
readonly backup=/srv/wonderelian/backups/ops-before-data-20260927
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
  2939849912baee155e797c301211df6c100987920f122aaef8fadcfa1df1dfbe "$stage/data/state.json" \
  ac3f2f79517cb52fc8aef0b7b547c1f452fc12261c4b3306512ad00c30f98d9a "$stage/data/brief.json" \
  85a1f9dfcc9c7163bd52d729571ed65ac0a97a88393e92f810145b9fc2f3fe64 "$stage/data/data-health.json" | sha256sum -c -

for file in state brief data-health feedback-analysis; do
  jq -e . "$stage/data/$file.json" >/dev/null
done
jq -e '.metadata.data_through.website_analytics == "2026-09-26" and (.websites | length) == 7' "$stage/data/state.json" >/dev/null
jq -e '.daily_portfolio.website_latest_date == "2026-09-26" and .daily_portfolio.app_latest_date == "2026-09-21"' "$stage/data/brief.json" >/dev/null
jq -e '.daily_portfolio.days[-1].website_totals == {"active_users":12,"page_views":11,"sessions":15,"cta_clicks":null}' "$stage/data/brief.json" >/dev/null
jq -e '.daily_portfolio.cumulative[-1].website_totals == {"active_users":894,"page_views":3296,"sessions":1608,"cta_clicks":778}' "$stage/data/brief.json" >/dev/null
jq -e '[.content[] | select(.published_at == "2026-09-26" and .status == "published" and ((.publish_url // .url // "") | length > 0))] | length == 4' "$stage/data/state.json" >/dev/null
for file in index.html app.js styles.css dashboard-model.js; do
  cmp "$site/$file" "$stage/$file"
done
nginx -t

exchange() {
  python3 -c 'import ctypes,sys; lib=ctypes.CDLL(None,use_errno=True); result=lib.renameat2(-100,sys.argv[1].encode(),-100,sys.argv[2].encode(),2); assert result==0,ctypes.get_errno()' "$site" "$stage"
}
exchange

if ! curl -fsS --resolve ops.wonderelian.com:443:127.0.0.1 https://ops.wonderelian.com/data/brief.json \
  | jq -e '.daily_portfolio.website_latest_date == "2026-09-26" and .daily_portfolio.app_latest_date == "2026-09-21" and .daily_portfolio.days[-1].website_totals.active_users == 12 and .daily_portfolio.days[-1].website_totals.cta_clicks == null and .daily_portfolio.cumulative[-1].website_totals.active_users == 894' >/dev/null; then
  exchange
  echo ROLLED_BACK_DATA
  exit 1
fi

echo DEPLOY_OK_DATA_20260927
