#!/usr/bin/env bash
set -euo pipefail

abi="${1:-x86_64}"
cd "$(dirname "$0")/../../apps/dart"

{
  pnpm expo prebuild --platform android --no-install
  cd android
  for wait in 15 30 60 120; do
    ./gradlew --version --no-daemon > /dev/null && break
    sleep "$wait"
  done
  ./gradlew assembleRelease -PreactNativeArchitectures="$abi" --no-daemon \
    -x lintVitalRelease -x lintVitalAnalyzeRelease -x lintVitalReportRelease
} >&2

echo "$PWD/app/build/outputs/apk/release/app-release.apk"
