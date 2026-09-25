#!/usr/bin/env bash
set -euo pipefail

readonly commit=58423bf239b8fdb020db6c953748a2e70bc87b55
readonly site=/srv/wonderelian/ops.wonderelian.com
readonly stage=/srv/wonderelian/.ops-data-20260925
readonly backup=/srv/wonderelian/backups/ops-before-data-20260925
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
  a645c4a2411f25f2f0acba04660c85345040e6fa43bf6b7230db3ef33584fbd7 "$stage/data/state.json" \
  7d013ae7e4b2760c43ff64985d41f68d5781e23db9efb6133ad3d0ec8eb969c8 "$stage/data/brief.json" \
  9600676723d4174b957ee6a53fd023c1cba1a3fa6f2dede070475b328f27d358 "$stage/data/data-health.json" | sha256sum -c -

for file in state brief data-health feedback-analysis; do
  jq -e . "$stage/data/$file.json" >/dev/null
done
jq -e '.daily_portfolio.website_latest_date == "2026-09-24" and .daily_portfolio.app_latest_date == "2026-09-21"' "$stage/data/brief.json" >/dev/null
jq -e '.daily_portfolio.days[-1].website_totals == {"active_users":21,"page_views":63,"sessions":30,"cta_clicks":11}' "$stage/data/brief.json" >/dev/null
jq -e '.daily_portfolio.cumulative[-1].website_totals == {"active_users":867,"page_views":3255,"sessions":1568,"cta_clicks":776}' "$stage/data/brief.json" >/dev/null
jq -e '[.content[] | select(.published_at == "2026-09-24" and .status == "published" and ((.publish_url // .url // "") | length > 0))] | length == 4' "$stage/data/state.json" >/dev/null
nginx -t

exchange() {
  python3 -c 'import ctypes,sys; lib=ctypes.CDLL(None,use_errno=True); result=lib.renameat2(-100,sys.argv[1].encode(),-100,sys.argv[2].encode(),2); assert result==0,ctypes.get_errno()' "$site" "$stage"
}
exchange

if ! curl -fsS --resolve ops.wonderelian.com:443:127.0.0.1 https://ops.wonderelian.com/data/brief.json | jq -e '.daily_portfolio.website_latest_date == "2026-09-24" and .daily_portfolio.app_latest_date == "2026-09-21" and .daily_portfolio.days[-1].website_totals.active_users == 21 and .daily_portfolio.cumulative[-1].website_totals.active_users == 867' >/dev/null; then
  exchange
  echo ROLLED_BACK_DATA
  exit 1
fi

echo DEPLOY_OK_DATA_20260925
