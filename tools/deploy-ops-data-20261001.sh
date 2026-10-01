#!/usr/bin/env bash
set -euo pipefail

readonly commit=d9a056cd067c8482fda29dd0d55d698c79069256
readonly site=/srv/wonderelian/ops.wonderelian.com
readonly stage=/srv/wonderelian/.ops-data-20261001
readonly backup=/srv/wonderelian/backups/ops-before-data-20261001
readonly base="https://raw.githubusercontent.com/Yonge6/wonderelian-ai-coo-os/${commit}/public/data"

test -d "$site/data"
test ! -e "$stage"
test ! -e "$backup"
mkdir -p "$stage" "$backup"

for file in state brief data-health; do
  jq -e . "$site/data/$file.json" >/dev/null
  cp -p "$site/data/$file.json" "$backup/$file.json"
done

frontend_before="$(sha256sum "$site/index.html" "$site/app.js" "$site/styles.css")"
nginx -t

for file in state brief data-health; do
  curl -fsSL --retry 3 --retry-all-errors --connect-timeout 10 --max-time 120 \
    "$base/$file.json" -o "$stage/$file.json"
  chmod 0644 "$stage/$file.json"
done

printf '%s  %s\n' \
  1c734c55c1f4a6bb99b417b364d08484f7f339a50c469a12f2c12bd6926d86ce "$stage/state.json" \
  37f6415539e38bd764d8c5a3060495070eea701afe80d941666d6e060c2cb722 "$stage/brief.json" \
  675f19424d03e6baf75176cc77fa49b9a700096a5676eae8c8b24179db607b99 "$stage/data-health.json" | sha256sum -c -

jq -e '.metadata.data_through.website_analytics == "2026-09-30" and (.websites | length) == 7 and (.content | length) == 225' "$stage/state.json" >/dev/null
jq -e '([.content[] | select(.published_at == "2026-09-30" and .status == "published" and ((.publish_url // .url // "") | length > 0))] | length) == 4' "$stage/state.json" >/dev/null
jq -e '.daily_portfolio.website_latest_date == "2026-09-30" and .daily_portfolio.app_latest_date == "2026-09-21"' "$stage/brief.json" >/dev/null
jq -e '.daily_portfolio.days[-1].website_totals == {"active_users":18,"page_views":32,"sessions":29,"cta_clicks":6}' "$stage/brief.json" >/dev/null
jq -e '.daily_portfolio.cumulative[-1].website_totals == {"active_users":946,"page_views":3501,"sessions":1718,"cta_clicks":792}' "$stage/brief.json" >/dev/null

rollback() {
  for file in state brief data-health; do
    cp -p "$backup/$file.json" "$site/data/$file.json"
  done
  echo ROLLED_BACK_DATA
}
trap rollback ERR

for file in state brief data-health; do
  install -m 0644 "$stage/$file.json" "$site/data/$file.json.next"
  mv "$site/data/$file.json.next" "$site/data/$file.json"
done

for file in state brief data-health; do
  expected="$(sha256sum "$stage/$file.json" | cut -d' ' -f1)"
  observed="$(curl -fsS --resolve ops.wonderelian.com:443:127.0.0.1 "https://ops.wonderelian.com/data/$file.json" | sha256sum | cut -d' ' -f1)"
  test "$observed" = "$expected"
done

test "$frontend_before" = "$(sha256sum "$site/index.html" "$site/app.js" "$site/styles.css")"
nginx -t
trap - ERR
echo DEPLOY_OK_DATA_20261001
