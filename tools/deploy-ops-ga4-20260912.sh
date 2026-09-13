#!/usr/bin/env bash
set -euo pipefail
readonly commit=0bfb435e6786bc00e430e56c632455de0067d662
readonly site=/srv/wonderelian/ops.wonderelian.com
readonly stage=/srv/wonderelian/.ops-ga4-20260912
readonly backup=/srv/wonderelian/backups/ops-before-ga4-20260912
test ! -e "$stage"
test ! -e "$backup"
cp -a "$site" "$stage"
for file in state.json brief.json data-health.json; do
  curl --retry 2 --connect-timeout 10 --max-time 60 -fsSL "https://raw.githubusercontent.com/Yonge6/wonderelian-ai-coo-os/$commit/public/data/$file" -o "$stage/data/$file"
done
printf '%s  %s\n' \
 aad141b58a7da8d2b3ce571f5154198fe7ba5ec7d65d5d59cea55196f556d075 "$stage/data/state.json" \
 7a2bced694b3b38384a85d5885636c8eead8b55eb0e62cfb002fe2722aed2963 "$stage/data/brief.json" \
 9cc0bb535c3ef9e29526ac0540c9ed6e282e18a7bdca16a159bf9db20b9f146a "$stage/data/data-health.json" | sha256sum -c -
jq -e '.metadata.data_through.website_analytics == "2026-09-12" and (.websites|length)==7' "$stage/data/state.json" >/dev/null
jq -e '.daily_portfolio.latest_date == "2026-09-12" and .daily_portfolio.days[-1].website_totals == {"active_users":23,"page_views":55,"sessions":38,"cta_clicks":10} and .daily_portfolio.cumulative[-1].website_totals == {"active_users":650,"page_views":2350,"sessions":1104,"cta_clicks":617}' "$stage/data/brief.json" >/dev/null
jq -e . "$stage/data/data-health.json" >/dev/null
chmod 0755 "$stage" "$stage/data"
chmod 0644 "$stage/data/"{state,brief,data-health}.json
nginx -t
cp -a "$site" "$backup"
exchange() {
  python3 -c 'import ctypes,sys; lib=ctypes.CDLL(None,use_errno=True); result=lib.renameat2(-100,sys.argv[1].encode(),-100,sys.argv[2].encode(),2); assert result==0,ctypes.get_errno()' "$site" "$stage"
}
exchange
if ! curl -fsS --resolve ops.wonderelian.com:443:127.0.0.1 https://ops.wonderelian.com/data/brief.json | jq -e '.daily_portfolio.latest_date == "2026-09-12" and .daily_portfolio.cumulative[-1].website_totals.active_users == 650' >/dev/null; then
  exchange
  echo ROLLED_BACK
  exit 1
fi
echo DEPLOY_OK_GA4_20260912
