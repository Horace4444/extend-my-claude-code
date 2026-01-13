/**
 * Production Agent Template
 *
 * A production-ready template for Claude Agent SDK agents with:
 * - Custom tool integration
 * - Error handling
 * - Monitoring/observability
 * - Type safety
 */

import { query, tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  agentName: "MyAgent",
  version: "1.0.0",
  allowedTools: ["Read", "Edit", "Glob"],
  permissionMode: "acceptEdits" as const,
  systemPrompt: `You are a specialized agent for [DOMAIN].

Your responsibilities:
- [RESPONSIBILITY 1]
- [RESPONSIBILITY 2]
- [RESPONSIBILITY 3]

Guidelines:
- Be precise and thorough
- Always validate inputs
- Provide clear reasoning
`
};

// ============================================================================
// Custom Tools
// ============================================================================

const customTools = createSdkMcpServer({
  name: "my-tools",
  version: CONFIG.version,
  tools: [
    tool(
      "example_tool",
      "Example tool that processes data",
      {
        input: z.string().describe("Input data to process"),
        options: z.object({
          format: z.enum(["json", "text"]).optional()
        }).optional()
      },
      async (args) => {
        try {
          // Tool implementation
          const result = processData(args.input, args.options);

          return {
            content: [{
              type: "text",
              text: JSON.stringify(result, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error: ${error.message}`
            }],
            isError: true
          };
        }
      }
    )
  ]
});

// ============================================================================
// Agent Class
// ============================================================================

class Agent {
  private metrics: {
    startTime?: number;
    endTime?: number;
    messages: any[];
    errors: string[];
  } = {
    messages: [],
    errors: []
  };

  async run(prompt: string | AsyncIterable<any>, options: any = {}) {
    this.metrics.startTime = Date.now();

    try {
      const result = await this.executeAgent(prompt, options);
      this.metrics.endTime = Date.now();
      await this.logMetrics();
      return result;
    } catch (error) {
      this.metrics.errors.push(error.message);
      this.metrics.endTime = Date.now();
      await this.logMetrics();
      throw error;
    }
  }

  private async executeAgent(prompt: string | AsyncIterable<any>, options: any) {
    const messages: any[] = [];

    for await (const message of query({
      prompt,
      options: {
        systemPrompt: CONFIG.systemPrompt,
        allowedTools: CONFIG.allowedTools,
        permissionMode: CONFIG.permissionMode,
        mcpServers: { "tools": customTools },
        ...options
      }
    })) {
      this.metrics.messages.push(message);

      if (message.type === "assistant") {
        messages.push(message);
      }

      if (message.type === "result") {
        if (message.subtype === "error") {
          this.metrics.errors.push(message.error?.message || "Unknown error");
        }
        return { messages, result: message };
      }
    }

    return { messages, result: null };
  }

  private async logMetrics() {
    const duration = this.metrics.endTime! - this.metrics.startTime!;
    const logEntry = {
      agent: CONFIG.agentName,
      duration,
      messageCount: this.metrics.messages.length,
      errors: this.metrics.errors,
      timestamp: new Date().toISOString()
    };

    console.log(JSON.stringify(logEntry));
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function processData(input: string, options?: any): any {
  // Example implementation
  return {
    processed: true,
    input,
    options
  };
}

async function* generatePrompt(userInput: string) {
  yield {
    type: "user" as const,
    message: {
      role: "user" as const,
      content: userInput
    }
  };
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  const agent = new Agent();

  try {
    const result = await agent.run(
      generatePrompt("Your task here"),
      {
        // Additional options
      }
    );

    console.log("Agent completed successfully");
    console.log(result);
  } catch (error) {
    console.error("Agent failed:", error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

// Export for testing
export { Agent, customTools, CONFIG };
