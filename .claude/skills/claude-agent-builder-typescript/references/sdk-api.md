# Claude Agent SDK - TypeScript API Reference

Complete reference for `@anthropic-ai/claude-agent-sdk` TypeScript package.

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [Core Functions](#core-functions)
3. [V2 API (Preview)](#v2-api-preview)
4. [Custom Tools](#custom-tools)
5. [Configuration Options](#configuration-options)
6. [Message Types](#message-types)
7. [Error Handling](#error-handling)
8. [Advanced Features](#advanced-features)

## Installation & Setup

```bash
npm install @anthropic-ai/claude-agent-sdk

# Also install Zod for type-safe schemas
npm install zod

# For TypeScript projects
npm install --save-dev typescript @types/node
```

**Prerequisites:**
- Node.js 18+
- Claude Code CLI (used as runtime)
- Authentication via Claude Code or `ANTHROPIC_API_KEY` environment variable

## Core Functions

### query()

Primary interface for agent invocation. Returns an async iterator of messages.

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Your task description",
  options: {
    allowedTools: ["Read", "Edit", "Glob", "Grep"],
    permissionMode: "acceptEdits",
    cwd: "/path/to/working/directory"
  }
})) {
  // Handle streaming messages
  if (message.type === "assistant") {
    // Process assistant responses
  } else if (message.type === "result") {
    // Handle completion
  }
}
```

**Parameters:**
- `prompt`: `string | AsyncIterable<Message>` - Task description or message stream
- `options`: `AgentOptions` - Configuration object

**Returns:** `AsyncIterable<Message>` - Stream of messages

**When to use:**
- Simple, single-session agent invocations
- Fire-and-forget tasks
- When you don't need to maintain conversation state

### tool()

Define custom tools for SDK MCP servers.

```typescript
import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const myTool = tool(
  "tool_name",               // Tool name (must be unique)
  "Tool description",         // What the tool does
  {                           // Input schema (Zod)
    param1: z.string().describe("Parameter description"),
    param2: z.number().optional()
  },
  async (args) => {           // Implementation
    // Tool logic here
    return {
      content: [{
        type: "text",
        text: "Tool output"
      }]
    };
  }
);
```

**Parameters:**
- `name`: `string` - Unique tool identifier
- `description`: `string` - Clear explanation of tool purpose
- `inputSchema`: `Record<string, ZodType>` - Zod schema for parameters
- `handler`: `(args: T) => Promise<ToolResult>` - Async function implementation

**Returns:** Tool definition object

### createSdkMcpServer()

Create an in-process MCP server with custom tools.

```typescript
import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";

const server = createSdkMcpServer({
  name: "my-tools",
  version: "1.0.0",
  tools: [tool1, tool2, tool3]
});

// Use in agent
for await (const message of query({
  prompt: generateMessages(),  // Must use async generator with MCP
  options: {
    mcpServers: { "my-tools": server },
    allowedTools: ["mcp__my-tools__tool1"]
  }
})) {
  // ...
}
```

**Parameters:**
- `config`:
  - `name`: `string` - Server identifier
  - `version`: `string` - Semantic version
  - `tools`: `Tool[]` - Array of tool definitions

**Returns:** SDK MCP server instance

**Key points:**
- Runs in-process (no subprocess overhead)
- Tool names are prefixed: `mcp__{server_name}__{tool_name}`
- Requires async generator for prompt when using MCP servers

## V2 API (Preview)

**Status:** Unstable preview, APIs may change

The V2 interface simplifies multi-turn conversations by removing async generator complexity.

### unstable_v2_prompt()

Simple single-turn queries without session management.

```typescript
import { unstable_v2_prompt } from "@anthropic-ai/claude-agent-sdk";

const result = await unstable_v2_prompt({
  prompt: "What is 2 + 2?",
  options: {
    allowedTools: ["Read"]
  }
});

console.log(result);
```

### unstable_v2_session()

Multi-turn conversations with explicit session management.

```typescript
import { unstable_v2_session } from "@anthropic-ai/claude-agent-sdk";

await using session = await unstable_v2_session({
  allowedTools: ["Read", "Edit"],
  permissionMode: "acceptEdits"
});

// Turn 1
await session.send("First message");
for await (const msg of session.stream()) {
  console.log(msg);
}

// Turn 2
await session.send("Follow-up message");
for await (const msg of session.stream()) {
  console.log(msg);
}

// Session auto-closes with `await using`
```

**Benefits:**
- No yield coordination required
- Cleaner separation between sending and streaming
- Easier to add logic between turns
- TypeScript 5.2+ automatic cleanup with `await using`

## Custom Tools

### Tool Result Format

```typescript
interface ToolResult {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;      // Base64 for images
    mimeType?: string;
    uri?: string;       // For resources
  }>;
  isError?: boolean;
}
```

### Example: API Integration Tool

```typescript
const apiTool = tool(
  "call_api",
  "Make authenticated API calls to external services",
  {
    service: z.enum(["stripe", "github", "slack"]),
    endpoint: z.string(),
    method: z.enum(["GET", "POST", "PUT", "DELETE"]),
    body: z.record(z.any()).optional()
  },
  async (args) => {
    try {
      const apiKey = process.env[`${args.service.toUpperCase()}_API_KEY`];
      const response = await fetch(`${BASE_URLS[args.service]}${args.endpoint}`, {
        method: args.method,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: args.body ? JSON.stringify(args.body) : undefined
      });

      const data = await response.json();

      return {
        content: [{
          type: "text",
          text: JSON.stringify(data, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `API Error: ${error.message}`
        }],
        isError: true
      };
    }
  }
);
```

### Async Generator for MCP

**Critical:** When using custom MCP servers, prompt MUST be an async generator:

```typescript
async function* generateMessages() {
  yield {
    type: "user" as const,
    message: {
      role: "user" as const,
      content: "Your task"
    }
  };
}

for await (const message of query({
  prompt: generateMessages(),  // Async generator required!
  options: {
    mcpServers: { "tools": server }
  }
})) {
  // ...
}
```

## Configuration Options

### AgentOptions Interface

```typescript
interface AgentOptions {
  // Tool configuration
  allowedTools?: string[];           // Specific tools allowed
  tools?: ToolPreset | string[];     // "all", "none", or array

  // Permission handling
  permissionMode?: "default" | "acceptEdits" | "bypassPermissions";

  // MCP servers
  mcpServers?: Record<string, SdkMcpServer | ExternalMcpConfig>;

  // Working directory
  cwd?: string;

  // System prompt
  systemPrompt?: string;

  // Context window
  maxContextTokens?: number;         // For 1M context: "context-1m-2025-08-07"

  // Hooks (advanced)
  hooks?: HookConfig;
}
```

### Permission Modes

| Mode | Behavior | Use Case |
|------|----------|----------|
| `default` | Prompt user for approvals | Interactive development |
| `acceptEdits` | Auto-approve file edits | Trusted automation |
| `bypassPermissions` | No prompts for any action | Production agents |

### Tool Presets

```typescript
// Allow all tools
options: { tools: "all" }

// Disable all tools
options: { tools: "none" }

// Specific tools only
options: {
  allowedTools: ["Read", "Edit", "Glob", "Grep", "Bash"]
}

// Built-in + custom tools
options: {
  allowedTools: ["Read", "mcp__myserver__mytool"],
  mcpServers: { "myserver": server }
}
```

### Available Built-in Tools

- **Read** - Read file contents
- **Write** - Create new files
- **Edit** - Modify existing files
- **Glob** - Pattern-based file search
- **Grep** - Content search in files
- **Bash** - Execute shell commands
- **Task** - Launch sub-agents
- **WebSearch** - Search the internet
- **WebFetch** - Fetch URL content
- **AskUserQuestion** - Interactive user input

## Message Types

### Assistant Message

```typescript
interface AssistantMessage {
  type: "assistant";
  message: {
    role: "assistant";
    content: Array<TextBlock | ToolUseBlock>;
  };
}

interface TextBlock {
  type: "text";
  text: string;
}

interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, any>;
}
```

### User Message

```typescript
interface UserMessage {
  type: "user";
  message: {
    role: "user";
    content: string | Array<ContentBlock>;
  };
}
```

### Result Message

```typescript
interface ResultMessage {
  type: "result";
  subtype: "success" | "error" | "cancelled";
  result?: string;
  error?: {
    message: string;
    type: string;
  };
}
```

## Error Handling

### Error Types

```typescript
try {
  for await (const message of query({...})) {
    // Process messages
  }
} catch (error) {
  if (error.code === "ENOENT") {
    // Claude Code CLI not found
  } else if (error.message.includes("rate_limit")) {
    // API rate limit
  } else {
    // Other errors
  }
}
```

### Graceful Degradation

```typescript
const result = await tool("fallible_operation", ..., async (args) => {
  try {
    const data = await riskyOperation();
    return {
      content: [{ type: "text", text: JSON.stringify(data) }]
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Operation failed: ${error.message}. Using fallback.`
      }],
      isError: false  // Not fatal, agent can continue
    };
  }
});
```

## Advanced Features

### Context Window Management

For long-running agents, use the 1M context model:

```typescript
for await (const message of query({
  prompt: "Complex multi-step task",
  options: {
    maxContextTokens: 1000000,
    // Or specify model directly if needed
  }
})) {
  // Automatically uses compaction when approaching limit
}
```

### External MCP Servers

Mix SDK and external servers:

```typescript
for await (const message of query({
  prompt: generateMessages(),
  options: {
    mcpServers: {
      "internal": sdkServer,     // In-process
      "external": {               // External process
        type: "stdio",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", "/path"]
      }
    },
    allowedTools: [
      "mcp__internal__my_tool",
      "mcp__external__read_file"
    ]
  }
})) {
  // ...
}
```

### Session State Management

For maintaining state across turns:

```typescript
class StatefulAgent {
  private state: Map<string, any> = new Map();

  async run(task: string) {
    for await (const message of query({
      prompt: this.buildPrompt(task),
      options: {
        systemPrompt: this.getSystemPrompt(),
        allowedTools: this.getAllowedTools()
      }
    })) {
      if (message.type === "assistant") {
        this.updateState(message);
      }
    }
  }

  private buildPrompt(task: string): string {
    return `
Previous state: ${JSON.stringify(Object.fromEntries(this.state))}

New task: ${task}
    `.trim();
  }
}
```

### Cloud Provider Support

Works with AWS Bedrock, Google Vertex AI, Azure AI Foundry:

```typescript
// Set provider-specific environment variables
process.env.ANTHROPIC_BEDROCK = "true";
// or
process.env.ANTHROPIC_VERTEX = "true";
// or
process.env.AZURE_OPENAI_ENDPOINT = "...";

// SDK automatically uses the configured provider
```

## Best Practices

1. **Use V2 API for new projects** - Simpler multi-turn patterns
2. **Start with SDK MCP servers** - In-process tools are easier to develop
3. **Type everything with Zod** - Runtime validation + compile-time types
4. **Handle errors gracefully** - Use `isError: false` for recoverable failures
5. **Test tools independently** - Validate tool behavior before agent integration
6. **Use permissionMode carefully** - Only `bypassPermissions` in trusted environments
7. **Monitor token usage** - Use 1M context model for long-running tasks
8. **Version your tools** - Track breaking changes in custom tools

## Resources

- **Official Docs**: https://platform.claude.com/docs/en/agent-sdk/typescript
- **GitHub**: https://github.com/anthropics/claude-agent-sdk-typescript
- **Examples**: See `examples.md` in this skill
