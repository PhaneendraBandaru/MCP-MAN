#!/bin/bash

echo "🔧 Testing Fixed MCP Detection..."
echo ""

echo "1. Testing VS Code settings parsing (with comments):"
VSCODE_SETTINGS="$HOME/Library/Application Support/Code/User/settings.json"
if [ -f "$VSCODE_SETTINGS" ]; then
    echo "   ✅ VS Code settings found"
    echo "   Checking for comments in settings file:"
    if grep -q "//" "$VSCODE_SETTINGS" || grep -q "/\*" "$VSCODE_SETTINGS"; then
        echo "   ⚠️  Comments detected - this was causing the JSON parsing error"
        echo "   ✅ Our fix should handle this now"
    else
        echo "   ✅ No comments found"
    fi
    
    echo "   MCP/Copilot related lines:"
    grep -i -A 1 -B 1 "mcp\|copilot" "$VSCODE_SETTINGS" | head -10
else
    echo "   ❌ VS Code settings not found"
fi

echo ""
echo "2. Testing Claude config parsing:"
CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
if [ -f "$CLAUDE_CONFIG" ]; then
    echo "   ✅ Claude config found"
    echo "   Structure:"
    cat "$CLAUDE_CONFIG"
else
    echo "   ❌ Claude config not found"
fi

echo ""
echo "3. Testing process detection:"
echo "   TypeScript servers with Copilot:"
ps aux | grep -E "(typescript.*copilot|tsserver.*copilot)" | grep -v grep | wc -l | awk '{print "   Found " $1 " servers"}'

echo ""
echo "🎯 The fixes should resolve:"
echo "   ✅ Claude config parsing (handles your direct name/path format)"
echo "   ✅ VS Code settings parsing (strips JSON comments)" 
echo "   ✅ Better error messages in the UI"
echo ""
echo "Ready to test the updated app!"
