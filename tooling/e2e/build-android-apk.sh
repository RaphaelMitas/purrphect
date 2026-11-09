#!/usr/bin/env bash
set -euo pipefail

abi="${1:-x86_64}"
cd "$(dirname "$0")/../../apps/dart"

{
  pnpm expo prebuild --platform android --no-install
  cd android
  # The Expo template signs release builds with the debug keystore, so the APK installs as-is.
  ./gradlew assembleRelease -PreactNativeArchitectures="$abi" --no-daemon \
    -x lintVitalRelease -x lintVitalAnalyzeRelease -x lintVitalReportRelease
} >&2

echo "$PWD/app/build/outputs/apk/release/app-release.apk"
