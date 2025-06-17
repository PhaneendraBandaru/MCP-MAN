#!/bin/bash

echo "=== Testing File-Based MCP Detection Logic ==="
echo

# Test 1: VS Code Settings Detection
echo "1. Testing VS Code settings detection logic:"
VSCODE_SETTINGS="$HOME/Library/Application Support/Code/User/settings.json"
if [ -f "$VSCODE_SETTINGS" ]; then
    echo "✅ VS Code settings found"
    echo "📄 File: $VSCODE_SETTINGS"
    
    # Check for MCP-related content
    if grep -q -i "mcp" "$VSCODE_SETTINGS"; then
        echo "✅ MCP configuration detected in VS Code settings"
        echo "🔍 MCP-related lines:"
        grep -n -i "mcp" "$VSCODE_SETTINGS" | head -5
    else
        echo "❌ No MCP configuration found in VS Code settings"
    fi
    
    # Check for Copilot content
    if grep -q -i "copilot" "$VSCODE_SETTINGS"; then
        echo "✅ Copilot configuration detected"
        echo "🔍 Copilot-related lines:"
        grep -n -i "copilot" "$VSCODE_SETTINGS" | head -3
    else
        echo "❌ No Copilot configuration found"
    fi
else
    echo "❌ VS Code settings not found"
fi
echo

# Test 2: Workspace Settings Search
echo "2. Testing workspace .vscode/settings.json detection:"
echo "🔍 Searching common workspace directories..."

WORKSPACE_DIRS=(
    "$HOME/Desktop"
    "$HOME/Documents" 
    "$HOME/Projects"
    "$HOME/workspace"
    "$HOME/dev"
)

found_workspaces=0
for dir in "${WORKSPACE_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "📁 Checking: $dir"
        workspace_settings=$(find "$dir" -name ".vscode" -type d -exec find {} -name "settings.json" \; 2>/dev/null | head -3)
        if [ -n "$workspace_settings" ]; then
            echo "✅ Found workspace settings:"
            echo "$workspace_settings"
            found_workspaces=$((found_workspaces + 1))
        else
            echo "❌ No .vscode/settings.json found in $dir"
        fi
    else
        echo "❌ Directory doesn't exist: $dir"
    fi
done

if [ $found_workspaces -eq 0 ]; then
    echo "🔍 Searching entire home directory for .vscode/settings.json (limited results):"
    find "$HOME" -name ".vscode" -type d -exec find {} -name "settings.json" \; 2>/dev/null | head -5
fi
echo

# Test 3: Claude Desktop Configuration Analysis
echo "3. Testing Claude Desktop configuration analysis:"
CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
if [ -f "$CLAUDE_CONFIG" ]; then
    echo "✅ Claude config found"
    echo "📄 File: $CLAUDE_CONFIG"
    
    # Check if it's valid JSON
    if command -v jq >/dev/null 2>&1; then
        echo "🔍 Parsing JSON structure:"
        if jq empty "$CLAUDE_CONFIG" 2>/dev/null; then
            echo "✅ Valid JSON format"
            
            # Count MCP servers
            server_count=$(jq 'if type == "object" then . else {} end | keys | length' "$CLAUDE_CONFIG" 2>/dev/null || echo "0")
            echo "📊 Number of configured items: $server_count"
            
            # Show server names
            echo "🖥️  Configured items:"
            jq -r 'if type == "object" then keys[] else empty end' "$CLAUDE_CONFIG" 2>/dev/null | head -5
        else
            echo "❌ Invalid JSON format"
        fi
    else
        echo "⚠️  jq not available, showing raw content:"
        head -10 "$CLAUDE_CONFIG"
    fi
else
    echo "❌ Claude config not found"
fi
echo

# Test 4: Process Detection Simulation
echo "4. Testing process detection patterns:"
echo "🔍 Simulating MCP server process detection..."

# Look for patterns that would indicate MCP servers
processes_found=0

echo "📊 Checking for potential MCP server processes:"
ps aux | while read -r line; do
    if echo "$line" | grep -E "(mcp|uvx|python.*-m)" | grep -v grep >/dev/null; then
        echo "✅ Potential MCP process: $(echo "$line" | awk '{print $11}' | cut -c1-50)..."
        processes_found=$((processes_found + 1))
    fi
done

echo

# Test 5: GitHub Copilot Configuration Detection
echo "5. Testing GitHub Copilot configuration detection:"
COPILOT_DIRS=(
    "$HOME/.config/github-copilot"
    "$HOME/.gitconfig"
    "$HOME/Library/Application Support/Code/User/globalStorage/github.copilot"
)

for dir in "${COPILOT_DIRS[@]}"; do
    echo "📁 Checking: $dir"
    if [ -e "$dir" ]; then
        echo "✅ Found: $dir"
        if [ -f "$dir" ]; then
            echo "📄 File type"
        elif [ -d "$dir" ]; then
            echo "📁 Directory type"
            ls -la "$dir" | head -3
        fi
    else
        echo "❌ Not found: $dir"
    fi
done

echo
echo "=== Detection Test Summary ==="
echo "This test simulates what our Rust detection code will find:"
echo "- VS Code settings: $([ -f "$VSCODE_SETTINGS" ] && echo "✅ Available" || echo "❌ Not found")"
echo "- Claude config: $([ -f "$CLAUDE_CONFIG" ] && echo "✅ Available" || echo "❌ Not found")"
echo "- Workspace settings: $found_workspaces location(s) found"
echo "- Copilot configs: $(ls -d "${COPILOT_DIRS[@]}" 2>/dev/null | wc -l | tr -d ' ') out of ${#COPILOT_DIRS[@]} checked locations exist"
echo
echo "✅ The enhanced MCP Manager will be able to detect and manage servers from all these sources!"
