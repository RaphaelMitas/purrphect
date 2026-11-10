#!/usr/bin/env bash
set -euo pipefail

device="${1:?device: iphone, ipad, android-phone or android-tablet}"
captures="${2:?captures dir required}"
target="${3:?simulator udid or emulator serial required}"
app="${4:?app or apk path required}"
flow="$(cd "$(dirname "$0")" && pwd)/store.yaml"
results="$captures/maestro-$device"

# Light mode and a clean 9:41 status bar, the way the stores show apps.
case "$device" in
  iphone | ipad)
    xcrun simctl bootstatus "$target"
    xcrun simctl ui "$target" appearance light
    xcrun simctl status_bar "$target" override --time "9:41" --dataNetwork wifi --wifiMode active \
      --wifiBars 3 --cellularMode active --cellularBars 4 --batteryState charged --batteryLevel 100
    xcrun simctl install "$target" "$app"
    ;;
  android-*)
    adb -s "$target" install "$app"
    adb -s "$target" shell cmd uimode night no
    adb -s "$target" shell settings put global sysui_demo_allowed 1
    demo() { adb -s "$target" shell am broadcast -a com.android.systemui.demo -e command "$@"; }
    demo enter
    demo clock -e hhmm 0941
    demo battery -e level 100 -e plugged false
    demo network -e wifi show -e level 4 -e fully true -e mobile hide
    demo notifications -e visible false
    ;;
esac

run() {
  rm -rf "$results"
  maestro --device "$target" test -e DEVICE="$device" --test-output-dir "$results" --debug-output "$results/debug" "$flow"
}

# One retry: a fresh simulator's first XCTest driver start occasionally times out.
run || run

mkdir -p "$captures/$device"
# Maestro names its own step and failure screenshots "screenshot-*"; everything else is a takeScreenshot.
find "$results" -name '*.png' ! -name 'screenshot-*' ! -path '*/debug/*' -exec cp {} "$captures/$device/" \;
ls "$captures/$device"
