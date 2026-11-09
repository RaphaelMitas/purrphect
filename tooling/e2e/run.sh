#!/usr/bin/env bash
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
dart="$here/../../apps/dart"

export MAESTRO_CLI_NO_ANALYTICS=1
export MAESTRO_DRIVER_STARTUP_TIMEOUT=240000

run_ios() (
  udid=$(bash "$here/ios-simulator.sh" "^iPad Air 13-inch")
  cleanup() {
    trap '' INT TERM HUP
    xcrun simctl shutdown "$udid" 2> /dev/null || true
    xcrun simctl delete "$udid" || true
  }
  trap cleanup EXIT
  trap 'exit 130' INT TERM HUP

  app=$(bash "$here/build-ios-sim.sh")
  xcrun simctl bootstatus "$udid"
  xcrun simctl install "$udid" "$app"
  cd "$dart" && pnpm e2e --device "$udid"
)

run_android() (
  export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
  export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"
  case "$(uname -m)" in
    arm64 | aarch64) abi=arm64-v8a ;;
    *) abi=x86_64 ;;
  esac
  image="system-images;android-35;google_apis;$abi"
  avd=purrphect-e2e
  port=5580
  serial="emulator-$port"

  if adb devices | grep "^$serial[[:space:]]" > /dev/null; then
    echo "$serial is already running; stop it first." >&2
    exit 1
  fi

  emulator_pid=
  cleanup() {
    trap '' INT TERM HUP
    if [ -n "$emulator_pid" ]; then
      adb -s "$serial" emu kill > /dev/null 2>&1 || kill "$emulator_pid" 2> /dev/null || true
      for _ in $(seq 30); do
        kill -0 "$emulator_pid" 2> /dev/null || break
        sleep 1
      done
      kill -9 "$emulator_pid" 2> /dev/null || true
    fi
    avdmanager delete avd --name "$avd" > /dev/null 2>&1 || true
  }
  trap cleanup EXIT
  trap 'exit 130' INT TERM HUP

  [ -d "$ANDROID_HOME/system-images/android-35/google_apis/$abi" ] || sdkmanager --install "$image"
  echo no | avdmanager create avd --force --name "$avd" --package "$image" --device pixel_7 > /dev/null

  emulator -avd "$avd" -port "$port" -no-window -no-snapshot -noaudio -no-boot-anim -camera-back none \
    > /dev/null 2>&1 &
  emulator_pid=$!

  apk=$(bash "$here/build-android-apk.sh" "$abi")

  tries=150
  until [ "$(adb -s "$serial" shell getprop sys.boot_completed 2> /dev/null | tr -d '\r')" = 1 ]; do
    kill -0 "$emulator_pid" 2> /dev/null || { echo "The emulator exited before it finished booting." >&2; exit 1; }
    tries=$((tries - 1))
    [ "$tries" -gt 0 ] || { echo "$serial did not finish booting." >&2; exit 1; }
    sleep 2
  done
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
    ios | android) ;;
    *)
      echo "Unknown platform $platform; use ios, android, or neither for both." >&2
      exit 2
      ;;
  esac
done

# Maestro's drivers listen on fixed ports and the AVD name is shared, so one run per machine.
lock="$HOME/.cache/purrphect-e2e.lock"
mkdir -p "$HOME/.cache"
if ! mkdir "$lock" 2> /dev/null; then
  echo "Another E2E run holds $lock; remove it if none is running." >&2
  exit 1
fi
trap 'rmdir "$lock" 2> /dev/null || true' EXIT
trap 'exit 143' TERM HUP

for platform in "${platforms[@]}"; do
  "run_$platform"
done
