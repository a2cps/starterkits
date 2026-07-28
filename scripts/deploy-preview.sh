#!/usr/bin/env bash
#
# Publish or remove a pull request preview under pr/<number>/ on gh-pages.
#
#   Usage: scripts/deploy-preview.sh publish <site-dir> <pr-number> <book-dir>
#          scripts/deploy-preview.sh remove  <site-dir> <pr-number>
#
#     site-dir   checkout of the gh-pages branch, with an "origin" remote
#     book-dir   rendered site to publish, i.e. _book
#
# Previews from different pull requests, and the Publish workflow, all write to the
# same branch. Rather than serialising every one of them behind a shared concurrency
# group -- where GitHub cancels all but the most recent pending run, silently losing
# previews -- each run takes the remote as it finds it and reapplies its own change.
# The work is confined to one directory and is idempotent, so a rejected push just
# means starting over against the newer tip.

set -euo pipefail

ATTEMPTS=5

mode=${1:?usage: deploy-preview.sh publish|remove <site-dir> <pr-number> [book-dir]}
site=${2:?usage: deploy-preview.sh publish|remove <site-dir> <pr-number> [book-dir]}
pr=${3:?usage: deploy-preview.sh publish|remove <site-dir> <pr-number> [book-dir]}
book=${4:-}

case "$mode" in
  publish)
    [ -n "$book" ] || { echo "publish needs a book-dir" >&2; exit 2; }
    [ -d "$book" ] || { echo "no such book-dir: $book" >&2; exit 2; }
    ;;
  remove) ;;
  *) echo "mode must be publish or remove, got: $mode" >&2; exit 2 ;;
esac

# Guard the interpolation: this becomes a path that gets rm -rf'd.
case "$pr" in
  "" | *[!0-9]*) echo "pr-number must be digits, got: $pr" >&2; exit 2 ;;
esac

dest="pr/$pr"

git -C "$site" config user.name >/dev/null 2>&1 ||
  git -C "$site" config user.name "github-actions[bot]"
git -C "$site" config user.email >/dev/null 2>&1 ||
  git -C "$site" config user.email "41898282+github-actions[bot]@users.noreply.github.com"

attempt=0
while [ "$attempt" -lt "$ATTEMPTS" ]; do
  attempt=$((attempt + 1))

  # Take the branch as it currently is, then reapply. Anything this run staged on a
  # previous attempt is discarded, so retries cannot accumulate.
  git -C "$site" fetch --quiet origin gh-pages
  git -C "$site" reset --quiet --hard FETCH_HEAD

  if [ "$mode" = publish ]; then
    rm -rf "${site:?}/$dest"
    mkdir -p "$site/$dest"
    cp -R "$book/." "$site/$dest/"
    message="Preview pull request #$pr"
  else
    rm -rf "${site:?}/$dest"
    rmdir "$site/pr" 2>/dev/null || true
    message="Remove preview for pull request #$pr"
  fi

  git -C "$site" add -A
  if git -C "$site" diff --cached --quiet; then
    echo "nothing to change for #$pr ($mode)"
    exit 0
  fi

  git -C "$site" commit --quiet -m "$message"
  if git -C "$site" push --quiet origin HEAD:gh-pages; then
    echo "$mode complete for #$pr on attempt $attempt"
    exit 0
  fi

  echo "push rejected on attempt $attempt; another run reached the branch first" >&2
  sleep $((attempt * 5))
done

echo "gave up after $ATTEMPTS attempts" >&2
exit 1
