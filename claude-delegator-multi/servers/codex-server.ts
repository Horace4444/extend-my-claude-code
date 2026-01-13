#!/usr/bin/env node
/**
 * OpenAI Codex MCP Server
 *
 * Passthrough server for Codex CLI's native MCP functionality.
 * This server provides a unified interface while leveraging Codex's built-in capabilities.
 */

import { BaseMCPServer, DelegationResponse } from "./shared/mcp-base.js";
import { spawn } from "child_process";

const MODEL_ID = process.env.CODEX_MODEL || "gpt-5.2-codex";

class CodexMCPServer extends BaseMCPServer {
  constructor() {
    super({
      name: "codex",
      version: "1.0.0",
      model: MODEL_ID,
    });
  }

  protected getToolDefinition() {
    return {
      name: "codex",
      description: `Delegate task to OpenAI Codex (${MODEL_ID}) - Best for complex multi-file implementations and enterprise coding`,
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
            description: "Sandbox mode for file operations",
          },
          cwd: {
            type: "string",
            description: "Working directory for the task",
          },
          expert: {
            type: "string",
            description: "Expert ID to load system prompt (e.g., 'architect', 'security-analyst')",
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
    return new Promise((resolve, reject) => {
      const args = [
        "-m", MODEL_ID,
        "--approval-policy", "on-failure",
        "-p", prompt,
      ];

      if (systemPrompt) {
        args.push("--developer-instructions", systemPrompt);
      }

      const codex = spawn("codex", args, {
        stdio: ["pipe", "pipe", "pipe"],
        env: process.env,
      });

      let stdout = "";
      let stderr = "";

      codex.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      codex.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      codex.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`Codex exited with code ${code}: ${stderr}`));
          return;
        }

        // Parse token usage from Codex output if available
        const tokenMatch = stdout.match(/tokens:\s*(\d+)\s*in\s*\/\s*(\d+)\s*out/i);
        const inputTokens = tokenMatch ? parseInt(tokenMatch[1]) : 0;
        const outputTokens = tokenMatch ? parseInt(tokenMatch[2]) : 0;

        resolve({
          content: stdout,
          tokens: {
            input: inputTokens,
            output: outputTokens,
          },
        });
      });

      codex.on("error", (error) => {
        reject(new Error(`Failed to spawn Codex: ${error.message}`));
      });
    });
  }
}

// Start server
const server = new CodexMCPServer();
server.start().catch((error) => {
  console.error("Failed to start Codex MCP server:", error);
  process.exit(1);
});
