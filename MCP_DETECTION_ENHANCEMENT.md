# MCP Server Detection Enhancement

This update adds comprehensive MCP (Model Context Protocol) server detection to the MCP Manager application, addressing your issue where the tool was only reading from Claude Desktop's configuration file.

## What's New

### 1. System-Wide MCP Server Detection (`process_detection.rs`)

The new module provides several key functions:

- **`detect_running_mcp_servers()`**: Scans running processes to find active MCP servers
- **`detect_copilot_mcp_servers()`**: Detects GitHub Copilot MCP configurations
- **`get_all_mcp_servers()`**: Aggregates all MCP servers from all sources
- **`kill_mcp_server(pid)`**: Allows stopping specific MCP server processes
- **`get_process_info(pid)`**: Gets detailed information about running processes

### 2. Enhanced Detection Capabilities

The system now detects MCP servers from multiple sources:

#### Running Processes
- Scans system processes for MCP server indicators
- Looks for patterns like:
  - `mcp-server`, `mcp_server`
  - `--mcp`, `model-context-protocol`
  - `stdio-server`
  - Specific server types: `mcp-filesystem`, `mcp-github`, `mcp-sqlite`, etc.
  - `uvx` commands (common for Python MCP servers)
  - `python -m` commands

#### GitHub Copilot Integration
- Checks VS Code settings (`~/Library/Application Support/Code/User/settings.json`)
- Looks for workspace-specific `.vscode/settings.json` files
- Detects Copilot MCP configuration in:
  - `github.copilot.advanced.mcp`
  - General `mcp` configurations
- Searches common workspace directories for MCP configurations

#### Claude Desktop (Enhanced)
- Maintains existing Claude Desktop configuration reading
- Shows real-time status of Claude-managed servers
- Indicates whether configured servers are actually running

### 3. New UI: "All Servers" Page

A comprehensive view showing:

- **Running Servers**: Live MCP servers detected on your system
- **Claude Desktop Servers**: Servers configured in Claude Desktop
- **GitHub Copilot Servers**: Servers configured for Copilot integration

Each server entry displays:
- Server name and source (Claude, Copilot, System, Unknown)
- Running status with PID (if running)
- Command and arguments
- Configuration file path
- Control actions (stop, get info) for running servers

### 4. Enhanced Type Definitions

New TypeScript interfaces:
- `RunningMcpServer`: Represents a detected MCP server
- `SystemMcpServers`: Aggregates servers from all sources

## Your System Configuration

Based on the test run, your system has:

### Claude Desktop
- K8s MCP Server configured
- Configuration file: `~/Library/Application Support/Claude/claude_desktop_config.json`

### GitHub Copilot (VS Code)
- Copilot extension enabled with MCP support
- Azure MCP Server configured
- MCP Kubernetes server at `/Users/PBandaru/mcp-kubernetes/mcp-kubernetes`
- TypeScript servers running with Copilot plugins

## How It Solves Your Issue

Previously, the tool only read from Claude Desktop's configuration file. Now it:

1. **Detects all running MCP servers** regardless of how they were started
2. **Finds GitHub Copilot MCP configurations** in VS Code settings
3. **Shows real-time process information** including PIDs and status
4. **Provides system-wide visibility** into all MCP server activity
5. **Allows process management** (stopping servers, getting details)

## Using the New Features

1. **Navigate to "All Servers"** in the sidebar
2. **Refresh** to scan for currently running servers
3. **View server details** including source, status, and configuration
4. **Manage running servers** by stopping them or getting process information
5. **See aggregated summary** of all detected servers

## Technical Implementation

### Security
- Added shell command permissions for `ps`, `kill`, `killall`, and `open`
- Restricted command arguments with validators
- Safe process detection using system commands

### Performance
- Non-blocking process scanning
- Cached results with manual refresh
- Efficient file system searching for configurations

### Cross-Platform Ready
- macOS implementation complete
- Windows and Linux process detection patterns prepared
- Platform-specific configuration file paths

## Future Enhancements

The foundation is now in place to:
- Add automatic refresh intervals
- Implement process monitoring and alerts
- Support more MCP server types and configurations
- Add configuration editing capabilities
- Integrate with other AI tools and environments

This enhancement transforms the MCP Manager from a Claude Desktop-only tool into a comprehensive MCP ecosystem manager for your entire system.
