"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useExpertStore } from "@/lib/stores/expertStore";
import { Upload, Plus, FileText } from "lucide-react";
import Link from "next/link";

export default function PromptsPage() {
  const { experts } = useExpertStore();

  const coreExperts = experts.filter((e) => e.category === "core");
  const specializedExperts = experts.filter((e) => e.category === "specialized");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Prompt Library</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prompt List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Core Experts</CardTitle>
            </CardHeader>
            <CardContent className="py-0">
              <div className="space-y-1">
                {coreExperts.map((expert) => (
                  <Link
                    key={expert.id}
                    href={`/prompts/${expert.id}`}
                    className="flex items-center gap-2 p-2 rounded hover:bg-muted transition-colors"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{expert.id}.md</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Specialized</CardTitle>
            </CardHeader>
            <CardContent className="py-0">
              <div className="space-y-1">
                {specializedExperts.map((expert) => (
                  <Link
                    key={expert.id}
                    href={`/prompts/${expert.id}`}
                    className="flex items-center gap-2 p-2 rounded hover:bg-muted transition-colors"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{expert.id}.md</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Templates</CardTitle>
            </CardHeader>
            <CardContent className="py-0">
              <div className="space-y-1">
                <Link
                  href="/prompts/delegation-format"
                  className="flex items-center gap-2 p-2 rounded hover:bg-muted transition-colors"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">delegation-format.md</span>
                </Link>
                <Link
                  href="/prompts/7-section"
                  className="flex items-center gap-2 p-2 rounded hover:bg-muted transition-colors"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">7-section-template.md</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-6 min-h-[400px]">
              <div className="text-center text-muted-foreground py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a prompt to preview</p>
                <p className="text-sm mt-2">
                  Click on any prompt file to view its contents
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
