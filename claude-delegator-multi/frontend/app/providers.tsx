"use client";

import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initializeDB } from "@/lib/db";
import { useExpertStore } from "@/lib/stores/expertStore";
import { useProviderStore } from "@/lib/stores/providerStore";

const queryClient = new QueryClient();

function DataInitializer({ children }: { children: React.ReactNode }) {
  const loadExperts = useExpertStore((state) => state.loadExperts);
  const loadProviders = useProviderStore((state) => state.loadProviders);

  useEffect(() => {
    const init = async () => {
      await initializeDB();
      await loadExperts();
      await loadProviders();
    };
    init();
  }, [loadExperts, loadProviders]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <DataInitializer>{children}</DataInitializer>
    </QueryClientProvider>
  );
}
