# 🚀 MCP Manager Installation Guide for macOS

## ✅ You have 3 options to install and use your enhanced MCP Manager:

### Option 1: Immediate Use (Recommended for Testing) 
```bash
cd /Users/PBandaru/MCP-MAN
npm run tauri:dev
```
This will open the MCP Manager app window immediately with all your enhancements.

### Option 2: One-Click Launcher (Easiest)
Double-click the file: `start_mcp_manager.command` in Finder
- This file is already created in your MCP-MAN folder
- It will start the application just like any Mac app

### Option 3: Full Installation (Permanent App)
```bash
cd /Users/PBandaru/MCP-MAN
./install_macos.sh
```
This will:
1. Build a standalone .app file
2. Install it to your Applications folder
3. Allow you to launch it like any normal Mac application

## 🎯 Quick Test Right Now

Open Terminal and run:
```bash
cd /Users/PBandaru/MCP-MAN
npm run tauri:dev
```

This will immediately open your enhanced MCP Manager with:
- ✅ All Servers page showing your GitHub Copilot servers from VS Code
- ✅ Process detection of running MCP servers
- ✅ Management controls for starting/stopping servers
- ✅ Source identification badges
- ✅ GitHub Copilot MCP integration

## 📱 What You'll See

When the app opens, you'll see:
1. **Sidebar** with "All Servers" option
2. **All Servers Page** showing:
   - Running MCP processes (with PIDs)
   - Claude Desktop configured servers
   - GitHub Copilot configured servers
   - Server source badges (Claude/Copilot/System)
   - Kill/restart controls

## 🔧 Your Detected Servers

Based on our testing, your system has:
- **Claude Desktop**: K8s MCP Server
- **GitHub Copilot**: Azure MCP Server, MCP Kubernetes
- **Running Processes**: TypeScript servers with Copilot plugins

## 🚀 Installation Commands Summary

Choose one:

**Immediate use:**
```bash
cd /Users/PBandaru/MCP-MAN && npm run tauri:dev
```

**Permanent install:**
```bash
cd /Users/PBandaru/MCP-MAN && ./install_macos.sh
```

**Finder double-click:**
Navigate to `/Users/PBandaru/MCP-MAN/` and double-click `start_mcp_manager.command`

Your enhanced MCP Manager is ready to use! 🎉
