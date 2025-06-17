// Test file to verify our MCP detection logic
use std::process::Command;

// Copy the relevant functions from our process_detection.rs for testing
fn test_process_detection() {
    println!("=== Testing Process Detection ===");
    
    // Test ps command
    let output = Command::new("ps")
        .args(&["aux"])
        .output()
        .expect("Failed to execute ps command");
        
    let stdout = String::from_utf8_lossy(&output.stdout);
    let processes: Vec<&str> = stdout.lines().collect();
    
    println!("Found {} total processes", processes.len());
    
    // Look for MCP-related processes
    let mcp_patterns = [
        "mcp",
        "uvx",
        "python -m",
        "node.*mcp",
        "typescript.*copilot",
    ];
    
    let mut found_processes = Vec::new();
    
    for line in processes {
        for pattern in &mcp_patterns {
            if line.to_lowercase().contains(&pattern.to_lowercase()) {
                found_processes.push(line);
                break;
            }
        }
    }
    
    println!("Found {} potential MCP processes:", found_processes.len());
    for (i, process) in found_processes.iter().enumerate() {
        println!("{}. {}", i + 1, process);
    }
}

fn test_claude_config() {
    println!("\n=== Testing Claude Configuration ===");
    
    let home = std::env::var("HOME").unwrap_or_default();
    let claude_config_path = format!(
        "{}/Library/Application Support/Claude/claude_desktop_config.json",
        home
    );
    
    match std::fs::read_to_string(&claude_config_path) {
        Ok(content) => {
            println!("Claude config found at: {}", claude_config_path);
            println!("Content preview (first 200 chars):");
            let preview = if content.len() > 200 {
                &content[..200]
            } else {
                &content
            };
            println!("{}", preview);
        }
        Err(e) => println!("No Claude config found: {}", e),
    }
}

fn test_vscode_settings() {
    println!("\n=== Testing VS Code Settings ===");
    
    let home = std::env::var("HOME").unwrap_or_default();
    let vscode_settings_path = format!(
        "{}/Library/Application Support/Code/User/settings.json",
        home
    );
    
    match std::fs::read_to_string(&vscode_settings_path) {
        Ok(content) => {
            println!("VS Code settings found at: {}", vscode_settings_path);
            
            // Look for MCP or Copilot related settings
            let lines: Vec<&str> = content.lines().collect();
            let mut relevant_lines = Vec::new();
            
            for line in lines {
                let lower_line = line.to_lowercase();
                if lower_line.contains("mcp") || 
                   lower_line.contains("copilot") || 
                   lower_line.contains("azure") {
                    relevant_lines.push(line.trim());
                }
            }
            
            if !relevant_lines.is_empty() {
                println!("Found {} relevant configuration lines:", relevant_lines.len());
                for line in relevant_lines {
                    println!("  {}", line);
                }
            } else {
                println!("No MCP/Copilot related settings found");
            }
        }
        Err(e) => println!("No VS Code settings found: {}", e),
    }
}

fn main() {
    test_process_detection();
    test_claude_config();
    test_vscode_settings();
    
    println!("\n=== Test Complete ===");
    println!("If you can see MCP servers listed above, the detection logic is working!");
}
