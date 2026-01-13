export interface ExpertProviderConfig {
  enabled: boolean;
  model: string;
  promptFile: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface Expert {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "core" | "specialized";

  providers: {
    codex: ExpertProviderConfig | null;
    gemini: ExpertProviderConfig | null;
    grok: ExpertProviderConfig | null;
  };

  defaultProvider: "codex" | "gemini" | "grok";

  triggers: {
    keywords: string[];
    patterns: string[];
    priority: number;
  };

  stats: {
    totalCalls: number;
    totalTokens: { input: number; output: number };
    totalCost: number;
    avgLatencyMs: number;
    lastUsed: Date | null;
  };

  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ProviderId = "codex" | "gemini" | "grok";
