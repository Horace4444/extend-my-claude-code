"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useExpertStore } from "@/lib/stores/expertStore";
import { useProviderStore } from "@/lib/stores/providerStore";
import { useCostStore } from "@/lib/stores/costStore";
import { Users, Server, DollarSign, CheckCircle } from "lucide-react";

export default function Dashboard() {
  const { experts } = useExpertStore();
  const { providers } = useProviderStore();
  const { totalCost } = useCostStore();

  const enabledExperts = experts.filter((e) => e.enabled).length;
  const onlineProviders = providers.filter((p) => p.status === "online").length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Experts
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{enabledExperts}/{experts.length}</div>
            <p className="text-xs text-muted-foreground">enabled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Providers
            </CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{onlineProviders}/{providers.length}</div>
            <p className="text-xs text-muted-foreground">online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">estimate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="success">Ready</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">all systems operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expert Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Expert Roster</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {experts.slice(0, 5).map((expert) => (
                <div
                  key={expert.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{expert.icon}</span>
                    <div>
                      <p className="font-medium">{expert.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {expert.description.slice(0, 40)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {expert.providers.codex?.enabled && (
                      <Badge variant="outline" className="text-xs bg-codex/10 text-codex border-codex/30">C</Badge>
                    )}
                    {expert.providers.gemini?.enabled && (
                      <Badge variant="outline" className="text-xs bg-gemini/10 text-gemini border-gemini/30">G</Badge>
                    )}
                    {expert.providers.grok?.enabled && (
                      <Badge variant="outline" className="text-xs bg-grok/10 text-grok border-grok/30">X</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Provider Status */}
        <Card>
          <CardHeader>
            <CardTitle>Provider Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{provider.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {provider.defaultModel}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">
                        ${provider.pricing[0]?.inputPer1M} / ${provider.pricing[0]?.outputPer1M}
                      </p>
                      <p className="text-xs text-muted-foreground">per 1M tokens</p>
                    </div>
                    <Badge
                      variant={provider.status === "online" ? "success" : "secondary"}
                    >
                      {provider.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Delegations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No recent delegations</p>
            <p className="text-sm">Delegation logs will appear here once you start using the system</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
