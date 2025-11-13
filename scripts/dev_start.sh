#!/bin/bash

# DeskEye Development Start Script
# Starts the application in development mode

echo "=========================================="
echo "  DeskEye - Development Mode"
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

# Check if database directory exists
if [ ! -d "$HOME/.config/deskeye" ]; then
    echo "📁 Creating database directory..."
    mkdir -p "$HOME/.config/deskeye"
    echo "✓ Directory created"
    echo ""
fi

echo "🚀 Starting DeskEye in development mode..."
echo ""
echo "Tips:"
echo "  - Press Ctrl+R (Cmd+R on Mac) to reload"
echo "  - Press Ctrl+Shift+I (Cmd+Option+I on Mac) for DevTools"
echo "  - Check this terminal for console logs"
echo "  - Press Ctrl+C to stop the application"
echo ""
echo "=========================================="
echo ""

# Start the application
npm run dev
