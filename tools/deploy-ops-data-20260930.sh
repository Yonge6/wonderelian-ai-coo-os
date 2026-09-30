#!/usr/bin/env bash
set -euo pipefail

readonly commit=55f5f6e151124f73e4999fde5e24401e763e5515
readonly site=/srv/wonderelian/ops.wonderelian.com
readonly stage=/srv/wonderelian/.ops-data-20260930
readonly backup=/srv/wonderelian/backups/ops-before-data-20260930
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
  53ff168af5ab69dc67a4428261538949a13796f724e3764a7aa24ac1092328b7 "$stage/data/state.json" \
  72fb9f669ae997cd792915b371a31a38a49a1198ca82fd8538064cac6f22dba8 "$stage/data/brief.json" \
  7f786cbcfe68c1c3e7e4e5587ce34827b92467d4062970204927c696ef89968e "$stage/data/data-health.json" | sha256sum -c -

for file in state brief data-health feedback-analysis; do
  jq -e . "$stage/data/$file.json" >/dev/null
done
jq -e '.metadata.data_through.website_analytics == "2026-09-29" and (.websites | length) == 7 and (.content | length) == 221' "$stage/data/state.json" >/dev/null
jq -e '([.content[] | select(.published_at == "2026-09-29" and .status == "published" and ((.publish_url // .url // "") | length > 0))] | length) == 4' "$stage/data/state.json" >/dev/null
jq -e '.daily_portfolio.website_latest_date == "2026-09-29" and .daily_portfolio.app_latest_date == "2026-09-21"' "$stage/data/brief.json" >/dev/null
jq -e '.daily_portfolio.days[-1].website_totals == {"active_users":22,"page_views":48,"sessions":30,"cta_clicks":3}' "$stage/data/brief.json" >/dev/null
jq -e '.daily_portfolio.cumulative[-1].website_totals == {"active_users":934,"page_views":3433,"sessions":1685,"cta_clicks":784}' "$stage/data/brief.json" >/dev/null
for file in index.html app.js styles.css dashboard-model.js; do
  cmp "$site/$file" "$stage/$file"
done
nginx -t

exchange() {
  python3 -c 'import ctypes,sys; lib=ctypes.CDLL(None,use_errno=True); result=lib.renameat2(-100,sys.argv[1].encode(),-100,sys.argv[2].encode(),2); assert result==0,ctypes.get_errno()' "$site" "$stage"
}
exchange

if ! curl -fsS --resolve ops.wonderelian.com:443:127.0.0.1 https://ops.wonderelian.com/data/brief.json \
  | jq -e '.daily_portfolio.website_latest_date == "2026-09-29" and .daily_portfolio.app_latest_date == "2026-09-21" and .daily_portfolio.days[-1].website_totals == {"active_users":22,"page_views":48,"sessions":30,"cta_clicks":3} and .daily_portfolio.cumulative[-1].website_totals == {"active_users":934,"page_views":3433,"sessions":1685,"cta_clicks":784}' >/dev/null; then
  exchange
  echo ROLLED_BACK_DATA
  exit 1
fi

echo DEPLOY_OK_DATA_20260930
