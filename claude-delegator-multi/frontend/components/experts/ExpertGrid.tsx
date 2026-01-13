"use client";

import { Expert } from "@/lib/types/expert";
import { ExpertCard } from "./ExpertCard";

interface ExpertGridProps {
  experts: Expert[];
  category?: "core" | "specialized";
}

export function ExpertGrid({ experts, category }: ExpertGridProps) {
  const filteredExperts = category
    ? experts.filter((e) => e.category === category)
    : experts;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredExperts.map((expert) => (
        <ExpertCard key={expert.id} expert={expert} />
      ))}
    </div>
  );
}
