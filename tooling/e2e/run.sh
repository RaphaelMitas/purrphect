#!/usr/bin/env bash
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
dart="$here/../../apps/dart"

export MAESTRO_CLI_NO_ANALYTICS=1
export MAESTRO_DRIVER_STARTUP_TIMEOUT=240000

run_ios() (
  udid=$(bash "$here/ios-simulator.sh" "^iPad Air 13-inch")
  cleanup() {
    xcrun simctl shutdown "$udid" 2> /dev/null || true
    xcrun simctl delete "$udid"
  }
  trap cleanup EXIT
  trap 'exit 130' INT TERM

  app=$(bash "$here/build-ios-sim.sh")
  xcrun simctl bootstatus "$udid"
  xcrun simctl install "$udid" "$app"
  cd "$dart" && pnpm e2e --device "$udid"
)

run_android() (
  export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
  sdk="$ANDROID_HOME"
  export PATH="$sdk/cmdline-tools/latest/bin:$sdk/emulator:$sdk/platform-tools:$PATH"
  case "$(uname -m)" in
    arm64 | aarch64) abi=arm64-v8a ;;
    *) abi=x86_64 ;;
  esac
  image="system-images;android-35;google_apis;$abi"
  avd=purrphect-e2e
  port=5580
  serial="emulator-$port"

  if adb devices | grep -q "^$serial[[:space:]]"; then
    echo "$serial is already running; stop it first." >&2
    exit 1
  fi
  [ -d "$sdk/system-images/android-35/google_apis/$abi" ] || sdkmanager --install "$image"
  echo no | avdmanager create avd --force --name "$avd" --package "$image" --device pixel_7 > /dev/null

  emulator -avd "$avd" -port "$port" -no-window -no-snapshot -noaudio -no-boot-anim -camera-back none \
    > /dev/null 2>&1 &
  emulator_pid=$!
  cleanup() {
    adb -s "$serial" emu kill > /dev/null 2>&1 || kill "$emulator_pid" 2> /dev/null || true
    wait "$emulator_pid" 2> /dev/null || true
    avdmanager delete avd --name "$avd" > /dev/null
  }
  trap cleanup EXIT
  trap 'exit 130' INT TERM

  apk=$(ANDROID_ABI="$abi" bash "$here/build-android-apk.sh")

  adb -s "$serial" wait-for-device
  for _ in $(seq 150); do
    [ "$(adb -s "$serial" shell getprop sys.boot_completed | tr -d '\r')" = 1 ] && break
    sleep 2
  done
  if [ "$(adb -s "$serial" shell getprop sys.boot_completed | tr -d '\r')" != 1 ]; then
    echo "$serial did not finish booting." >&2
    exit 1
  fi
  for scale in window_animation_scale transition_animation_scale animator_duration_scale; do
    adb -s "$serial" shell settings put global "$scale" 0
  done
  # The launcher's ANR dialog covers the app, and hide_error_dialogs doesn't suppress it.
  adb -s "$serial" shell pm disable-user --user 0 com.google.android.apps.nexuslauncher

  adb -s "$serial" install "$apk"
  cd "$dart" && pnpm e2e --device "$serial"
)

platforms=("$@")
[ ${#platforms[@]} -gt 0 ] || platforms=(ios android)
for platform in "${platforms[@]}"; do
  case "$platform" in
    ios) run_ios ;;
    android) run_android ;;
    *)
      echo "Unknown platform $platform; use ios, android, or neither for both." >&2
      exit 2
      ;;
  esac
done
