#!/bin/zsh
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_NAME="VMD Desktop"
BUNDLE_PATH="$PROJECT_DIR/src-tauri/target/release/bundle/macos/$APP_NAME.app"
INSTALL_PATH="/Applications/$APP_NAME.app"

echo ""
echo "VMD Desktop — Installer"
echo "─────────────────────────────────"
echo ""

# Check pnpm
if ! command -v pnpm &>/dev/null; then
  echo "✗ pnpm not found. Install it with: npm install -g pnpm"
  exit 1
fi

echo "→ Building app..."
cd "$PROJECT_DIR"
pnpm tauri build --no-bundle 2>&1 | grep -E "(Compiling|Finished|error|warning\[)" || true
pnpm tauri build 2>&1 | tail -6

if [ ! -d "$BUNDLE_PATH" ]; then
  echo ""
  echo "✗ Build failed — bundle not found at:"
  echo "  $BUNDLE_PATH"
  exit 1
fi

echo ""
echo "→ Installing to /Applications..."

if [ -d "$INSTALL_PATH" ]; then
  rm -rf "$INSTALL_PATH"
fi

cp -R "$BUNDLE_PATH" "$INSTALL_PATH"

echo ""
echo "✓ VMD Desktop installed successfully."
echo "  Launch it from Spotlight or /Applications."
echo ""
