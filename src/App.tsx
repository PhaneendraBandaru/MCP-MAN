import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { StatusPage } from "./pages/Status";
import { ConfigPage } from "./pages/Config";
import { AllServersPage } from "./pages/AllServers";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { RotateCw } from "lucide-react";
import { useEnvironmentCheck } from "./hooks/useEnvironmentCheck";
import { useClaudeConfig } from "./hooks/useClaudeConfig";
import { useServerControl } from "./hooks/useServerControl";
import {
  ClaudeConfig,
  ServerStatus,
  McpServerArgs,
  McpServerTemplate,
} from "./types";
import "./App.css";
import { cn } from "./lib/utils";

function App() {
  const [pythonPath, setPythonPath] = useState<string>("");
  const [nodePath, setNodePath] = useState<string>("");
  const [uvPath, setUvPath] = useState<string>("");
  const [claudeConfig, setClaudeConfig] = useState<ClaudeConfig | null>(null);
  const [configPath, setConfigPath] = useState<string>("");
  const [claudeInstalled, setClaudeInstalled] = useState<string>("");
  const [serverStatus, setServerStatus] = useState<ServerStatus>({});
  const [selectedPath, setSelectedPath] = useState<Record<string, string>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, setMcpServers] = useState<Record<string, McpServerArgs>>({});

  const checkMcpServers = useCallback(async () => {
    try {
      const servers = await invoke<Record<string, McpServerArgs>>(
        "get_installed_mcp_servers"
      );
      setMcpServers(servers);
    } catch (error) {
      console.error("Error checking MCP servers:", error);
    }
  }, []);

  const getAvailableServers = useCallback(async () => {
    try {
      const templates = await invoke<McpServerTemplate[]>(
        "get_mcp_server_templates"
      );
      await Promise.all(
        templates.map(async (template: McpServerTemplate) => {
          const installed = await invoke<boolean>("is_mcp_server_installed", {
            name: template.name,
          });
          return { ...template, installed };
        })
      );
    } catch (error) {
      console.error("Error getting MCP server templates:", error);
    }
  }, []);

  const {
    checkEnvironments,
    checkClaudeInstalled,
    handleInstall,
    installing,
    installMessage,
  } = useEnvironmentCheck();
  const { checkClaudeConfig, getConfigPath, selectDirectory } = useClaudeConfig(
    (templateName: string, selectedPath: string) => {
      setSelectedPath((prev: Record<string, string>) => ({...prev, [templateName]: selectedPath}));
    }
  );
  const { uninstallServer, controlServer } = useServerControl(
    () => checkClaudeConfig().then(setClaudeConfig),
    checkMcpServers,
    getAvailableServers,
    {}
  );



  const initializeApp = useCallback(async () => {
    console.log("Starting initialization...");
    const [envs, config, path, claudeStatus] = await Promise.all([
      checkEnvironments(),
      checkClaudeConfig(),
      getConfigPath(),
      checkClaudeInstalled(),
    ]);

    console.log("Loaded config:", config);

    setPythonPath(envs.pythonPath);
    setNodePath(envs.nodePath);
    setUvPath(envs.uvPath);
    setClaudeConfig(config);
    setConfigPath(path);
    setClaudeInstalled(claudeStatus);

    await Promise.all([checkMcpServers(), getAvailableServers()]);
  }, [
    checkEnvironments,
    checkClaudeConfig,
    getConfigPath,
    checkClaudeInstalled,
    checkMcpServers,
    getAvailableServers,
  ]);

  const updateServerStatus = useCallback(async () => {
    if (!claudeConfig) return;

    try {
      const newStatus: ServerStatus = {};
      for (const name of Object.keys(claudeConfig.mcpServers)) {
        const status = await invoke<boolean>("get_server_status", { name });
        newStatus[name] = status;
      }
      setServerStatus(newStatus);
    } catch (error) {
      console.error("Error updating server status:", error);
    }
  }, [claudeConfig]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await initializeApp();
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [initializeApp]);

  const handleInstallWithUpdate = useCallback(
    async (type: string) => {
      const result = await handleInstall(type);
      if (result && result.success) {
        switch (type) {
          case "python":
            setPythonPath(result.pythonPath);
            break;
          case "node":
            setNodePath(result.nodePath);
            break;
          case "uv":
            setUvPath(result.uvPath);
            break;
          case "claude":
            await checkClaudeInstalled().then(setClaudeInstalled);
            break;
        }
      }
    },
    [handleInstall, checkClaudeInstalled]
  );

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  useEffect(() => {
    updateServerStatus();
  }, [updateServerStatus, claudeConfig]);

  useEffect(() => {
    console.log('Config changed:', claudeConfig);
    if (claudeConfig) {
      console.log('Installed servers:', Object.keys(claudeConfig.mcpServers));
    }
  }, [claudeConfig]);

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">
          <Card>
            <CardContent>
              <Routes>
                <Route
                  path="/"
                  element={
                    <StatusPage
                      pythonPath={pythonPath}
                      nodePath={nodePath}
                      uvPath={uvPath}
                      claudeInstalled={claudeInstalled}
                      installing={installing}
                      onInstall={handleInstallWithUpdate}
                      installMessage={installMessage}
                    />
                  }
                />
                <Route
                  path="/config"
                  element={
                    <ConfigPage
                      claudeConfig={claudeConfig}
                      configPath={configPath}
                      serverStatus={serverStatus}
                      selectedPath={selectedPath}
                      onSelectDirectory={selectDirectory}
                      onControlServer={controlServer}
                      onUninstallServer={uninstallServer}
                      onConfigChange={setClaudeConfig}
                    />
                  }
                />

                <Route
                  path="/all-servers"
                  element={<AllServersPage />}
                />
              </Routes>
            </CardContent>
          </Card>
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-6 right-6 rounded-full bg-[#1f1f1f] border-2 border-[#1f1f1f] shadow-md hover:bg-[#2f2f2f] hover:border-[#2f2f2f] text-white w-12 h-12 flex items-center justify-center"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RotateCw
              className={cn("h-5 w-5", isRefreshing && "animate-spin")}
            />
          </Button>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
