#!/usr/bin/env bash
# Exact, user-authorized seven-file delta. Preserve the NOESIS design and assets.
set -euo pipefail
readonly archive=/tmp/ops-user-activity-20261001.tar.gz
readonly archive_sha="${1:?Pinned archive SHA256 required}"
readonly source_commit="${2:?Pinned source commit required}"
[[ "$archive_sha" =~ ^[0-9a-f]{64}$ && "$source_commit" =~ ^[0-9a-f]{40}$ ]]
readonly site=/srv/wonderelian/ops.wonderelian.com
readonly stage=/srv/wonderelian/.ops-user-activity-20261001
readonly backup=/srv/wonderelian/backups/ops-before-user-activity-20261001
files=(product-usage.js app.js data/state.json data/brief.json data/data-health.json data/feedback-analysis.json index.html)
test -d "$site/data" && test ! -e "$stage" && test ! -e "$backup"
# Existing deployment identity is root. Normal-user avail excludes reserved blocks.
# Do not alter filesystem reserve settings; require at least 1 GiB actually free.
test "$(id -u)" -eq 0
read -r free_blocks block_size < <(stat -f -c '%f %S' "$site")
test "$((free_blocks * block_size))" -gt 1073741824
printf '%s  %s\n' "$archive_sha" "$archive" | sha256sum -c -
printf '%s  %s\n' 62bacf332d67a1ea8af87b27efa513470377488f0273a78cf515a66fdda57a1c "$site/index.html" | sha256sum -c -
readonly design_before="$(sha256sum "$site/noesis.js" "$site/noesis.css" "$site/assets/noesis-crystal-dark.png" "$site/assets/noesis-crystal-light.png" "$site/assets/noesis-mark.png")"
nginx -t
while IFS= read -r entry; do
 case "$entry" in product-usage.js|app.js|index.html|data/state.json|data/brief.json|data/data-health.json|data/feedback-analysis.json) ;; *) echo UNEXPECTED_ENTRY; exit 3;; esac
done < <(tar -tzf "$archive")
mkdir -p "$stage/data" "$backup/data"
tar -xzf "$archive" -C "$stage"
for file in "${files[@]}"; do
 test -f "$stage/$file" && test ! -L "$stage/$file" && test -f "$site/$file"
 cp -p "$site/$file" "$backup/$file"
done
for name in state brief data-health feedback-analysis; do jq -e . "$stage/data/$name.json" >/dev/null; done
jq -e '.websites|any(.url=="https://buer.wonderelian.com/")' "$stage/data/state.json" >/dev/null
jq -e '.product_analytics.projects|length==7' "$stage/data/state.json" >/dev/null
printf '%s\n' "$source_commit" > "$backup/source-commit.txt"
rollback(){ for file in "${files[@]}"; do cp -p "$backup/$file" "$site/$file"; done; echo ROLLED_BACK_USER_ACTIVITY; }
trap rollback ERR
for file in "${files[@]}"; do install -m 0644 "$stage/$file" "$site/$file.next"; mv "$site/$file.next" "$site/$file"; done
for file in "${files[@]}"; do
 expected="$(sha256sum "$stage/$file" | cut -d' ' -f1)"
 observed="$(curl -fsS --resolve ops.wonderelian.com:443:127.0.0.1 "https://ops.wonderelian.com/$file" | sha256sum | cut -d' ' -f1)"
 test "$expected" = "$observed"
done
test "$design_before" = "$(sha256sum "$site/noesis.js" "$site/noesis.css" "$site/assets/noesis-crystal-dark.png" "$site/assets/noesis-crystal-light.png" "$site/assets/noesis-mark.png")"
nginx -t
trap - ERR
echo "DEPLOY_OK_USER_ACTIVITY_20261001 source=$source_commit DESIGN_UNCHANGED"
