#!/bin/bash

echo "🔧 Testing Updated MCP Detection for VS Code Settings"
echo "===================================================="
echo ""

echo "1. Checking current VS Code MCP configuration:"
VSCODE_SETTINGS="$HOME/Library/Application Support/Code/User/settings.json"
if [ -f "$VSCODE_SETTINGS" ]; then
    echo "   ✅ VS Code settings found"
    echo ""
    echo "   Your current MCP servers configuration:"
    cat "$VSCODE_SETTINGS" | jq '.mcp.servers' 2>/dev/null || {
        echo "   Extracting MCP config manually:"
        sed -n '/"mcp":/,/}/p' "$VSCODE_SETTINGS" | head -20
    }
else
    echo "   ❌ VS Code settings not found"
fi

echo ""
echo "2. Checking for running MCP processes:"
echo "   Looking for your specific servers..."

echo "   Azure MCP Server processes:"
ps aux | grep -i "azure.*mcp\|npx.*azure" | grep -v grep | wc -l | awk '{print "     Found " $1 " processes"}'

echo "   Kubernetes MCP Server processes:"
ps aux | grep -i "mcp-kubernetes" | grep -v grep | wc -l | awk '{print "     Found " $1 " processes"}'

echo "   All potential MCP processes:"
ps aux | grep -E "(mcp|npx.*mcp)" | grep -v grep | head -5

echo ""
echo "3. Testing JSON comment stripping:"
if grep -q "//" "$VSCODE_SETTINGS" 2>/dev/null; then
    echo "   ⚠️  Comments detected in VS Code settings"
    echo "   ✅ Our comment stripping should handle this"
else
    echo "   ✅ No comments found in settings"
fi

echo ""
echo "🎯 Expected detection results:"
echo "   ✅ Azure MCP Server (from VS Code settings)"
echo "   ✅ Kubernetes MCP Server (from VS Code settings)" 
echo "   ✅ Any running MCP processes"
echo "   ❌ Claude Desktop servers (disabled)"
echo ""
echo "Ready to test the updated app!"
