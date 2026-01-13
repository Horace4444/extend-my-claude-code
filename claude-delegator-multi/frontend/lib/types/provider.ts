export interface ModelConfig {
  id: string;
  name: string;
  contextWindow: number;
  inputPrice: number;
  outputPrice: number;
  isLatest: boolean;
  deprecated: boolean;
}

export interface Provider {
  id: string;
  name: string;
  type: "openai" | "gemini" | "grok" | "anthropic" | "custom";

  endpoint: string;
  authType: "api_key" | "oauth" | "mcp";
  apiKey?: string;

  defaultModel: string;
  availableModels: ModelConfig[];

  pricing: {
    model: string;
    inputPer1M: number;
    outputPer1M: number;
    lastUpdated: Date;
  }[];

  status: "online" | "offline" | "degraded" | "unknown";
  lastHealthCheck: Date;

  usage: {
    period: string;
    tokens: { input: number; output: number };
    cost: number;
    requests: number;
  };
}
