#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
PACKAGE_NAME="abas-cientistas-extension"
PACKAGE_DIR="$DIST_DIR/$PACKAGE_NAME"
ZIP_PATH="$DIST_DIR/$PACKAGE_NAME.zip"

rm -rf "$PACKAGE_DIR" "$ZIP_PATH"
mkdir -p "$PACKAGE_DIR"

rsync -a --delete \
  --exclude "config.local.js" \
  "$ROOT_DIR/extension/" \
  "$PACKAGE_DIR/"

(
  cd "$DIST_DIR"
  zip -qr "$PACKAGE_NAME.zip" "$PACKAGE_NAME"
)

echo "$ZIP_PATH"
