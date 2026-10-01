#!/usr/bin/env bash
# Run on the existing ops host. Bounded frontend-only delta with rollback.
set -euo pipefail
readonly archive=/tmp/ops-noesis-20261001.tar.gz
readonly archive_sha="${1:?Pinned archive SHA256 required}"
readonly source_commit="${2:?Pinned source commit required}"
[[ "$archive_sha" =~ ^[0-9a-f]{64}$ && "$source_commit" =~ ^[0-9a-f]{40}$ ]]
readonly site=/srv/wonderelian/ops.wonderelian.com
readonly stage=/srv/wonderelian/.ops-noesis-20261001
readonly backup=/srv/wonderelian/backups/ops-before-noesis-20261001
files=(noesis.js noesis.css assets/noesis-crystal-dark.png assets/noesis-crystal-light.png assets/noesis-mark.png app.js index.html)
test -d "$site/data"
test ! -e "$stage"
test ! -e "$backup"
test "$(df -Pk "$site" | awk 'NR==2 {print $4}')" -gt 30000
printf '%s  %s\n' "$archive_sha" "$archive" | sha256sum -c -
printf '%s  %s\n' b221563ef66dbae32bfefde2708c8d08ef4ad5ff031bbf7f479d220e4e6cd1a7 "$site/index.html" | sha256sum -c -
for file in state brief data-health feedback-analysis; do jq -e . "$site/data/$file.json" >/dev/null; done
readonly data_before="$(sha256sum "$site"/data/*.json)"
nginx -t
# Reject paths outside the exact frontend delta before extracting anything.
while IFS= read -r entry; do
  case "$entry" in
    assets/|noesis.js|noesis.css|assets/noesis-crystal-dark.png|assets/noesis-crystal-light.png|assets/noesis-mark.png|app.js|index.html) ;;
    *) echo UNEXPECTED_ARCHIVE_ENTRY; exit 3 ;;
  esac
done < <(tar -tzf "$archive")
mkdir -p "$stage/assets" "$backup/assets"
tar -xzf "$archive" -C "$stage"
for file in "${files[@]}"; do
  test -f "$stage/$file" && test ! -L "$stage/$file"
  if test -f "$site/$file"; then cp -p "$site/$file" "$backup/$file"; fi
done
printf '%s\n' "$source_commit" > "$backup/source-commit.txt"
rollback() {
  for file in "${files[@]}"; do
    if test -f "$backup/$file"; then cp -p "$backup/$file" "$site/$file"; fi
  done
  echo ROLLED_BACK_NOESIS
}
trap rollback ERR
# Dependencies first, entry HTML last; each individual replacement is atomic.
for file in "${files[@]}"; do
  install -m 0644 "$stage/$file" "$site/$file.next"
  mv "$site/$file.next" "$site/$file"
done
for file in "${files[@]}"; do
  expected="$(sha256sum "$stage/$file" | cut -d' ' -f1)"
  observed="$(curl -fsS --resolve ops.wonderelian.com:443:127.0.0.1 "https://ops.wonderelian.com/$file" | sha256sum | cut -d' ' -f1)"
  test "$expected" = "$observed"
done
test "$data_before" = "$(sha256sum "$site"/data/*.json)"
nginx -t
trap - ERR
echo "DEPLOY_OK_NOESIS_20261001 source=$source_commit DATA_UNCHANGED"
