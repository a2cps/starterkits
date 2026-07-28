#!/usr/bin/env bash
#
# Rebuild the parts of the published site that describe it as a whole, rather than
# any single build: the version manifest, the two redirect pages, and the copy of
# the newest release at latest/.
#
# Run after a channel has been published, from .github/workflows/publish.yml. Safe
# to run repeatedly; it derives everything from what is actually on disk, so a run
# also repairs a latest/ or v.json left inconsistent by an earlier failure.
#
#   Usage: scripts/build-site-index.sh <site-dir> <template-dir> [base-path]
#
#     site-dir      checkout of the gh-pages branch
#     template-dir  assets/pages, holding index.html and 404.html
#     base-path     path the site is served from, e.g. "/starterkits" or "" for a
#                   domain root. Derived from GITHUB_REPOSITORY when omitted.
#
# Deliberately avoids jq, mapfile and `find -printf` so that it runs on a stock
# macOS shell as well as on the runner, and can be tested without a container.

set -euo pipefail

site=${1:?usage: build-site-index.sh <site-dir> <template-dir> [base-path]}
templates=${2:?usage: build-site-index.sh <site-dir> <template-dir> [base-path]}

# Channels that used to be published and should be cleaned up if still present.
RETIRED="unreleased"

if [ "$#" -ge 3 ]; then
  base=$3
elif [ -f "$site/CNAME" ]; then
  base=""
else
  repo=${GITHUB_REPOSITORY#*/}
  case "$repo" in
    "" | *.github.io) base="" ;;
    *) base="/$repo" ;;
  esac
fi

templates=$(cd "$templates" && pwd)
cd "$site"

for channel in $RETIRED; do
  if [ -d "$channel" ]; then
    echo "removing retired channel: $channel"
    rm -rf "$channel"
  fi
done

mkdir -p v

# Release directories, oldest first. Names come from a tag (v2.1.0 -> 2_1_0), so
# anything else in v/ is ignored rather than allowed into the manifest.
versions=""
for dir in v/*/; do
  [ -d "$dir" ] || continue
  name=${dir#v/}
  name=${name%/}
  case "$name" in
    *[!0-9_]* | "") echo "ignoring unexpected entry in v/: $name" >&2; continue ;;
  esac
  versions="$versions$name
"
done
versions=$(printf '%s' "$versions" | sort -t_ -k1,1n -k2,2n -k3,3n)

if [ -n "$versions" ]; then
  latest=$(printf '%s\n' "$versions" | tail -n 1)
  rsync -a --delete "v/$latest/" latest/
  home=latest
else
  # Nothing tagged yet: the development build is all there is.
  latest=""
  home=dev
fi

{
  printf '{\n  "latest": '
  if [ -n "$latest" ]; then printf '"%s"' "$latest"; else printf 'null'; fi
  printf ',\n  "versions": ['
  sep=""
  for name in $versions; do
    printf '%s"%s"' "$sep" "$name"
    sep=", "
  done
  printf ']\n}\n'
} > v.json

for page in index.html 404.html; do
  sed -e "s|__BASE__|$base|g" -e "s|__HOME__|$home|g" "$templates/$page" > "$page"
done

touch .nojekyll

echo "latest=${latest:-<none>} home=$home base=${base:-/}"
