#!/bin/sh
# 開発中のプラグインを Stream Deck に見せる（実体はこのリポジトリのまま）。
set -e
cd "$(dirname "$0")/.."
DST="$HOME/Library/Application Support/com.elgato.StreamDeck/Plugins/com.kanade0525.daycount.sdPlugin"
ln -sfn "$(pwd)/com.kanade0525.daycount.sdPlugin" "$DST"
echo "つないだ: $DST"
