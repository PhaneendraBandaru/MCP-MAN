import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { PageLayout } from "@/components/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, Play, Square, Info } from "lucide-react";
import type { SystemMcpServers, RunningMcpServer } from '../types';

export function AllServersPage() {
  const [systemServers, setSystemServers] = useState<SystemMcpServers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadAllServers = useCallback(async () => {
    try {
      setError(null);
      const servers = await invoke<SystemMcpServers>("get_all_mcp_servers");
      setSystemServers(servers);
    } catch (err) {
      console.error("Failed to load MCP servers:", err);
      const errorMessage = typeof err === 'string' ? err : 'Unknown error occurred';
      setError(`Failed to load servers: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllServers();
    setRefreshing(false);
  }, [loadAllServers]);

  const handleKillServer = useCallback(async (pid: number) => {
    try {
      await invoke("kill_mcp_server", { pid });
      await loadAllServers(); // Refresh the list
    } catch (err) {
      console.error("Failed to kill server:", err);
      setError(`Failed to stop server: ${err}`);
    }
  }, [loadAllServers]);

  const handleGetProcessInfo = useCallback(async (pid: number) => {
    try {
      const info = await invoke("get_process_info", { pid });
      console.log("Process info:", info);
      // You could show this in a modal or expand the card
    } catch (err) {
      console.error("Failed to get process info:", err);
    }
  }, []);

  useEffect(() => {
    loadAllServers();
  }, [loadAllServers]);

  const getSourceColor = (source: string) => {
    switch (source) {
      case "claude": return "bg-blue-100 text-blue-800";
      case "copilot": return "bg-green-100 text-green-800";
      case "system": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (pid: number) => {
    return pid > 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";
  };

  const renderServerCard = (server: RunningMcpServer, showActions: boolean = true) => (
    <Card key={`${server.source}-${server.name}-${server.pid}`} className="border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{server.name}</CardTitle>
            <div className="flex gap-2 mt-2">
              <Badge className={getSourceColor(server.source)}>
                {server.source}
              </Badge>
              <Badge className={getStatusColor(server.pid)}>
                {server.pid > 0 ? "Running" : "Configured"}
              </Badge>
              {server.pid > 0 && (
                <Badge variant="outline">
                  PID: {server.pid}
                </Badge>
              )}
            </div>
          </div>
          {showActions && (
            <div className="flex gap-2">
              {server.pid > 0 && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGetProcessInfo(server.pid)}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleKillServer(server.pid)}
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium text-gray-600">Command:</span>
            <p className="text-sm bg-gray-50 p-2 rounded mt-1 font-mono">
              {server.command}
            </p>
          </div>
          {server.args.length > 0 && (
            <div>
              <span className="text-sm font-medium text-gray-600">Arguments:</span>
              <p className="text-sm bg-gray-50 p-2 rounded mt-1 font-mono">
                {server.args.join(" ")}
              </p>
            </div>
          )}
          {server.config_path && (
            <div>
              <span className="text-sm font-medium text-gray-600">Config Path:</span>
              <p className="text-sm text-gray-500 mt-1 break-all">
                {server.config_path}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <PageLayout title="All MCP Servers">
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading MCP servers...</span>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="All MCP Servers">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span>Error loading MCP servers: {error}</span>
            </div>
            <Button onClick={handleRefresh} className="mt-4" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="All MCP Servers">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing all MCP servers detected on your system
          </div>
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Running Servers Section */}
        {systemServers?.running_servers && systemServers.running_servers.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Play className="h-5 w-5 text-green-600" />
              Running MCP Servers ({systemServers.running_servers.length})
            </h2>
            <div className="grid gap-4">
              {systemServers.running_servers.map(server => renderServerCard(server))}
            </div>
          </div>
        )}

        {/* Claude Servers Section */}
        {systemServers?.claude_servers && systemServers.claude_servers.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-600 rounded"></div>
              Claude Desktop Servers ({systemServers.claude_servers.length})
            </h2>
            <div className="grid gap-4">
              {systemServers.claude_servers.map(server => renderServerCard(server, false))}
            </div>
          </div>
        )}

        {/* GitHub Copilot Servers Section */}
        {systemServers?.copilot_servers && systemServers.copilot_servers.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <div className="w-5 h-5 bg-green-600 rounded"></div>
              GitHub Copilot Servers ({systemServers.copilot_servers.length})
            </h2>
            <div className="grid gap-4">
              {systemServers.copilot_servers.map(server => renderServerCard(server, false))}
            </div>
          </div>
        )}

        {/* No servers found */}
        {(!systemServers?.running_servers?.length && 
          !systemServers?.claude_servers?.length && 
          !systemServers?.copilot_servers?.length) && (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No MCP Servers Found
              </h3>
              <p className="text-gray-600">
                No MCP servers were detected on your system. Make sure you have:
              </p>
              <ul className="text-left text-gray-600 mt-4 space-y-1">
                <li>• Claude Desktop with MCP servers configured</li>
                <li>• GitHub Copilot with MCP integration enabled</li>
                <li>• Any standalone MCP servers running</li>
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Summary Card */}
        {systemServers && (
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-green-600">
                    {systemServers.running_servers?.length || 0}
                  </span>
                  <span className="text-gray-600"> running</span>
                </div>
                <div>
                  <span className="font-medium text-blue-600">
                    {systemServers.claude_servers?.length || 0}
                  </span>
                  <span className="text-gray-600"> Claude</span>
                </div>
                <div>
                  <span className="font-medium text-green-600">
                    {systemServers.copilot_servers?.length || 0}
                  </span>
                  <span className="text-gray-600"> Copilot</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
