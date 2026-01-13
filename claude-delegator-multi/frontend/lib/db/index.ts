import Dexie, { Table } from "dexie";
import { Expert } from "@/lib/types/expert";
import { Provider } from "@/lib/types/provider";
import { DelegationLog } from "@/lib/types/log";

interface ModelPricing {
  id: string;
  provider: string;
  model: string;
  inputPer1M: number;
  outputPer1M: number;
  contextWindow: number;
  isLatest: boolean;
  syncedAt: Date;
}

export class ExpertControlPanelDB extends Dexie {
  experts!: Table<Expert>;
  providers!: Table<Provider>;
  logs!: Table<DelegationLog>;
  pricing!: Table<ModelPricing>;

  constructor() {
    super("ExpertControlPanel");

    this.version(1).stores({
      experts: "id, name, category, enabled, defaultProvider",
      providers: "id, name, type, status",
      logs: "id, timestamp, expertId, providerId, status",
      pricing: "id, provider, model, syncedAt",
    });
  }
}

export const db = new ExpertControlPanelDB();

export async function initializeDB() {
  const expertCount = await db.experts.count();
  if (expertCount === 0) {
    await seedDefaultExperts();
    await seedDefaultProviders();
  }
}

async function seedDefaultExperts() {
  const defaultExperts: Expert[] = [
    {
      id: "architect",
      name: "Architect",
      description: "System design, architecture decisions, technical planning",
      icon: "🏗️",
      category: "core",
      providers: {
        codex: { enabled: true, model: "gpt-5.2-codex", promptFile: "architect.md" },
        gemini: { enabled: true, model: "gemini-3-pro", promptFile: "architect.md" },
        grok: { enabled: true, model: "grok-code-fast-1", promptFile: "architect.md" },
      },
      defaultProvider: "codex",
      triggers: { keywords: ["architecture", "system design", "scalability"], patterns: [], priority: 1 },
      stats: { totalCalls: 0, totalTokens: { input: 0, output: 0 }, totalCost: 0, avgLatencyMs: 0, lastUsed: null },
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "code-reviewer",
      name: "Code Reviewer",
      description: "Code quality, best practices, refactoring suggestions",
      icon: "📝",
      category: "core",
      providers: {
        codex: { enabled: true, model: "gpt-5.2-codex", promptFile: "code-reviewer.md" },
        gemini: { enabled: true, model: "gemini-3-pro", promptFile: "code-reviewer.md" },
        grok: { enabled: true, model: "grok-code-fast-1", promptFile: "code-reviewer.md" },
      },
      defaultProvider: "codex",
      triggers: { keywords: ["review", "code quality", "refactor"], patterns: [], priority: 2 },
      stats: { totalCalls: 0, totalTokens: { input: 0, output: 0 }, totalCost: 0, avgLatencyMs: 0, lastUsed: null },
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "security-analyst",
      name: "Security Analyst",
      description: "Security vulnerabilities, OWASP compliance, threat modeling",
      icon: "🔒",
      category: "core",
      providers: {
        codex: { enabled: true, model: "gpt-5.2-codex", promptFile: "security-analyst.md" },
        gemini: { enabled: true, model: "gemini-3-pro", promptFile: "security-analyst.md" },
        grok: { enabled: true, model: "grok-code-fast-1", promptFile: "security-analyst.md" },
      },
      defaultProvider: "codex",
      triggers: { keywords: ["security", "vulnerability", "OWASP"], patterns: [], priority: 3 },
      stats: { totalCalls: 0, totalTokens: { input: 0, output: 0 }, totalCost: 0, avgLatencyMs: 0, lastUsed: null },
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "plan-reviewer",
      name: "Plan Reviewer",
      description: "Implementation plan validation, gap analysis",
      icon: "📋",
      category: "core",
      providers: {
        codex: { enabled: true, model: "gpt-5.2-codex", promptFile: "plan-reviewer.md" },
        gemini: { enabled: true, model: "gemini-3-pro", promptFile: "plan-reviewer.md" },
        grok: { enabled: true, model: "grok-code-fast-1", promptFile: "plan-reviewer.md" },
      },
      defaultProvider: "gemini",
      triggers: { keywords: ["plan", "implementation", "roadmap"], patterns: [], priority: 4 },
      stats: { totalCalls: 0, totalTokens: { input: 0, output: 0 }, totalCost: 0, avgLatencyMs: 0, lastUsed: null },
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "scope-analyst",
      name: "Scope Analyst",
      description: "Requirement analysis, effort estimation, risk assessment",
      icon: "🎯",
      category: "core",
      providers: {
        codex: { enabled: true, model: "gpt-5.2-codex", promptFile: "scope-analyst.md" },
        gemini: { enabled: true, model: "gemini-3-pro", promptFile: "scope-analyst.md" },
        grok: { enabled: true, model: "grok-code-fast-1", promptFile: "scope-analyst.md" },
      },
      defaultProvider: "gemini",
      triggers: { keywords: ["scope", "estimate", "requirements"], patterns: [], priority: 5 },
      stats: { totalCalls: 0, totalTokens: { input: 0, output: 0 }, totalCost: 0, avgLatencyMs: 0, lastUsed: null },
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "web-designer",
      name: "Web Designer",
      description: "UI/UX design, visual analysis, design systems",
      icon: "🎨",
      category: "specialized",
      providers: {
        codex: null,
        gemini: { enabled: true, model: "gemini-3-pro", promptFile: "web-designer.md" },
        grok: null,
      },
      defaultProvider: "gemini",
      triggers: { keywords: ["design", "UI", "UX", "visual"], patterns: [], priority: 6 },
      stats: { totalCalls: 0, totalTokens: { input: 0, output: 0 }, totalCost: 0, avgLatencyMs: 0, lastUsed: null },
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "website-developer",
      name: "Website Developer",
      description: "Frontend implementation, responsive design, accessibility",
      icon: "💻",
      category: "specialized",
      providers: {
        codex: null,
        gemini: { enabled: true, model: "gemini-3-pro", promptFile: "website-developer.md" },
        grok: null,
      },
      defaultProvider: "gemini",
      triggers: { keywords: ["frontend", "responsive", "accessibility"], patterns: [], priority: 7 },
      stats: { totalCalls: 0, totalTokens: { input: 0, output: 0 }, totalCost: 0, avgLatencyMs: 0, lastUsed: null },
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "documentation-expert",
      name: "Documentation Expert",
      description: "API docs, technical writing, README generation",
      icon: "📚",
      category: "specialized",
      providers: {
        codex: null,
        gemini: { enabled: true, model: "gemini-3-pro", promptFile: "documentation-expert.md" },
        grok: null,
      },
      defaultProvider: "gemini",
      triggers: { keywords: ["documentation", "docs", "README"], patterns: [], priority: 8 },
      stats: { totalCalls: 0, totalTokens: { input: 0, output: 0 }, totalCost: 0, avgLatencyMs: 0, lastUsed: null },
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "rapid-prototyper",
      name: "Rapid Prototyper",
      description: "Quick MVPs, proof-of-concepts, speed-focused development",
      icon: "⚡",
      category: "specialized",
      providers: {
        codex: null,
        gemini: null,
        grok: { enabled: true, model: "grok-code-fast-1", promptFile: "rapid-prototyper.md" },
      },
      defaultProvider: "grok",
      triggers: { keywords: ["prototype", "MVP", "quick"], patterns: [], priority: 9 },
      stats: { totalCalls: 0, totalTokens: { input: 0, output: 0 }, totalCost: 0, avgLatencyMs: 0, lastUsed: null },
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "bug-fixer",
      name: "Bug Fixer",
      description: "Fast debugging, error resolution, hot fixes",
      icon: "🐛",
      category: "specialized",
      providers: {
        codex: null,
        gemini: null,
        grok: { enabled: true, model: "grok-code-fast-1", promptFile: "bug-fixer.md" },
      },
      defaultProvider: "grok",
      triggers: { keywords: ["bug", "fix", "error", "debug"], patterns: [], priority: 10 },
      stats: { totalCalls: 0, totalTokens: { input: 0, output: 0 }, totalCost: 0, avgLatencyMs: 0, lastUsed: null },
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  await db.experts.bulkAdd(defaultExperts);
}

async function seedDefaultProviders() {
  const defaultProviders: Provider[] = [
    {
      id: "codex",
      name: "OpenAI Codex",
      type: "openai",
      endpoint: "https://api.openai.com/v1",
      authType: "api_key",
      defaultModel: "gpt-5.2-codex",
      availableModels: [
        { id: "gpt-5.2-codex", name: "GPT-5.2 Codex", contextWindow: 400000, inputPrice: 1.75, outputPrice: 14.0, isLatest: true, deprecated: false },
      ],
      pricing: [{ model: "gpt-5.2-codex", inputPer1M: 1.75, outputPer1M: 14.0, lastUpdated: new Date() }],
      status: "unknown",
      lastHealthCheck: new Date(),
      usage: { period: new Date().toISOString().slice(0, 7), tokens: { input: 0, output: 0 }, cost: 0, requests: 0 },
    },
    {
      id: "gemini",
      name: "Google Gemini",
      type: "gemini",
      endpoint: "https://generativelanguage.googleapis.com/v1",
      authType: "api_key",
      defaultModel: "gemini-3-pro",
      availableModels: [
        { id: "gemini-3-pro", name: "Gemini 3 Pro", contextWindow: 2000000, inputPrice: 2.0, outputPrice: 12.0, isLatest: true, deprecated: false },
      ],
      pricing: [{ model: "gemini-3-pro", inputPer1M: 2.0, outputPer1M: 12.0, lastUpdated: new Date() }],
      status: "unknown",
      lastHealthCheck: new Date(),
      usage: { period: new Date().toISOString().slice(0, 7), tokens: { input: 0, output: 0 }, cost: 0, requests: 0 },
    },
    {
      id: "grok",
      name: "xAI Grok",
      type: "grok",
      endpoint: "https://api.x.ai/v1",
      authType: "api_key",
      defaultModel: "grok-code-fast-1",
      availableModels: [
        { id: "grok-code-fast-1", name: "Grok Code Fast-1", contextWindow: 128000, inputPrice: 0.2, outputPrice: 1.5, isLatest: true, deprecated: false },
      ],
      pricing: [{ model: "grok-code-fast-1", inputPer1M: 0.2, outputPer1M: 1.5, lastUpdated: new Date() }],
      status: "unknown",
      lastHealthCheck: new Date(),
      usage: { period: new Date().toISOString().slice(0, 7), tokens: { input: 0, output: 0 }, cost: 0, requests: 0 },
    },
  ];

  await db.providers.bulkAdd(defaultProviders);
}
