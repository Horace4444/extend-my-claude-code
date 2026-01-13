import { create } from "zustand";
import { db } from "@/lib/db";

interface DailyCost {
  date: string;
  cost: number;
}

interface ProviderBreakdown {
  provider: string;
  cost: number;
  percentage: number;
}

interface CostState {
  dailyCosts: DailyCost[];
  providerBreakdown: ProviderBreakdown[];
  totalCost: number;
  totalTokens: number;
  loading: boolean;

  loadCosts: () => Promise<void>;
  calculateCost: (inputTokens: number, outputTokens: number, providerId: string) => number;
}

export const useCostStore = create<CostState>((set, get) => ({
  dailyCosts: [],
  providerBreakdown: [],
  totalCost: 0,
  totalTokens: 0,
  loading: false,

  loadCosts: async () => {
    set({ loading: true });
    try {
      const logs = await db.logs.toArray();

      // Calculate daily costs
      const dailyMap = new Map<string, number>();
      const providerMap = new Map<string, number>();
      let totalCost = 0;
      let totalTokens = 0;

      logs.forEach((log) => {
        const date = new Date(log.timestamp).toISOString().slice(0, 10);
        dailyMap.set(date, (dailyMap.get(date) || 0) + log.cost);
        providerMap.set(log.providerId, (providerMap.get(log.providerId) || 0) + log.cost);
        totalCost += log.cost;
        totalTokens += log.tokens.input + log.tokens.output;
      });

      const dailyCosts = Array.from(dailyMap.entries())
        .map(([date, cost]) => ({ date, cost }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const providerBreakdown = Array.from(providerMap.entries()).map(
        ([provider, cost]) => ({
          provider,
          cost,
          percentage: totalCost > 0 ? (cost / totalCost) * 100 : 0,
        })
      );

      set({
        dailyCosts,
        providerBreakdown,
        totalCost,
        totalTokens,
        loading: false,
      });
    } catch (error) {
      console.error("Failed to load costs:", error);
      set({ loading: false });
    }
  },

  calculateCost: (inputTokens, outputTokens, providerId) => {
    const pricing: Record<string, { input: number; output: number }> = {
      codex: { input: 1.75, output: 14.0 },
      gemini: { input: 2.0, output: 12.0 },
      grok: { input: 0.2, output: 1.5 },
    };

    const rates = pricing[providerId] || { input: 0, output: 0 };
    return (inputTokens / 1_000_000) * rates.input + (outputTokens / 1_000_000) * rates.output;
  },
}));
