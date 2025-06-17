#!/bin/bash

echo "=== Testing MCP Server Detection ==="
echo

echo "1. Checking for running processes that might be MCP servers:"
echo "Looking for processes containing 'mcp', 'uvx', 'python -m', etc..."
ps aux | grep -E "(mcp|uvx|python.*-m|node.*server)" | grep -v grep
echo

echo "2. Checking Claude Desktop configuration:"
CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
if [ -f "$CLAUDE_CONFIG" ]; then
    echo "Claude config found at: $CLAUDE_CONFIG"
    echo "Content:"
    cat "$CLAUDE_CONFIG" | jq . 2>/dev/null || cat "$CLAUDE_CONFIG"
else
    echo "Claude config not found at: $CLAUDE_CONFIG"
fi
echo

echo "3. Checking VS Code settings for MCP/Copilot configuration:"
VSCODE_SETTINGS="$HOME/Library/Application Support/Code/User/settings.json"
if [ -f "$VSCODE_SETTINGS" ]; then
    echo "VS Code settings found at: $VSCODE_SETTINGS"
    echo "Checking for MCP/Copilot related settings:"
    cat "$VSCODE_SETTINGS" | grep -i -E "(mcp|copilot)" || echo "No MCP/Copilot settings found"
else
    echo "VS Code settings not found at: $VSCODE_SETTINGS"
fi
echo

echo "4. Checking for GitHub Copilot configuration:"
COPILOT_CONFIG="$HOME/.config/github-copilot"
if [ -d "$COPILOT_CONFIG" ]; then
    echo "Copilot config directory found at: $COPILOT_CONFIG"
    ls -la "$COPILOT_CONFIG"
else
    echo "Copilot config directory not found at: $COPILOT_CONFIG"
fi
echo

echo "5. Searching for workspace .vscode/settings.json files:"
find "$HOME" -name ".vscode" -type d -exec find {} -name "settings.json" \; 2>/dev/null | head -5
echo

echo "=== Test Complete ==="
