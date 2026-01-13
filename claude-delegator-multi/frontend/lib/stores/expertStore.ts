import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Expert, ProviderId } from "@/lib/types/expert";
import { db } from "@/lib/db";

interface ExpertState {
  experts: Expert[];
  loading: boolean;
  error: string | null;

  loadExperts: () => Promise<void>;
  toggleProvider: (expertId: string, providerId: ProviderId) => Promise<void>;
  updateExpert: (expertId: string, updates: Partial<Expert>) => Promise<void>;
  setDefaultProvider: (expertId: string, providerId: ProviderId) => Promise<void>;
  toggleExpert: (expertId: string) => Promise<void>;
}

export const useExpertStore = create<ExpertState>()(
  persist(
    (set, get) => ({
      experts: [],
      loading: false,
      error: null,

      loadExperts: async () => {
        set({ loading: true, error: null });
        try {
          const experts = await db.experts.toArray();
          set({ experts, loading: false });
        } catch (error) {
          set({ error: (error as Error).message, loading: false });
        }
      },

      toggleProvider: async (expertId, providerId) => {
        const expert = get().experts.find((e) => e.id === expertId);
        if (!expert) return;

        const config = expert.providers[providerId];
        if (!config) return;

        const updated: Expert = {
          ...expert,
          providers: {
            ...expert.providers,
            [providerId]: {
              ...config,
              enabled: !config.enabled,
            },
          },
          updatedAt: new Date(),
        };

        await db.experts.put(updated);
        set({
          experts: get().experts.map((e) => (e.id === expertId ? updated : e)),
        });
      },

      updateExpert: async (expertId, updates) => {
        const expert = get().experts.find((e) => e.id === expertId);
        if (!expert) return;

        const updated = { ...expert, ...updates, updatedAt: new Date() };
        await db.experts.put(updated);
        set({
          experts: get().experts.map((e) => (e.id === expertId ? updated : e)),
        });
      },

      setDefaultProvider: async (expertId, providerId) => {
        await get().updateExpert(expertId, { defaultProvider: providerId });
      },

      toggleExpert: async (expertId) => {
        const expert = get().experts.find((e) => e.id === expertId);
        if (!expert) return;

        await get().updateExpert(expertId, { enabled: !expert.enabled });
      },
    }),
    {
      name: "expert-store",
      partialize: (state) => ({ experts: state.experts }),
    }
  )
);
