import { HotkeyInput } from "@/components/HotkeyInput";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClaudeConfig as ClaudeConfigComponent } from "@/components/ClaudeConfig";
import type { ClaudeConfig, ServerStatus } from "@/types";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useClaudeConfig } from "@/hooks/useClaudeConfig";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ConfigPageProps {
  claudeConfig: ClaudeConfig | null;
  configPath: string;
  serverStatus: ServerStatus;
  selectedPath: Record<string, string>;
  onSelectDirectory: (name: string) => void;
  onControlServer: (name: string, action: "start" | "stop") => void;
  onUninstallServer: (name: string) => void;
  onConfigChange: (config: ClaudeConfig | null) => void;
}

export function ConfigPage({
  claudeConfig,
  configPath,
  serverStatus,
  selectedPath,
  onSelectDirectory,
  onControlServer,
  onUninstallServer,
  onConfigChange,
}: ConfigPageProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { checkClaudeConfig } = useClaudeConfig((templateName) => {
    onSelectDirectory(templateName);
  });

  useEffect(() => {
    console.log("Config page received:", {
      claudeConfig,
      serverStatus,
      configPath
    });
  }, [claudeConfig, serverStatus, configPath]);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        console.log("Loading config...");
        const newConfig = await checkClaudeConfig();
        console.log("Loaded new config:", newConfig);
        onConfigChange(newConfig);
      } catch (error) {
        console.error("Failed to load config:", error);
      }
    };

    loadConfig();
  }, []);

  const refreshConfig = async () => {
    try {
      console.log("Refreshing config...");
      const newConfig = await checkClaudeConfig();
      console.log("Refreshed config:", newConfig);
      onConfigChange(newConfig);
    } catch (error) {
      console.error("Failed to refresh config:", error);
    }
  };

  const handleUninstall = async (name: string) => {
    try {
      await onUninstallServer(name);
      await refreshConfig();
    } catch (error) {
      console.error("Failed to uninstall server:", error);
    }
  };

  const handleControlServer = async (name: string, action: "start" | "stop") => {
    try {
      await onControlServer(name, action);
      await refreshConfig();
    } catch (error) {
      console.error(`Failed to ${action} server:`, error);
    }
  };

  const handleHotkeyChange = async (hotkey: string) => {
    try {
      setIsUpdating(true);
      await invoke("update_global_shortcut_command", { shortcut: hotkey });
      await refreshConfig();
    } catch (error) {
      console.error("Failed to update global shortcut:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <PageLayout title="Configuration">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>MCP Services Control</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 h-9 px-3 bg-black text-white hover:bg-black/90 hover:text-white"
                  onClick={async () => {
                    try {
                      await invoke("restart_vscode_app");
                    } catch (error) {
                      console.error("Failed to restart VS Code:", error);
                    }
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Restart VS Code</span>
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Restart VS Code to apply GitHub Copilot MCP service updates
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Global Shortcut</CardTitle>
              </CardHeader>
              <CardContent>
                <HotkeyInput
                  value={claudeConfig?.globalShortcut || ""}
                  onChange={handleHotkeyChange}
                  disabled={isUpdating}
                />
                {isUpdating && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Updating shortcut...
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* GitHub Copilot MCP Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>GitHub Copilot MCP Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  Your GitHub Copilot MCP servers are configured in VS Code settings:
                </p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 block">
                  ~/Library/Application Support/Code/User/settings.json
                </code>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  To manage GitHub Copilot MCP servers, use the "All Servers" tab which shows 
                  all running MCP processes and configured servers from both Claude Desktop and VS Code.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-green-600 rounded"></div>
                <span className="text-muted-foreground">GitHub Copilot MCP servers detected</span>
              </div>
            </CardContent>
          </Card>

          {claudeConfig && (
            <div>
              <ClaudeConfigComponent
                claudeConfig={claudeConfig}
                serverStatus={serverStatus}
                selectedPath={selectedPath}
                onSelectDirectory={onSelectDirectory}
                onControlServer={handleControlServer}
                onUninstallServer={handleUninstall}
              />
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
