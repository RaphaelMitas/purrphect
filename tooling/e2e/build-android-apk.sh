#!/usr/bin/env bash
set -euo pipefail

# Callers capture the APK path from stdout, so the build logs go to stderr.
exec 3>&1 1>&2

abi="${ANDROID_ABI:-x86_64}"

cd "$(dirname "$0")/../../apps/dart"
pnpm expo prebuild --platform android --no-install

# The Expo template signs release builds with the debug keystore, so the APK installs as-is.
cd android
./gradlew assembleRelease -PreactNativeArchitectures="$abi" --no-daemon \
  -x lintVitalRelease -x lintVitalAnalyzeRelease -x lintVitalReportRelease

echo "$PWD/app/build/outputs/apk/release/app-release.apk" >&3
