"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProviderStore } from "@/lib/stores/providerStore";
import { RefreshCw, HelpCircle } from "lucide-react";

export function Header() {
  const { providers } = useProviderStore();

  const onlineCount = providers.filter((p) => p.status === "online").length;
  const totalCount = providers.length;

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">AI Orchestrator Control Panel</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Provider Status */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Providers:</span>
          <Badge variant={onlineCount === totalCount ? "success" : "warning"}>
            {onlineCount}/{totalCount} online
          </Badge>
        </div>

        {/* Quick Actions */}
        <Button variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync
        </Button>

        <Button variant="ghost" size="icon">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
