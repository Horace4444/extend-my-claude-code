"use client";

import { useProviderStore } from "@/lib/stores/providerStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Settings, Plus } from "lucide-react";

export default function ProvidersPage() {
  const { providers, loading, checkHealth } = useProviderStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading providers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Providers</h1>
        <Button variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync Pricing
        </Button>
      </div>

      <div className="space-y-4">
        {providers.map((provider) => (
          <Card key={provider.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    provider.id === "codex"
                      ? "bg-codex"
                      : provider.id === "gemini"
                      ? "bg-gemini"
                      : "bg-grok"
                  }`}
                />
                <CardTitle>{provider.name}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    provider.status === "online"
                      ? "success"
                      : provider.status === "offline"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {provider.status}
                </Badge>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Model</p>
                  <p className="font-medium">{provider.defaultModel}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Endpoint</p>
                  <p className="font-medium text-xs truncate">
                    {provider.endpoint}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pricing</p>
                  <p className="font-medium">
                    ${provider.pricing[0]?.inputPer1M} / $
                    {provider.pricing[0]?.outputPer1M}
                  </p>
                  <p className="text-xs text-muted-foreground">per 1M tokens</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="font-medium">
                    {(provider.usage.tokens.input + provider.usage.tokens.output).toLocaleString()} tokens
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ${provider.usage.cost.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">API Key</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-muted rounded text-sm">
                    {provider.apiKey
                      ? `••••••••••••${provider.apiKey.slice(-4)}`
                      : "Not configured"}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => checkHealth(provider.id)}
                  >
                    Test
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add Provider Card */}
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-8">
            <Button variant="ghost" className="flex flex-col h-auto py-4">
              <Plus className="h-8 w-8 mb-2 text-muted-foreground" />
              <span className="text-muted-foreground">Add Provider</span>
              <span className="text-xs text-muted-foreground mt-1">
                Claude (Anthropic) | Custom MCP | Local LLM
              </span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
