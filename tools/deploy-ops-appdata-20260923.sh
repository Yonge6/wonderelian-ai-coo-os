#!/usr/bin/env bash
set -euo pipefail

readonly commit=2dbfc6f1eafb36ba29a30401bcc4f110a853353c
readonly site=/srv/wonderelian/ops.wonderelian.com
readonly stage=/srv/wonderelian/.ops-appdata-20260923
readonly backup=/srv/wonderelian/backups/ops-before-appdata-20260923
readonly base="https://cdn.jsdelivr.net/gh/Yonge6/wonderelian-ai-coo-os@${commit}/public"

test -d "$site/data"
test ! -e "$stage"
test ! -e "$backup"
for file in state brief data-health feedback-analysis; do
  jq -e . "$site/data/$file.json" >/dev/null
done
nginx -t
cp -a "$site" "$backup"
cp -a "$site" "$stage"
mkdir -p "$stage/assets" "$stage/vendor/phosphor" "$stage/data"

files=(
  index.html
  app.js
  styles.css
  dashboard-model.js
  theme.js
  orbit.css
  vendor/phosphor/style.css
  assets/ai-coo-orbit-logo.png
  assets/orbit-system-dark.png
  assets/orbit-system-light.png
  data/state.json
  data/brief.json
  data/data-health.json
)
for file in "${files[@]}"; do
  curl -fsSL --connect-timeout 10 --max-time 120 "$base/$file" -o "$stage/$file"
  chmod 0644 "$stage/$file"
done

printf '%s  %s\n' \
  8e224909205a00d8bb9ed9ca0a267a94ad25677bd1764bdad2292f1e03e18fdd "$stage/index.html" \
  6c3c30e325948bdd53b830720ddc6607171f27fd9edce2c674c5977c91f4b7ac "$stage/app.js" \
  138e3dc5fbee579437d9bee39dcbffbdf12c37e41988691c0506b8d2e88cc893 "$stage/styles.css" \
  8778857a41d37b061ec750e7668cb39db5652f5ebd008a840b10d52b73ace0b7 "$stage/dashboard-model.js" \
  2cb34bc36e663b2ef95e40fa1ba4809bf6ead8f6c131918ecbcf1c160b9a4d04 "$stage/theme.js" \
  36d798cf3535a243457c3519ccab5b288bffb9c4e49946daa6350ff43199119a "$stage/orbit.css" \
  5b3a562c8e34ff8f24170bae63561ea04520d001b83144bd72881ba386d6418b "$stage/vendor/phosphor/style.css" \
  c7955f24409f183c797f351600d2f10724e444f4110f45359144f8b3902530eb "$stage/assets/ai-coo-orbit-logo.png" \
  e96b328dbb6334065d60baa83307516200b25da0ae361dd05174d9da9a4fc3ec "$stage/assets/orbit-system-dark.png" \
  bddafb1d2aea98d599541f1aa5e216f0ae5d72b597e0c67ab93e8a381baa36ef "$stage/assets/orbit-system-light.png" \
  15fd21093dfb8af019c9cbf502014bf843aa879360cce751c802624d89edcdb0 "$stage/data/state.json" \
  32877b5000da96cd1cb40a6085b40bc627f55e58495d00ff60dfd104133d0490 "$stage/data/brief.json" \
  4aa7e267a09fd4b447b5b84470e905fcc1ba5c17eb65b0e397166e6a343000f8 "$stage/data/data-health.json" | sha256sum -c -

for file in state brief data-health feedback-analysis; do
  jq -e . "$stage/data/$file.json" >/dev/null
done
jq -e '.daily_portfolio.website_latest_date == "2026-09-22" and .daily_portfolio.app_latest_date == "2026-09-21"' "$stage/data/brief.json" >/dev/null
jq -e '[.providers[] | select(.id == "app_store_connect_api" and .status == "partial" and .data_through == "2026-09-21")] | length == 1' "$stage/data/state.json" >/dev/null
nginx -t

exchange() {
  python3 -c 'import ctypes,sys; lib=ctypes.CDLL(None,use_errno=True); result=lib.renameat2(-100,sys.argv[1].encode(),-100,sys.argv[2].encode(),2); assert result==0,ctypes.get_errno()' "$site" "$stage"
}
exchange

if ! curl -fsS --resolve ops.wonderelian.com:443:127.0.0.1 https://ops.wonderelian.com/ | grep -q '20260923-appdata'; then
  exchange
  echo ROLLED_BACK_HTML
  exit 1
fi
if ! curl -fsS --resolve ops.wonderelian.com:443:127.0.0.1 https://ops.wonderelian.com/data/brief.json | jq -e '.daily_portfolio.website_latest_date == "2026-09-22" and .daily_portfolio.app_latest_date == "2026-09-21"' >/dev/null; then
  exchange
  echo ROLLED_BACK_DATA
  exit 1
fi

echo DEPLOY_OK_APPDATA_20260923
