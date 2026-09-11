#!/usr/bin/env bash
set -euo pipefail
# Reviewed source: b70b81f68a38d3c0ba3d89f71cf0894834a75eaa (PR #103).
# Accepted archive SHA-256: 7d81b567b7706ff97d7042c1341c91abf31cd22fbac09b80826fdea7cbba1e5c.
site=/srv/wonderelian/ops.wonderelian.com
stage=/srv/wonderelian/.ops-cumulative-20260911
backup=/srv/wonderelian/backups/ops-before-cumulative-20260911-retry
archive=/tmp/ops-cumulative-20260911.tgz
test "$#" -eq 1
printf '%s  %s\n' "$1" "$archive" | sha256sum -c -
printf '%s  %s\n' 92c229c00b780f95de6fcfce5ff578d7eede28af5a7a06db930d7202d552759e "$site/data/state.json" | sha256sum -c -
test ! -e "$stage"
test ! -e "$backup"
cp -a "$site" "$stage"
tar -xzf "$archive" -C "$stage"
chmod 0755 "$stage" "$stage/data"
(cd "$stage" && sha256sum -c CUMULATIVE-SHA256SUMS)
jq -e '.daily_portfolio.cumulative[-1].website_totals == {"active_users":618,"page_views":2231,"sessions":1038,"cta_clicks":598}' "$stage/data/brief.json" >/dev/null
jq -e '.daily_portfolio.cumulative[-1].period_start == "2026-08-15" and .daily_portfolio.cumulative[-1].period_end == "2026-09-10"' "$stage/data/brief.json" >/dev/null
jq -e . "$stage/data/state.json" >/dev/null
jq -e . "$stage/data/data-health.json" >/dev/null
nginx -t
cp -a "$site" "$backup"
exchange() {
  python3 -c 'import ctypes,sys; lib=ctypes.CDLL(None,use_errno=True); result=lib.renameat2(-100,sys.argv[1].encode(),-100,sys.argv[2].encode(),2); assert result==0,ctypes.get_errno()' "$site" "$stage"
}
exchange
if ! curl -fsS --resolve ops.wonderelian.com:443:127.0.0.1 https://ops.wonderelian.com/data/brief.json | jq -e '.daily_portfolio.cumulative[-1].website_totals.active_users == 618' >/dev/null; then
  exchange
  echo 'ROLLED_BACK: origin acceptance failed' >&2
  exit 1
fi
echo 'DEPLOYED: cumulative totals verified; previous site backup retained'
