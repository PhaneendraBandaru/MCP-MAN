#!/bin/bash

echo "🚀 MCP Manager Installation Script for macOS"
echo "============================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists npm; then
    echo "❌ npm not found. Please install Node.js first."
    exit 1
fi

if ! command_exists cargo; then
    echo "❌ Rust/Cargo not found. Please install Rust first."
    exit 1
fi

echo "✅ Prerequisites met!"

# Navigate to project directory
cd "$(dirname "$0")"

echo ""
echo "🔧 Building MCP Manager..."

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Build the Tauri application
echo "🏗️  Building Tauri application..."
npm run tauri:build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    
    # Look for the built app
    APP_PATH=$(find src-tauri/target -name "*.app" -type d | head -1)
    
    if [ -n "$APP_PATH" ]; then
        echo "📱 Application built at: $APP_PATH"
        
        # Option 1: Copy to Applications folder
        echo ""
        echo "🎯 Installation Options:"
        echo "1. Install to Applications folder (recommended)"
        echo "2. Run from current location"
        echo "3. Create alias on Desktop"
        
        read -p "Choose option (1-3): " choice
        
        case $choice in
            1)
                echo "📁 Installing to /Applications..."
                sudo cp -R "$APP_PATH" /Applications/
                echo "✅ MCP Manager installed to Applications folder!"
                echo "🚀 You can now find 'MCP Manager' in your Applications folder"
                ;;
            2)
                echo "🏃 Running from current location..."
                open "$APP_PATH"
                ;;
            3)
                echo "🔗 Creating Desktop alias..."
                ln -sf "$(pwd)/$APP_PATH" ~/Desktop/
                echo "✅ Desktop alias created!"
                ;;
        esac
        
    else
        echo "❌ Could not find built application. Build may have failed."
        echo "💡 Try running manually: npm run tauri:build"
    fi
else
    echo "❌ Build failed. Please check the error messages above."
fi

echo ""
echo "📝 Alternative: Development Mode"
echo "To run in development mode:"
echo "  npm run tauri:dev"
echo ""
echo "🔧 Manual Installation:"
echo "1. Build: npm run tauri:build"
echo "2. Find app in: src-tauri/target/release/bundle/macos/"
echo "3. Copy to Applications folder"

echo ""
echo "🎉 Installation script completed!"
