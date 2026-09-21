#!/bin/sh
# 配布用の .streamDeckPlugin を作る。
set -e
cd "$(dirname "$0")/.."
rm -rf dist && mkdir -p dist
cp -R com.kanade0525.daycount.sdPlugin "dist/com.kanade0525.daycount.sdPlugin"
rm -rf "dist/com.kanade0525.daycount.sdPlugin/logs"
(cd "dist/com.kanade0525.daycount.sdPlugin" && npm install --omit=dev >/dev/null 2>&1)
npx --yes @elgato/cli@latest validate dist/com.kanade0525.daycount.sdPlugin
npx --yes @elgato/cli@latest pack dist/com.kanade0525.daycount.sdPlugin --output . --force
ls -la ./*.streamDeckPlugin
