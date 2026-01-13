import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Provider } from "@/lib/types/provider";
import { db } from "@/lib/db";

interface ProviderState {
  providers: Provider[];
  loading: boolean;
  error: string | null;

  loadProviders: () => Promise<void>;
  updateProvider: (providerId: string, updates: Partial<Provider>) => Promise<void>;
  setApiKey: (providerId: string, apiKey: string) => Promise<void>;
  checkHealth: (providerId: string) => Promise<void>;
}

export const useProviderStore = create<ProviderState>()(
  persist(
    (set, get) => ({
      providers: [],
      loading: false,
      error: null,

      loadProviders: async () => {
        set({ loading: true, error: null });
        try {
          const providers = await db.providers.toArray();
          set({ providers, loading: false });
        } catch (error) {
          set({ error: (error as Error).message, loading: false });
        }
      },

      updateProvider: async (providerId, updates) => {
        const provider = get().providers.find((p) => p.id === providerId);
        if (!provider) return;

        const updated = { ...provider, ...updates };
        await db.providers.put(updated);
        set({
          providers: get().providers.map((p) =>
            p.id === providerId ? updated : p
          ),
        });
      },

      setApiKey: async (providerId, apiKey) => {
        await get().updateProvider(providerId, { apiKey });
      },

      checkHealth: async (providerId) => {
        const provider = get().providers.find((p) => p.id === providerId);
        if (!provider) return;

        // Simple health check - in production would actually call the API
        const status = provider.apiKey ? "online" : "offline";
        await get().updateProvider(providerId, {
          status,
          lastHealthCheck: new Date(),
        });
      },
    }),
    {
      name: "provider-store",
      partialize: (state) => ({ providers: state.providers }),
    }
  )
);
