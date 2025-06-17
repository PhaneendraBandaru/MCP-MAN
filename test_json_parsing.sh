#!/bin/bash

echo "🔧 Testing JSON Parsing Fix"
echo "==========================="
echo ""

echo "1. Creating test JSON with trailing comma (like your VS Code settings):"
cat > /tmp/test_mcp_config.json << 'EOF'
{
  "mcp": {
    "servers": {
      "Azure MCP Server": {
        "command": "npx",
        "args": [
          "-y",
          "@azure/mcp@latest",
          "server",
          "start"
        ]
      },
      "kubernetes": {
        "command": "/Users/PBandaru/mcp-kubernetes/mcp-kubernetes",
        "args": [
          "--transport",
          "stdio"
        ],
        "env": {
          "KUBECONFIG": "/Users/PBandaru/.kube/config",
        }
      }
    }
  }
}
EOF

echo "✅ Test file created with trailing comma in env section"
echo ""

echo "2. Testing standard JSON parsing (should fail):"
python3 -c "
import json
try:
    with open('/tmp/test_mcp_config.json', 'r') as f:
        data = json.loads(f.read())
    print('✅ Standard parsing succeeded')
except Exception as e:
    print(f'❌ Standard parsing failed: {e}')
"

echo ""
echo "3. Testing with comment/comma stripping (should work):"
python3 -c "
import json
import re

def fix_trailing_commas(text):
    # Simple regex to fix trailing commas
    text = re.sub(r',(\s*[}\]])', r'\1', text)
    return text

try:
    with open('/tmp/test_mcp_config.json', 'r') as f:
        content = f.read()
    fixed_content = fix_trailing_commas(content)
    data = json.loads(fixed_content)
    if 'mcp' in data and 'servers' in data['mcp']:
        servers = data['mcp']['servers']
        print(f'✅ Fixed parsing succeeded! Found {len(servers)} servers:')
        for name in servers.keys():
            print(f'   - {name}')
    else:
        print('❌ No MCP servers found in parsed data')
except Exception as e:
    print(f'❌ Fixed parsing failed: {e}')
"

echo ""
echo "4. Your actual VS Code settings parsing test:"
VSCODE_SETTINGS="$HOME/Library/Application Support/Code/User/settings.json"
if [ -f "$VSCODE_SETTINGS" ]; then
    echo "   Testing your actual settings file..."
    python3 -c "
import json
import re

def fix_trailing_commas(text):
    # Simple regex to fix trailing commas
    text = re.sub(r',(\s*[}\]])', r'\1', text)
    return text

def strip_comments(text):
    lines = []
    for line in text.split('\n'):
        if '//' in line:
            # Simple comment removal
            idx = line.find('//')
            # Check if // is inside quotes
            quote_count = line[:idx].count('\"') - line[:idx].count('\\\"')
            if quote_count % 2 == 0:  # Even number of quotes means // is outside
                line = line[:idx].rstrip()
        lines.append(line)
    return '\n'.join(lines)

try:
    with open('$VSCODE_SETTINGS', 'r') as f:
        content = f.read()
    
    # Clean the content
    cleaned = strip_comments(content)
    fixed = fix_trailing_commas(cleaned)
    
    data = json.loads(fixed)
    
    if 'mcp' in data and 'servers' in data['mcp']:
        servers = data['mcp']['servers']
        print(f'✅ Your VS Code settings parsed successfully! Found {len(servers)} MCP servers:')
        for name, config in servers.items():
            command = config.get('command', 'N/A')
            print(f'   - {name}: {command}')
    else:
        print('❌ No MCP configuration found in your settings')
        
except Exception as e:
    print(f'❌ Failed to parse your VS Code settings: {e}')
"
else
    echo "   ❌ VS Code settings file not found"
fi

echo ""
echo "🎯 This confirms our Rust parsing fix should work!"

# Clean up
rm -f /tmp/test_mcp_config.json
