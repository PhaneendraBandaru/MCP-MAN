#!/bin/bash

echo "🚀 Quick MCP Manager Setup for macOS"
echo "====================================="
echo ""

cd "$(dirname "$0")"

echo "📋 Option 1: Development Mode (Immediate Use)"
echo "----------------------------------------------"
echo "This will run MCP Manager immediately without installation:"
echo ""
echo "Command: npm run tauri:dev"
echo ""

echo "📱 Option 2: Create Desktop App (Recommended)"
echo "----------------------------------------------"
echo "This will create a standalone .app that you can use like any Mac app:"
echo ""
echo "Commands:"
echo "1. npm run tauri:build"
echo "2. Copy the .app file to your Applications folder"
echo ""

echo "🔧 Option 3: Create Simple Launcher"
echo "------------------------------------"
echo "This creates a script you can double-click to start MCP Manager:"

# Create a simple launcher app
cat > start_mcp_manager.command << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "Starting MCP Manager..."
npm run tauri:dev
EOF

chmod +x start_mcp_manager.command

echo "✅ Created 'start_mcp_manager.command'"
echo "   Double-click this file to start MCP Manager anytime!"
echo ""

echo "🎯 Quick Start Instructions:"
echo "=============================="
echo ""
echo "1. IMMEDIATE USE (Development):"
echo "   ./start_mcp_manager.command"
echo "   (or double-click the .command file)"
echo ""
echo "2. PERMANENT INSTALLATION:"
echo "   ./install_macos.sh"
echo ""
echo "3. MANUAL BUILD:"
echo "   npm run tauri:build"
echo "   Then copy the .app from src-tauri/target/release/bundle/macos/ to Applications"
echo ""

echo "📍 Current Status:"
echo "- ✅ Enhanced MCP Manager is ready"
echo "- ✅ Detects Claude Desktop servers"
echo "- ✅ Detects GitHub Copilot servers" 
echo "- ✅ System-wide MCP server detection"
echo "- ✅ Process management controls"
echo ""

echo "🚀 Choose your preferred method and enjoy your enhanced MCP Manager!"
