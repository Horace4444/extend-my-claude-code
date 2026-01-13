"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCostStore } from "@/lib/stores/costStore";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function CostsPage() {
  const { totalCost, totalTokens, providerBreakdown, dailyCosts, loading } = useCostStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cost Tracking</h1>
        <Button variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync Now
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Token Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(totalTokens / 1_000_000).toFixed(2)}M
            </div>
            <p className="text-xs text-muted-foreground">
              {totalTokens.toLocaleString()} tokens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Cost/Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground">No requests yet</p>
          </CardContent>
        </Card>
      </div>

      {/* Provider Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Cost by Provider</CardTitle>
        </CardHeader>
        <CardContent>
          {providerBreakdown.length > 0 ? (
            <div className="space-y-4">
              {providerBreakdown.map((item) => (
                <div key={item.provider} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{item.provider}</span>
                    <span>${item.cost.toFixed(2)} ({item.percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.provider === "codex"
                          ? "bg-codex"
                          : item.provider === "gemini"
                          ? "bg-gemini"
                          : "bg-grok"
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No cost data available yet</p>
              <p className="text-sm">Start delegating tasks to see cost breakdown</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Model</th>
                  <th className="text-right py-2 font-medium">Input</th>
                  <th className="text-right py-2 font-medium">Output</th>
                  <th className="text-right py-2 font-medium">Context</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-codex" />
                      gpt-5.2-codex
                    </div>
                  </td>
                  <td className="text-right py-2">$1.75</td>
                  <td className="text-right py-2">$14.00</td>
                  <td className="text-right py-2">400K</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gemini" />
                      gemini-3-pro
                    </div>
                  </td>
                  <td className="text-right py-2">$2.00</td>
                  <td className="text-right py-2">$12.00</td>
                  <td className="text-right py-2">2M</td>
                </tr>
                <tr>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-grok" />
                      grok-code-fast-1
                    </div>
                  </td>
                  <td className="text-right py-2">$0.20</td>
                  <td className="text-right py-2">$1.50</td>
                  <td className="text-right py-2">128K</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Prices per 1M tokens. Source: ai-api-integrations skill
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
