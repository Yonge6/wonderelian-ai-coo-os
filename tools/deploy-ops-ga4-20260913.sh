#!/usr/bin/env bash
set -euo pipefail
readonly commit=04d01732fd499ffee775b7aa8631099a9fd39e7e
readonly site=/srv/wonderelian/ops.wonderelian.com
readonly stage=/srv/wonderelian/.ops-ga4-20260913
readonly backup=/srv/wonderelian/backups/ops-before-ga4-20260913
test ! -e "$stage"
test ! -e "$backup"
cp -a "$site" "$stage"
for file in state.json brief.json data-health.json; do
  curl --retry 2 --connect-timeout 10 --max-time 60 -fsSL "https://raw.githubusercontent.com/Yonge6/wonderelian-ai-coo-os/$commit/public/data/$file" -o "$stage/data/$file"
done
printf '%s  %s\n' \
 c08b40e855e5359e69f3ef3c6adab597f75757ebf3b3a07710ff32b82058fce6 "$stage/data/state.json" \
 51e690d86c6caef2a49ea27c7a67f96af80e22003399792db02f38768747c61d "$stage/data/brief.json" \
 ee96110f71418b47fdfb805f06354cdb1c59439d8053960d65b2651d6baac32c "$stage/data/data-health.json" | sha256sum -c -
jq -e '.metadata.data_through.website_analytics == "2026-09-13" and (.websites|length)==7' "$stage/data/state.json" >/dev/null
jq -e '.daily_portfolio.latest_date == "2026-09-13" and .daily_portfolio.days[-1].website_totals == {"active_users":23,"page_views":66,"sessions":34,"cta_clicks":24} and .daily_portfolio.cumulative[-1].website_totals == {"active_users":669,"page_views":2427,"sessions":1138,"cta_clicks":641}' "$stage/data/brief.json" >/dev/null
jq -e . "$stage/data/data-health.json" >/dev/null
chmod 0755 "$stage" "$stage/data"
chmod 0644 "$stage/data/"{state,brief,data-health}.json
nginx -t
cp -a "$site" "$backup"
exchange() {
  python3 -c 'import ctypes,sys; lib=ctypes.CDLL(None,use_errno=True); result=lib.renameat2(-100,sys.argv[1].encode(),-100,sys.argv[2].encode(),2); assert result==0,ctypes.get_errno()' "$site" "$stage"
}
exchange
if ! curl -fsS --resolve ops.wonderelian.com:443:127.0.0.1 https://ops.wonderelian.com/data/brief.json | jq -e '.daily_portfolio.latest_date == "2026-09-13" and .daily_portfolio.cumulative[-1].website_totals.active_users == 669' >/dev/null; then
  exchange
  echo ROLLED_BACK
  exit 1
fi
echo DEPLOY_OK_GA4_20260913
