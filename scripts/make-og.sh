#!/usr/bin/env bash
# Regenerates public/og.jpg — the link-preview image — from scripts/assets/og.svg.
#
# Uses macOS built-ins (qlmanage, sips) so there is no image dependency in the
# project. The source SVG is square on purpose: qlmanage rescales a non-square
# viewBox, so the design sits in the centre 630px band and is cropped out here.
set -euo pipefail

cd "$(dirname "$0")/.."
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

qlmanage -t -s 1200 -o "$tmp" scripts/assets/og.svg >/dev/null 2>&1
sips -c 630 1200 "$tmp/og.svg.png" --out "$tmp/og-cropped.png" >/dev/null
sips -s format jpeg -s formatOptions 88 "$tmp/og-cropped.png" --out public/og.jpg >/dev/null

echo "public/og.jpg regenerated ($(du -h public/og.jpg | cut -f1))"
