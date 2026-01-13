#!/usr/bin/env node
/**
 * Google Gemini MCP Server
 *
 * Direct API integration with Google's Gemini models.
 * Supports multimodal inputs (text + images) for web design and visual analysis.
 */

import { BaseMCPServer, DelegationResponse } from "./shared/mcp-base.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_ID = process.env.GEMINI_MODEL || "gemini-2.0-flash";

if (!GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY environment variable is required");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

class GeminiMCPServer extends BaseMCPServer {
  constructor() {
    super({
      name: "gemini",
      version: "1.0.0",
      model: MODEL_ID,
    });
  }

  protected getToolDefinition() {
    return {
      name: "gemini",
      description: `Delegate task to Google Gemini (${MODEL_ID}) - Best for large codebase analysis (2M context), documentation, and multimodal tasks`,
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
            description: "Sandbox mode (informational - Gemini is read-only)",
          },
          cwd: {
            type: "string",
            description: "Working directory context",
          },
          expert: {
            type: "string",
            description: "Expert ID to load system prompt",
          },
          images: {
            type: "array",
            items: { type: "string" },
            description: "Base64 encoded images or URLs for visual analysis",
          },
        },
        required: ["prompt"],
      },
    };
  }

  protected async callProvider(
    prompt: string,
    systemPrompt: string,
    images?: string[]
  ): Promise<DelegationResponse> {
    const model = genAI.getGenerativeModel({
      model: MODEL_ID,
      systemInstruction: systemPrompt || undefined,
    });

    // Build content parts (text + optional images)
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: prompt },
    ];

    // Process images if provided
    if (images && images.length > 0) {
      for (const img of images) {
        try {
          if (img.startsWith("data:")) {
            // Base64 data URI
            const matches = img.match(/^data:(.+);base64,(.+)$/);
            if (matches) {
              parts.push({
                inlineData: {
                  mimeType: matches[1],
                  data: matches[2],
                },
              });
            }
          } else if (img.startsWith("http://") || img.startsWith("https://")) {
            // URL - fetch and convert to base64
            const response = await fetch(img);
            const buffer = await response.arrayBuffer();
            const base64 = Buffer.from(buffer).toString("base64");
            const mimeType = response.headers.get("content-type") || "image/png";
            parts.push({
              inlineData: {
                mimeType,
                data: base64,
              },
            });
          } else {
            // Assume raw base64
            parts.push({
              inlineData: {
                mimeType: "image/png",
                data: img,
              },
            });
          }
        } catch (error) {
          console.error(`Failed to process image: ${error}`);
        }
      }
    }

    const result = await model.generateContent(parts);
    const response = result.response;
    const text = response.text();
    const usage = response.usageMetadata;

    return {
      content: text,
      tokens: {
        input: usage?.promptTokenCount || 0,
        output: usage?.candidatesTokenCount || 0,
      },
    };
  }
}

// Start server
const server = new GeminiMCPServer();
server.start().catch((error) => {
  console.error("Failed to start Gemini MCP server:", error);
  process.exit(1);
});
