"use client";

import { useExpertStore } from "@/lib/stores/expertStore";
import { ExpertGrid } from "@/components/experts/ExpertGrid";
import { Button } from "@/components/ui/button";
import { Download, Plus } from "lucide-react";

export default function ExpertsPage() {
  const { experts, loading } = useExpertStore();

  const coreExperts = experts.filter((e) => e.category === "core");
  const specializedExperts = experts.filter((e) => e.category === "specialized");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading experts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Experts</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Expert
          </Button>
        </div>
      </div>

      {/* Core Experts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Core Experts</h2>
          <span className="text-sm text-muted-foreground">
            Available on all providers
          </span>
        </div>
        <ExpertGrid experts={coreExperts} />
      </div>

      {/* Specialized Experts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Specialized Experts</h2>
          <span className="text-sm text-muted-foreground">
            Provider-specific capabilities
          </span>
        </div>
        <ExpertGrid experts={specializedExperts} />
      </div>
    </div>
  );
}
