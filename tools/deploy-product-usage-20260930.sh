#!/usr/bin/env bash
# Bounded delta deployment; no media replacement or cleanup on the shared host.
set -euo pipefail
surface="${1:?yixiu or ops}"
archive="${2:?uploaded archive}"
archive_sha="${3:?SHA256}"
baseline_index="${4:?current index SHA256}"
baseline_state="${5:-}"
case "$surface" in
  yixiu) host=yixiu.wonderelian.com ;;
  ops) host=ops.wonderelian.com ;;
  *) exit 2 ;;
esac
[[ "$archive" == /tmp/product-usage-20260930-*.tar.gz ]] || exit 2
site="/srv/wonderelian/$host"
stage="/srv/wonderelian/.product-usage-20260930-$surface"
backup="/srv/wonderelian/backups/product-usage-20260930-$surface"
test -d "$site"
test ! -e "$stage"
test ! -e "$backup"
printf '%s  %s\n' "$archive_sha" "$archive" | sha256sum -c -
printf '%s  %s\n' "$baseline_index" "$site/index.html" | sha256sum -c -
if [ "$surface" = ops ]; then
  printf '%s  %s\n' "$baseline_state" "$site/data/state.json" | sha256sum -c -
fi
if tar -tzf "$archive" | grep -Eq '(^/|(^|/)\.\.(/|$))'; then exit 3; fi
mkdir -p "$stage" "$backup"
tar -xzf "$archive" -C "$stage"
test -f "$stage/SHA256SUMS"
(cd "$stage" && sha256sum -c SHA256SUMS)
mapfile -t files < <(awk '{print $2}' "$stage/SHA256SUMS")
test "${#files[@]}" -gt 3
for file in "${files[@]}"; do
  case "$surface:$file" in
    yixiu:index.html|yixiu:analytics.js|yixiu:privacy.html|yixiu:assets/index-*.js|yixiu:assets/index-*.css) ;;
    ops:index.html|ops:app.js|ops:product-usage.js|ops:product-usage.css|ops:data/state.json|ops:data/brief.json|ops:data/data-health.json) ;;
    *) echo UNEXPECTED_FILE; exit 4 ;;
  esac
  if [ -f "$site/$file" ]; then
    mkdir -p "$backup/$(dirname "$file")"
    cp -p "$site/$file" "$backup/$file"
  fi
done
nginx -t
rollback() {
  for file in "${files[@]}"; do
    if [ -f "$backup/$file" ]; then cp -p "$backup/$file" "$site/$file"; fi
  done
  echo ROLLED_BACK
}
trap rollback ERR
# Hashed assets and data first. index.html is the final entry-point switch.
for file in "${files[@]}"; do
  [ "$file" != index.html ] || continue
  mkdir -p "$site/$(dirname "$file")"
  install -m 0644 "$stage/$file" "$site/$file.analytics-next"
  mv "$site/$file.analytics-next" "$site/$file"
done
install -m 0644 "$stage/index.html" "$site/index.html.analytics-next"
mv "$site/index.html.analytics-next" "$site/index.html"
for file in "${files[@]}"; do
  expected="$(awk -v file="$file" '$2==file {print $1}' "$stage/SHA256SUMS")"
  observed="$(curl -fsS --resolve "$host:443:127.0.0.1" "https://$host/$file" | sha256sum | cut -d' ' -f1)"
  test "$observed" = "$expected"
done
trap - ERR
echo "DEPLOY_OK_PRODUCT_USAGE_20260930_$surface"
echo "BACKUP=$backup"
