export interface DelegationLog {
  id: string;
  timestamp: Date;

  expertId: string;
  expertName: string;

  providerId: string;
  providerName: string;
  model: string;

  task: string;
  fullPrompt?: string;

  response?: string;
  status: "success" | "error" | "timeout";
  errorMessage?: string;

  tokens: {
    input: number;
    output: number;
  };
  cost: number;
  latencyMs: number;

  sessionId?: string;
  metadata?: Record<string, unknown>;
}
