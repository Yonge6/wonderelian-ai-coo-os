#!/usr/bin/env bash
set -euo pipefail
readonly site=/srv/wonderelian/ops.wonderelian.com
readonly stage=/srv/wonderelian/.ops-buer-usage-20261001
readonly backup=/srv/wonderelian/backups/ops-before-buer-usage-20261001
readonly archive=/tmp/ops-buer-usage-20261001.tar.gz
readonly expected="${1:?archive sha required}"
[[ "$expected" =~ ^[0-9a-f]{64}$ ]]
files=(product-usage.js app.js index.html data/state.json data/brief.json data/data-health.json data/feedback-analysis.json)
test ! -e "$stage" && test ! -e "$backup"
printf '%s  %s\n' "$expected" "$archive" | sha256sum -c -
printf '%s  %s\n' f0244ef9af45e777b844b56f1e54c6c647bdcceb8a5340206d7ed7b37de8e279 "$site/index.html" cbb228a844ad11169a875a3ca9d1423723b3501525af14db57a1bf1188c5d36f "$site/data/state.json" | sha256sum -c -
readonly design="$(sha256sum "$site/noesis.js" "$site/noesis.css")"
while IFS= read -r entry; do
 case "$entry" in product-usage.js|app.js|index.html|data/state.json|data/brief.json|data/data-health.json|data/feedback-analysis.json) ;; *) exit 3;; esac
done < <(tar -tzf "$archive")
mkdir -p "$stage/data" "$backup/data"
tar -xzf "$archive" -C "$stage"
for file in "${files[@]}"; do
 test -f "$stage/$file" && test ! -L "$stage/$file" && test -f "$site/$file"
 cp -p "$site/$file" "$backup/$file"
done
for name in state brief data-health feedback-analysis; do jq -e . "$stage/data/$name.json" >/dev/null; done
jq -e '.product_analytics.projects|any(.id=="buer" and .ios.surface=="ios" and .ios.source=="Google Analytics 4 Data API")' "$stage/data/state.json" >/dev/null
rollback(){ for file in "${files[@]}"; do cp -p "$backup/$file" "$site/$file"; done; }
trap rollback ERR
for file in "${files[@]}"; do install -m 0644 "$stage/$file" "$site/$file.next"; mv "$site/$file.next" "$site/$file"; done
for file in "${files[@]}"; do
 test "$(sha256sum "$stage/$file" | cut -d' ' -f1)" = "$(curl -fsS --resolve ops.wonderelian.com:443:127.0.0.1 "https://ops.wonderelian.com/$file" | sha256sum | cut -d' ' -f1)"
done
test "$design" = "$(sha256sum "$site/noesis.js" "$site/noesis.css")"
nginx -t
trap - ERR
echo DEPLOY_OK_BUER_USAGE
