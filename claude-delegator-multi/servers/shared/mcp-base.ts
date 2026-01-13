/**
 * Base MCP Server for claude-delegator-multi
 * Provides common functionality for all provider servers
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";

export interface DelegationRequest {
  prompt: string;
  "developer-instructions"?: string;
  sandbox?: "read-only" | "workspace-write";
  cwd?: string;
  expert?: string;
  images?: string[];
}

export interface DelegationResponse {
  content: string;
  tokens: {
    input: number;
    output: number;
  };
}

export interface ProviderConfig {
  name: string;
  version: string;
  model: string;
}

export abstract class BaseMCPServer {
  protected server: Server;
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.server = new Server(
      {
        name: `claude-delegator-${config.name}`,
        version: config.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
  }

  /**
   * Load expert system prompt from file
   */
  protected async loadExpertPrompt(expertId: string): Promise<string> {
    const possiblePaths = [
      path.join(__dirname, "..", "..", "prompts", `${expertId}.md`),
      path.join(process.cwd(), "prompts", `${expertId}.md`),
      path.join(
        process.env.CLAUDE_PLUGIN_ROOT || "",
        "prompts",
        `${expertId}.md`
      ),
    ];

    for (const promptPath of possiblePaths) {
      try {
        if (fs.existsSync(promptPath)) {
          return fs.readFileSync(promptPath, "utf-8");
        }
      } catch {
        continue;
      }
    }

    console.error(`Expert prompt not found for: ${expertId}`);
    return "";
  }

  /**
   * Abstract method - each provider implements their API call
   */
  protected abstract callProvider(
    prompt: string,
    systemPrompt: string,
    images?: string[]
  ): Promise<DelegationResponse>;

  /**
   * Get the tool definition for this provider
   */
  protected abstract getToolDefinition(): {
    name: string;
    description: string;
    inputSchema: object;
  };

  /**
   * Setup request handlers
   */
  protected setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [this.getToolDefinition()],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const args = request.params.arguments as DelegationRequest;

      // Load expert prompt if specified
      let systemPrompt = args["developer-instructions"] || "";
      if (args.expert && !systemPrompt) {
        systemPrompt = await this.loadExpertPrompt(args.expert);
      }

      try {
        const result = await this.callProvider(
          args.prompt,
          systemPrompt,
          args.images
        );

        return {
          content: [
            {
              type: "text",
              text: result.content,
            },
          ],
          _meta: {
            provider: this.config.name,
            model: this.config.model,
            tokens: result.tokens,
          },
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text",
              text: `Error from ${this.config.name}: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    this.setupHandlers();
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`${this.config.name} MCP server started`);
  }
}

/**
 * Estimate cost for a delegation
 */
export function estimateCost(
  provider: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing: Record<string, { input: number; output: number }> = {
    codex: { input: 1.75, output: 14.0 },
    gemini: { input: 2.0, output: 12.0 },
    grok: { input: 0.2, output: 1.5 },
  };

  const prices = pricing[provider] || { input: 1, output: 5 };
  return (inputTokens * prices.input + outputTokens * prices.output) / 1_000_000;
}
