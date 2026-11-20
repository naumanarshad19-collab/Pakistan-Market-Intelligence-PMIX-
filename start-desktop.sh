#!/usr/bin/env bash
set -e

# Enter directory containing this script
cd "$(dirname "$0")"

echo "===================================================="
echo "  Pakistan Market Intelligence - Desktop Launcher   "
echo "===================================================="
echo ""

# Check Node.js installation
if ! command -v node >/dev/null 2>&1; then
    echo "[ERROR] Node.js is not installed or not found in PATH!"
    echo "Please download and install Node.js (version 18 or newer) from:"
    echo "https://nodejs.org/"
    echo ""
    exit 1
fi

# Check if node_modules exists, otherwise install dependencies
if [ ! -d "node_modules" ]; then
    echo "[SETUP] Installing application dependencies (one-time setup)..."
    npm install --no-audit --no-fund
    echo ""
fi

# Launch the desktop application
node desktop-launcher.js
