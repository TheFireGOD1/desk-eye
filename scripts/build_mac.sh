#!/bin/bash

# DeskEye macOS Build Script
# Builds macOS installer (.dmg) using electron-builder

echo "=========================================="
echo "  DeskEye - macOS Build Script"
echo "=========================================="
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Error: This script must run on macOS"
    echo "Building for macOS from other platforms is not supported"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo "✓ npm version: $(npm --version)"
echo ""

# Check if Xcode Command Line Tools are installed
if ! command -v xcodebuild &> /dev/null; then
    echo "⚠️  Warning: Xcode Command Line Tools not found"
    echo "Installing Xcode Command Line Tools..."
    xcode-select --install
    echo "Please complete the installation and run this script again"
    exit 1
fi

echo "✓ Xcode Command Line Tools installed"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✓ Dependencies installed"
    echo ""
fi

# Clean previous build
if [ -d "dist" ]; then
    echo "🧹 Cleaning previous build..."
    rm -rf dist
    echo "✓ Cleaned"
    echo ""
fi

# Run tests (optional, comment out if not needed)
echo "🧪 Running tests..."
npm test
if [ $? -ne 0 ]; then
    echo "⚠️  Tests failed, but continuing with build..."
    echo ""
fi

# Build for macOS
echo "🔨 Building macOS installer..."
echo "This may take a few minutes..."
echo "Building for both Intel (x64) and Apple Silicon (arm64)..."
echo ""

npm run build:mac

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "  ✅ Build Successful!"
    echo "=========================================="
    echo ""
    echo "Installers created:"
    
    if [ -f "dist/DeskEye-1.0.0.dmg" ]; then
        echo "  📦 dist/DeskEye-1.0.0.dmg (Intel)"
    fi
    
    if [ -f "dist/DeskEye-1.0.0-arm64.dmg" ]; then
        echo "  📦 dist/DeskEye-1.0.0-arm64.dmg (Apple Silicon)"
    fi
    
    echo ""
    echo "Application bundle:"
    echo "  📁 dist/mac/DeskEye.app"
    echo ""
    echo "Next steps:"
    echo "  1. Test the DMG on a clean macOS system"
    echo "  2. Verify all features work correctly"
    echo "  3. Consider code signing and notarization for distribution"
    echo ""
    echo "Code Signing (optional):"
    echo "  - Requires Apple Developer account (\$99/year)"
    echo "  - See docs/how_to_build.md for instructions"
    echo ""
else
    echo ""
    echo "=========================================="
    echo "  ❌ Build Failed"
    echo "=========================================="
    echo ""
    echo "Common issues:"
    echo "  - Missing dependencies: Run 'npm install'"
    echo "  - Xcode not installed: Run 'xcode-select --install'"
    echo "  - Disk space: Ensure at least 500MB free"
    echo "  - Permissions: Check file permissions"
    echo ""
    exit 1
fi
