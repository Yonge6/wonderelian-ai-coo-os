#!/usr/bin/env bash
set -euo pipefail

readonly commit=e33f37facc601f2d699c5e8446767e8030fb06eb
readonly site=/srv/wonderelian/ops.wonderelian.com
readonly stage=/srv/wonderelian/.ops-data-20260924-retry1
readonly backup=/srv/wonderelian/backups/ops-before-data-20260924-retry1
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
  debeeeee27f2375a7b1d8065355d235da765ad9296fd3df74dabd05050c017fd "$stage/data/state.json" \
  c669c7f673e25f4113c4b012c90e34e95bdf13bdb25598a58a05318c4317b150 "$stage/data/brief.json" \
  a9e8f4c85695d48566be8ffa0d71897691fc7a4392778b76c6969d20b91272cd "$stage/data/data-health.json" | sha256sum -c -

for file in state brief data-health feedback-analysis; do
  jq -e . "$stage/data/$file.json" >/dev/null
done
jq -e '.daily_portfolio.website_latest_date == "2026-09-23" and .daily_portfolio.app_latest_date == "2026-09-21"' "$stage/data/brief.json" >/dev/null
jq -e '[.content[] | select(.published_at == "2026-09-23" and .status == "published" and ((.publish_url // .url // "") | length > 0))] | length >= 28' "$stage/data/state.json" >/dev/null
nginx -t

exchange() {
  python3 -c 'import ctypes,sys; lib=ctypes.CDLL(None,use_errno=True); result=lib.renameat2(-100,sys.argv[1].encode(),-100,sys.argv[2].encode(),2); assert result==0,ctypes.get_errno()' "$site" "$stage"
}
exchange

if ! curl -fsS --resolve ops.wonderelian.com:443:127.0.0.1 https://ops.wonderelian.com/data/brief.json | jq -e '.daily_portfolio.website_latest_date == "2026-09-23" and .daily_portfolio.app_latest_date == "2026-09-21"' >/dev/null; then
  exchange
  echo ROLLED_BACK_DATA
  exit 1
fi

echo DEPLOY_OK_DATA_20260924
