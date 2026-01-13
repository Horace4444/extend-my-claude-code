#!/usr/bin/env node
/**
 * xAI Grok MCP Server
 *
 * Direct API integration with xAI's Grok models.
 * Uses OpenAI-compatible API format for ease of integration.
 */

import { BaseMCPServer, DelegationResponse } from "./shared/mcp-base.js";

const XAI_API_KEY = process.env.XAI_API_KEY;
const BASE_URL = "https://api.x.ai/v1";
const MODEL_ID = process.env.GROK_MODEL || "grok-3-fast";

if (!XAI_API_KEY) {
  console.error("Error: XAI_API_KEY environment variable is required");
  process.exit(1);
}

interface GrokMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GrokResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class GrokMCPServer extends BaseMCPServer {
  constructor() {
    super({
      name: "grok",
      version: "1.0.0",
      model: MODEL_ID,
    });
  }

  protected getToolDefinition() {
    return {
      name: "grok",
      description: `Delegate task to xAI Grok (${MODEL_ID}) - Best for fast iterations, cost-effective coding, and real-time information`,
      inputSchema: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "Task description with full context",
          },
          "developer-instructions": {
            type: "string",
            description: "Expert system prompt",
          },
          sandbox: {
            type: "string",
            enum: ["read-only", "workspace-write"],
            description: "Sandbox mode (informational - Grok is read-only)",
          },
          cwd: {
            type: "string",
            description: "Working directory context",
          },
          expert: {
            type: "string",
            description: "Expert ID to load system prompt",
          },
        },
        required: ["prompt"],
      },
    };
  }

  protected async callProvider(
    prompt: string,
    systemPrompt: string
  ): Promise<DelegationResponse> {
    const messages: GrokMessage[] = [];

    if (systemPrompt) {
      messages.push({
        role: "system",
        content: systemPrompt,
      });
    }

    messages.push({
      role: "user",
      content: prompt,
    });

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${XAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages,
        temperature: 0.7,
        max_tokens: 16000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Grok API error (${response.status}): ${error}`);
    }

    const data = (await response.json()) as GrokResponse;

    if (!data.choices || data.choices.length === 0) {
      throw new Error("No response from Grok API");
    }

    return {
      content: data.choices[0].message.content,
      tokens: {
        input: data.usage?.prompt_tokens || 0,
        output: data.usage?.completion_tokens || 0,
      },
    };
  }
}

// Start server
const server = new GrokMCPServer();
server.start().catch((error) => {
  console.error("Failed to start Grok MCP server:", error);
  process.exit(1);
});
