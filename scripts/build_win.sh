#!/bin/bash

# DeskEye Windows Build Script
# Builds Windows installer (.exe) using electron-builder

echo "=========================================="
echo "  DeskEye - Windows Build Script"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo "✓ npm version: $(npm --version)"
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

# Build for Windows
echo "🔨 Building Windows installer..."
echo "This may take a few minutes..."
echo ""

npm run build:win

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "  ✅ Build Successful!"
    echo "=========================================="
    echo ""
    echo "Installer location:"
    echo "  📦 dist/DeskEye Setup 1.0.0.exe"
    echo ""
    echo "Unpacked files:"
    echo "  📁 dist/win-unpacked/"
    echo ""
    echo "Next steps:"
    echo "  1. Test the installer on a clean Windows system"
    echo "  2. Verify all features work correctly"
    echo "  3. Consider code signing for production"
    echo ""
else
    echo ""
    echo "=========================================="
    echo "  ❌ Build Failed"
    echo "=========================================="
    echo ""
    echo "Common issues:"
    echo "  - Missing dependencies: Run 'npm install'"
    echo "  - Disk space: Ensure at least 500MB free"
    echo "  - Permissions: Try running as administrator"
    echo "  - Antivirus: Temporarily disable if blocking"
    echo ""
    exit 1
fi
