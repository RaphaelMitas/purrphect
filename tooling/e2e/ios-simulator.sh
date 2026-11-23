#!/usr/bin/env bash
set -euo pipefail

device="${1:?device type regex required, e.g. ^iPad Air 13-inch}"
maestro_max_runtime="27.0"

read -r type runtime < <(xcrun simctl list runtimes available --json | jq -r --arg re "$device" --arg max "$maestro_max_runtime" '
  ($max | split(".") | map(tonumber)) as $max
  | [.runtimes[] | select(.platform == "iOS") | . as $runtime
    | ($runtime.version | split(".") | map(tonumber)) as $v | select($v <= $max)
    | .supportedDeviceTypes[] | select(.name | test($re))
    | {runtime: $runtime.identifier, type: .identifier, name, v: $v}]
  | sort_by(.v, .name) | last // empty | "\(.type) \(.runtime)"') || true
if [ -z "${type:-}" ]; then
  echo "No simulator on iOS $maestro_max_runtime or older matching $device" >&2
  xcrun simctl list runtimes available >&2
  exit 1
fi

udid=$(xcrun simctl create e2e "$type" "$runtime")
if ! xcrun simctl boot "$udid"; then
  xcrun simctl delete "$udid"
  exit 1
fi
echo "$udid"
