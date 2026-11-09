#!/usr/bin/env bash
set -euo pipefail

device="${1:?device type regex required, e.g. ^iPad Air 13-inch}"

read -r type runtime < <(xcrun simctl list runtimes available --json | jq -r --arg re "$device" '
  [.runtimes[] | select(.platform == "iOS") | . as $runtime
    | .supportedDeviceTypes[] | select(.name | test($re))
    | {runtime: $runtime.identifier, type: .identifier, name,
       v: ($runtime.version | split(".") | map(tonumber))}]
  | sort_by(.v, .name) | last // empty | "\(.type) \(.runtime)"') || true
if [ -z "${type:-}" ]; then
  echo "No simulator matching $device" >&2
  xcrun simctl list runtimes available >&2
  exit 1
fi

# A fresh device, not a preinstalled one, which can come paired with a Watch and fail to boot.
udid=$(xcrun simctl create e2e "$type" "$runtime")
xcrun simctl boot "$udid"
echo "$udid"
