#!/usr/bin/env bash
set -euo pipefail

# Callers capture the .app path from stdout, so the build logs go to stderr.
exec 3>&1 1>&2

cd "$(dirname "$0")/../../apps/dart"
pnpm expo prebuild --platform ios --no-install

cd ios
LANG=en_US.UTF-8 pod install

args=(
  -workspace DartPurrphect.xcworkspace -scheme DartPurrphect
  -configuration Release -sdk iphonesimulator -derivedDataPath build
  CODE_SIGN_IDENTITY=- ARCHS=arm64 ONLY_ACTIVE_ARCH=YES build
)
if command -v xcbeautify > /dev/null; then
  xcodebuild "${args[@]}" | xcbeautify
else
  xcodebuild -quiet "${args[@]}"
fi

echo "$PWD/build/Build/Products/Release-iphonesimulator/DartPurrphect.app" >&3
