"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Expert, ProviderId } from "@/lib/types/expert";
import { useExpertStore } from "@/lib/stores/expertStore";
import Link from "next/link";

interface ExpertCardProps {
  expert: Expert;
}

export function ExpertCard({ expert }: ExpertCardProps) {
  const { toggleProvider } = useExpertStore();

  const providerCount = (["codex", "gemini", "grok"] as const).filter(
    (p) => expert.providers[p]?.enabled
  ).length;

  const availableProviders = (["codex", "gemini", "grok"] as const).filter(
    (p) => expert.providers[p] !== null
  ).length;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{expert.icon}</span>
            <CardTitle className="text-lg">{expert.name}</CardTitle>
          </div>
          <Badge variant={expert.enabled ? "default" : "secondary"}>
            {providerCount}/{availableProviders}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {expert.description}
        </p>

        <div className="space-y-2">
          {(["codex", "gemini", "grok"] as const).map((providerId) => {
            const config = expert.providers[providerId];
            if (!config) return null;

            return (
              <div
                key={providerId}
                className="flex items-center justify-between"
              >
                <span className="text-sm capitalize flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      providerId === "codex"
                        ? "bg-codex"
                        : providerId === "gemini"
                        ? "bg-gemini"
                        : "bg-grok"
                    }`}
                  />
                  {providerId}
                </span>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={() => toggleProvider(expert.id, providerId)}
                />
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            Default: {expert.defaultProvider}
          </span>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/experts/${expert.id}`}>Edit</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
