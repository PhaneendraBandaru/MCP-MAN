use serde::{Deserialize, Serialize};
use serde_json;
use std::fs;
use std::path::PathBuf;
use std::process::Command;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RunningMcpServer {
    pub name: String,
    pub pid: u32,
    pub command: String,
    pub args: Vec<String>,
    pub source: String, // "claude", "copilot", "system", "unknown"
    pub config_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemMcpServers {
    pub running_servers: Vec<RunningMcpServer>,
    pub copilot_servers: Vec<RunningMcpServer>,
    pub claude_servers: Vec<RunningMcpServer>,
}

// Detect running MCP server processes
#[tauri::command]
pub async fn detect_running_mcp_servers() -> Result<Vec<RunningMcpServer>, String> {
    let mut running_servers = Vec::new();
    
    // Use ps command to find running processes that might be MCP servers
    let output = Command::new("ps")
        .args(&["aux"])
        .output()
        .map_err(|e| format!("Failed to run ps command: {}", e))?;
    
    let stdout = String::from_utf8_lossy(&output.stdout);
    
    for line in stdout.lines() {
        // Skip header line
        if line.contains("USER") && line.contains("PID") {
            continue;
        }
        
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() < 11 {
            continue;
        }
        
        let pid_str = parts[1];
        let command_line = parts[10..].join(" ");
        
        // Look for potential MCP server indicators
        if is_potential_mcp_server(&command_line) {
            if let Ok(pid) = pid_str.parse::<u32>() {
                let (name, source) = identify_mcp_server(&command_line);
                let (command, args) = parse_command_line(&command_line);
                
                running_servers.push(RunningMcpServer {
                    name,
                    pid,
                    command,
                    args,
                    source,
                    config_path: None,
                });
            }
        }
    }
    
    Ok(running_servers)
}

// Check for GitHub Copilot MCP configuration
#[tauri::command]
pub async fn detect_copilot_mcp_servers() -> Result<Vec<RunningMcpServer>, String> {
    let mut copilot_servers = Vec::new();
    
    // Check VS Code settings for GitHub Copilot MCP configuration
    let vscode_settings_paths = get_vscode_settings_paths();
    
    for settings_path in vscode_settings_paths {
        if let Ok(content) = fs::read_to_string(&settings_path) {
            // Strip comments from JSON before parsing
            let cleaned_content = strip_json_comments(&content);
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&cleaned_content) {
                // Look for GitHub Copilot MCP settings
                if let Some(copilot_config) = extract_copilot_mcp_config(&json) {
                    for server in copilot_config {
                        copilot_servers.push(server);
                    }
                }
            }
        }
    }
    
    // Also check for standalone Copilot configuration files
    let copilot_config_paths = get_copilot_config_paths();
    for config_path in copilot_config_paths {
        if let Ok(content) = fs::read_to_string(&config_path) {
            let cleaned_content = strip_json_comments(&content);
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&cleaned_content) {
                if let Some(mcp_servers) = extract_mcp_servers_from_config(&json, "copilot") {
                    for mut server in mcp_servers {
                        server.config_path = Some(config_path.to_string_lossy().to_string());
                        copilot_servers.push(server);
                    }
                }
            }
        }
    }
    
    Ok(copilot_servers)
}

// Get all MCP servers from all sources
#[tauri::command]
pub async fn get_all_mcp_servers() -> Result<SystemMcpServers, String> {
    let running_servers = detect_running_mcp_servers().await?;
    let copilot_servers = detect_copilot_mcp_servers().await?;
    
    // Get Claude servers from existing configuration
    let claude_servers = get_claude_mcp_servers().await?;
    
    Ok(SystemMcpServers {
        running_servers,
        copilot_servers,
        claude_servers,
    })
}

fn is_potential_mcp_server(command_line: &str) -> bool {
    let mcp_indicators = [
        "mcp-server",
        "mcp_server", 
        "mcp-kubernetes",
        "@azure/mcp",
        "npx.*@azure/mcp",
        "--mcp",
        "model-context-protocol",
        "stdio-server",
        "mcp-filesystem",
        "mcp-github",
        "mcp-sqlite",
        "mcp-postgres",
        "mcp-brave-search",
        "mcp-everything",
        "uvx",
        "python -m.*mcp",
        "node.*mcp",
        "/mcp-kubernetes/mcp-kubernetes",
    ];
    
    let command_lower = command_line.to_lowercase();
    mcp_indicators.iter().any(|&indicator| command_lower.contains(indicator))
}

fn identify_mcp_server(command_line: &str) -> (String, String) {
    let command_lower = command_line.to_lowercase();
    
    // Try to identify the server type and source
    if command_lower.contains("@azure/mcp") || command_lower.contains("azure") {
        ("Azure MCP Server".to_string(), "copilot".to_string())
    } else if command_lower.contains("mcp-kubernetes") || command_lower.contains("kubernetes") {
        ("Kubernetes MCP Server".to_string(), "copilot".to_string())
    } else if command_lower.contains("filesystem") {
        ("Filesystem MCP Server".to_string(), "system".to_string())
    } else if command_lower.contains("github") {
        ("GitHub MCP Server".to_string(), "system".to_string())
    } else if command_lower.contains("sqlite") {
        ("SQLite MCP Server".to_string(), "system".to_string())
    } else if command_lower.contains("postgres") {
        ("PostgreSQL MCP Server".to_string(), "system".to_string())
    } else if command_lower.contains("brave") {
        ("Brave Search MCP Server".to_string(), "system".to_string())
    } else if command_lower.contains("copilot") {
        ("Copilot MCP Server".to_string(), "copilot".to_string())
    } else if command_lower.contains("npx") && command_lower.contains("mcp") {
        ("NPX MCP Server".to_string(), "copilot".to_string())
    } else {
        ("Unknown MCP Server".to_string(), "unknown".to_string())
    }
}

fn parse_command_line(command_line: &str) -> (String, Vec<String>) {
    let parts: Vec<&str> = command_line.split_whitespace().collect();
    if parts.is_empty() {
        return ("".to_string(), vec![]);
    }
    
    let command = parts[0].to_string();
    let args = parts[1..].iter().map(|&s| s.to_string()).collect();
    
    (command, args)
}

fn get_vscode_settings_paths() -> Vec<PathBuf> {
    let mut paths = Vec::new();
    
    if let Ok(home) = std::env::var("HOME") {
        // User settings
        paths.push(PathBuf::from(format!(
            "{}/Library/Application Support/Code/User/settings.json", 
            home
        )));
        
        // Workspace settings (this is harder to find automatically)
        // We'll check common workspace locations
        let common_workspace_dirs = [
            format!("{}/Desktop", home),
            format!("{}/Documents", home),
            format!("{}/Projects", home),
            format!("{}/workspace", home),
            format!("{}/dev", home),
        ];
        
        for workspace_dir in common_workspace_dirs {
            if let Ok(entries) = fs::read_dir(&workspace_dir) {
                for entry in entries.flatten() {
                    if entry.file_type().map(|ft| ft.is_dir()).unwrap_or(false) {
                        let vscode_settings = entry.path().join(".vscode").join("settings.json");
                        if vscode_settings.exists() {
                            paths.push(vscode_settings);
                        }
                    }
                }
            }
        }
    }
    
    paths
}

fn get_copilot_config_paths() -> Vec<PathBuf> {
    let mut paths = Vec::new();
    
    if let Ok(home) = std::env::var("HOME") {
        // GitHub Copilot configuration paths
        paths.push(PathBuf::from(format!(
            "{}/.config/github-copilot/hosts.json", 
            home
        )));
        
        paths.push(PathBuf::from(format!(
            "{}/.gitconfig", 
            home
        )));
        
        // VS Code Copilot extension settings
        paths.push(PathBuf::from(format!(
            "{}/Library/Application Support/Code/User/globalStorage/github.copilot",
            home
        )));
    }
    
    paths
}

fn extract_copilot_mcp_config(json: &serde_json::Value) -> Option<Vec<RunningMcpServer>> {
    let mut servers = Vec::new();
    
    // Look for direct MCP configuration in VS Code settings
    if let Some(mcp_config) = json.get("mcp") {
        if let Some(mcp_servers) = mcp_config.get("servers").and_then(|s| s.as_object()) {
            for (name, server_config) in mcp_servers {
                let command = server_config.get("command")
                    .and_then(|c| c.as_str())
                    .unwrap_or("")
                    .to_string();
                
                let args = server_config.get("args")
                    .and_then(|a| a.as_array())
                    .map(|arr| arr.iter()
                        .filter_map(|v| v.as_str())
                        .map(|s| s.to_string())
                        .collect())
                    .unwrap_or_default();
                
                servers.push(RunningMcpServer {
                    name: name.clone(),
                    pid: 0, // Not running, just configured
                    command,
                    args,
                    source: "copilot".to_string(),
                    config_path: None,
                });
            }
        }
    }
    
    // Also look for GitHub Copilot advanced MCP configuration
    if let Some(copilot_config) = json.get("github.copilot.advanced") {
        if let Some(mcp_config) = copilot_config.get("mcp") {
            if let Some(mcp_servers) = extract_mcp_servers_from_config(mcp_config, "copilot") {
                servers.extend(mcp_servers);
            }
        }
    }
    
    if servers.is_empty() {
        None
    } else {
        Some(servers)
    }
}

fn extract_mcp_servers_from_config(config: &serde_json::Value, source: &str) -> Option<Vec<RunningMcpServer>> {
    let mut servers = Vec::new();
    
    if let Some(servers_obj) = config.as_object() {
        for (name, server_config) in servers_obj {
            if let Some(command) = server_config.get("command").and_then(|c| c.as_str()) {
                let args = server_config.get("args")
                    .and_then(|a| a.as_array())
                    .map(|arr| arr.iter()
                        .filter_map(|v| v.as_str())
                        .map(|s| s.to_string())
                        .collect())
                    .unwrap_or_default();
                
                servers.push(RunningMcpServer {
                    name: name.clone(),
                    pid: 0, // Not running, just configured
                    command: command.to_string(),
                    args,
                    source: source.to_string(),
                    config_path: None,
                });
            }
        }
    }
    
    if servers.is_empty() {
        None
    } else {
        Some(servers)
    }
}

async fn get_claude_mcp_servers() -> Result<Vec<RunningMcpServer>, String> {
    // Skip Claude Desktop detection since it's not being used anymore
    // This avoids parsing old/invalid Claude configurations
    Ok(Vec::new())
}

// Function to strip comments and fix common JSON issues (for VS Code settings files)
fn strip_json_comments(content: &str) -> String {
    let mut cleaned = String::new();
    let mut in_string = false;
    let mut escape_next = false;
    let mut chars = content.chars().peekable();
    
    while let Some(ch) = chars.next() {
        if escape_next {
            cleaned.push(ch);
            escape_next = false;
            continue;
        }
        
        match ch {
            '"' if !escape_next => {
                in_string = !in_string;
                cleaned.push(ch);
            }
            '\\' if in_string => {
                escape_next = true;
                cleaned.push(ch);
            }
            '/' if !in_string => {
                if let Some(&'/') = chars.peek() {
                    // Line comment - skip to end of line
                    chars.next(); // consume second '/'
                    while let Some(next_ch) = chars.next() {
                        if next_ch == '\n' {
                            cleaned.push(next_ch);
                            break;
                        }
                    }
                } else if let Some(&'*') = chars.peek() {
                    // Block comment - skip to */
                    chars.next(); // consume '*'
                    let mut found_end = false;
                    while let Some(next_ch) = chars.next() {
                        if next_ch == '*' {
                            if let Some(&'/') = chars.peek() {
                                chars.next(); // consume '/'
                                found_end = true;
                                break;
                            }
                        }
                    }
                    if !found_end {
                        // Malformed comment, but continue
                    }
                } else {
                    cleaned.push(ch);
                }
            }
            _ => {
                cleaned.push(ch);
            }
        }
    }
    
    // Fix trailing commas (common in VS Code settings)
    fix_trailing_commas(&cleaned)
}

// Fix trailing commas in JSON
fn fix_trailing_commas(content: &str) -> String {
    let mut result = String::new();
    let mut chars = content.chars().peekable();
    
    while let Some(ch) = chars.next() {
        if ch == ',' {
            // Look ahead to see if this is a trailing comma
            let mut whitespace = String::new();
            let mut found_closing = false;
            
            // Collect whitespace and check for closing bracket/brace
            while let Some(&next_ch) = chars.peek() {
                if next_ch.is_whitespace() {
                    whitespace.push(chars.next().unwrap());
                } else if next_ch == '}' || next_ch == ']' {
                    found_closing = true;
                    break;
                } else {
                    break;
                }
            }
            
            if found_closing {
                // Skip the trailing comma, just add the whitespace
                result.push_str(&whitespace);
            } else {
                // Not a trailing comma, keep it
                result.push(ch);
                result.push_str(&whitespace);
            }
        } else {
            result.push(ch);
        }
    }
    
    result
}

// Kill a running MCP server by PID
#[tauri::command]
pub async fn kill_mcp_server(pid: u32) -> Result<(), String> {
    let output = Command::new("kill")
        .arg(pid.to_string())
        .output()
        .map_err(|e| format!("Failed to kill process: {}", e))?;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Failed to kill process {}: {}", pid, stderr));
    }
    
    Ok(())
}

// Get detailed information about a process
#[tauri::command]
pub async fn get_process_info(pid: u32) -> Result<Option<serde_json::Value>, String> {
    let output = Command::new("ps")
        .args(&["-p", &pid.to_string(), "-o", "pid,ppid,user,command"])
        .output()
        .map_err(|e| format!("Failed to get process info: {}", e))?;
    
    if !output.status.success() {
        return Ok(None);
    }
    
    let stdout = String::from_utf8_lossy(&output.stdout);
    let lines: Vec<&str> = stdout.lines().collect();
    
    if lines.len() < 2 {
        return Ok(None);
    }
    
    let process_line = lines[1];
    let parts: Vec<&str> = process_line.split_whitespace().collect();
    
    if parts.len() < 4 {
        return Ok(None);
    }
    
    let process_info = serde_json::json!({
        "pid": pid,
        "ppid": parts[1],
        "user": parts[2],
        "command": parts[3..].join(" ")
    });
    
    Ok(Some(process_info))
}
