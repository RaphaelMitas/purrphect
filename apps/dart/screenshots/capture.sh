#!/usr/bin/env bash
# Usage: capture.sh <iphone|ipad|android-phone|android-tablet> <captures-dir> <device-id>
set -euo pipefail

device="${1:?device name required}"
captures="${2:?captures dir required}"
udid="${3:?simulator udid or emulator serial required}"
flow="$(cd "$(dirname "$0")" && pwd)/store.yaml"
results="$captures/maestro-$device"

run() {
  rm -rf "$results"
  MAESTRO_CLI_NO_ANALYTICS=1 maestro --device "$udid" test \
    --test-output-dir "$results" --debug-output "$results/debug" "$flow"
}

# One retry: a fresh simulator's first XCTest driver start occasionally times out.
run || run

mkdir -p "$captures/$device"
# Maestro names its own step and failure screenshots "screenshot-*"; everything else is a takeScreenshot.
find "$results" -name '*.png' ! -name 'screenshot-*' ! -path '*/debug/*' -exec cp {} "$captures/$device/" \;
ls "$captures/$device"
