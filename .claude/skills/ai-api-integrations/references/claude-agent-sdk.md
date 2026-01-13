# Claude Agent SDK Reference

Build production AI agents with Claude Code as a library. The Agent SDK gives you the same tools, agent loop, and context management that power Claude Code, programmable in Python and TypeScript.

> **Note**: The Claude Code SDK was renamed to the Claude Agent SDK. See the [Migration Guide](https://platform.claude.com/docs/en/agent-sdk/migration-guide) if migrating from the old SDK.

## Quick Start

### Installation

```bash
# 1. Install Claude Code runtime
curl -fsSL https://claude.ai/install.sh | bash
# Or: brew install --cask claude-code
# Or: npm install -g @anthropic-ai/claude-code

# 2. Install the SDK
npm install @anthropic-ai/claude-agent-sdk
# Or: pip install claude-agent-sdk

# 3. Set API key
export ANTHROPIC_API_KEY=your-api-key
```

### Basic Usage

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

// Simple one-shot query
for await (const message of query({
  prompt: "Find and fix the bug in auth.py",
  options: { allowedTools: ["Read", "Edit", "Bash"] }
})) {
  if ("result" in message) console.log(message.result);
}
```

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions

async def main():
    async for message in query(
        prompt="Find and fix the bug in auth.py",
        options=ClaudeAgentOptions(allowed_tools=["Read", "Edit", "Bash"])
    ):
        if hasattr(message, "result"):
            print(message.result)

asyncio.run(main())
```

## Built-in Tools

The SDK includes powerful built-in tools requiring no implementation:

| Tool | Description |
|------|-------------|
| **Read** | Read any file in the working directory |
| **Write** | Create new files |
| **Edit** | Make precise edits to existing files |
| **Bash** | Run terminal commands, scripts, git operations |
| **Glob** | Find files by pattern (`**/*.ts`, `src/**/*.py`) |
| **Grep** | Search file contents with regex |
| **WebSearch** | Search the web for current information |
| **WebFetch** | Fetch and parse web page content |
| **AskUserQuestion** | Ask the user clarifying questions with multiple choice |
| **Task** | Launch subagents for complex subtasks |
| **TodoWrite** | Track task progress with structured lists |

## Core Patterns

### 1. Multi-Turn Sessions (V2 Interface)

The V2 interface simplifies multi-turn conversations with explicit `send()` and `stream()` patterns:

```typescript
import { unstable_v2_createSession } from "@anthropic-ai/claude-agent-sdk";

// Create a session
await using session = unstable_v2_createSession({
  model: "claude-sonnet-4-5-20250929"
});

// Turn 1
await session.send("Read the authentication module");
for await (const msg of session.stream()) {
  if (msg.type === "assistant") {
    console.log(msg.message.content.filter(b => b.type === "text").map(b => b.text).join(""));
  }
}

// Turn 2 - maintains context
await session.send("Now find all places that call it");
for await (const msg of session.stream()) {
  if ("result" in msg) console.log(msg.result);
}
```

### 2. Session Resume

Persist and resume conversations across application restarts:

```typescript
import { unstable_v2_createSession, unstable_v2_resumeSession } from "@anthropic-ai/claude-agent-sdk";

// Create and capture session ID
const session = unstable_v2_createSession({ model: "claude-sonnet-4-5-20250929" });
await session.send("Remember this number: 42");

let sessionId: string;
for await (const msg of session.stream()) {
  sessionId = msg.session_id;
}
session.close();

// Later: resume the session
await using resumed = unstable_v2_resumeSession(sessionId, {
  model: "claude-sonnet-4-5-20250929"
});
await resumed.send("What number did I ask you to remember?");
// Claude remembers: "42"
```

### 3. Subagents

Spawn specialized agents to handle focused subtasks:

```typescript
for await (const message of query({
  prompt: "Use the code-reviewer agent to review this codebase",
  options: {
    allowedTools: ["Read", "Glob", "Grep", "Task"],
    agents: {
      "code-reviewer": {
        description: "Expert code reviewer for quality and security reviews.",
        prompt: "Analyze code quality, identify bugs, and suggest improvements.",
        tools: ["Read", "Glob", "Grep"],
        model: "sonnet"  // Optional: override model
      },
      "test-writer": {
        description: "Writes comprehensive test suites.",
        prompt: "Generate unit and integration tests for the codebase.",
        tools: ["Read", "Write", "Bash"]
      }
    }
  }
})) {
  if ("result" in message) console.log(message.result);
}
```

### 4. Hooks

Run custom code at key points in the agent lifecycle:

```typescript
import { query, HookCallback } from "@anthropic-ai/claude-agent-sdk";
import { appendFileSync } from "fs";

// Log all file changes
const logFileChange: HookCallback = async (input) => {
  const filePath = (input as any).tool_input?.file_path ?? "unknown";
  appendFileSync("./audit.log", `${new Date().toISOString()}: modified ${filePath}\n`);
  return {};
};

// Validate tool inputs before execution
const validateBash: HookCallback = async (input) => {
  const command = (input as any).tool_input?.command ?? "";
  if (command.includes("rm -rf")) {
    return {
      continue: false,
      reason: "Dangerous command blocked"
    };
  }
  return {};
};

for await (const message of query({
  prompt: "Refactor utils.py to improve readability",
  options: {
    permissionMode: "acceptEdits",
    hooks: {
      PostToolUse: [{ matcher: "Edit|Write", hooks: [logFileChange] }],
      PreToolUse: [{ matcher: "Bash", hooks: [validateBash] }]
    }
  }
})) {
  if ("result" in message) console.log(message.result);
}
```

**Available Hook Events:**
- `PreToolUse` - Before tool execution (can block or modify)
- `PostToolUse` - After successful tool execution
- `PostToolUseFailure` - After failed tool execution
- `UserPromptSubmit` - When user sends a message
- `SessionStart` / `SessionEnd` - Session lifecycle
- `SubagentStart` / `SubagentStop` - Subagent lifecycle
- `PermissionRequest` - When permission is needed
- `PreCompact` - Before context compaction

### 5. MCP (Model Context Protocol) Integration

Connect to external systems via MCP servers:

```typescript
for await (const message of query({
  prompt: "Open example.com and describe what you see",
  options: {
    mcpServers: {
      // Subprocess-based MCP server
      playwright: {
        command: "npx",
        args: ["@playwright/mcp@latest"]
      },
      // SSE-based MCP server
      database: {
        type: "sse",
        url: "http://localhost:3001/mcp",
        headers: { "Authorization": "Bearer token" }
      }
    }
  }
})) {
  if ("result" in message) console.log(message.result);
}
```

### 6. Custom MCP Tools

Create in-process MCP tools:

```typescript
import { query, tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

// Define a custom tool
const weatherTool = tool(
  "get_weather",
  "Get current weather for a location",
  { location: z.string(), unit: z.enum(["celsius", "fahrenheit"]).optional() },
  async (args) => {
    const weather = await fetchWeather(args.location, args.unit);
    return { content: [{ type: "text", text: JSON.stringify(weather) }] };
  }
);

// Create MCP server with custom tools
const server = createSdkMcpServer({
  name: "my-tools",
  version: "1.0.0",
  tools: [weatherTool]
});

for await (const message of query({
  prompt: "What's the weather in Tokyo?",
  options: {
    mcpServers: { "my-tools": server }
  }
})) {
  if ("result" in message) console.log(message.result);
}
```

### 7. Permission Modes

Control tool access and approval:

```typescript
// Read-only mode - no modifications allowed
for await (const message of query({
  prompt: "Review this code for best practices",
  options: {
    allowedTools: ["Read", "Glob", "Grep"],
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true
  }
})) { /* ... */ }

// Auto-accept edits
for await (const message of query({
  prompt: "Fix all TypeScript errors",
  options: {
    allowedTools: ["Read", "Edit", "Bash"],
    permissionMode: "acceptEdits"
  }
})) { /* ... */ }

// Custom permission handler
for await (const message of query({
  prompt: "Deploy the application",
  options: {
    canUseTool: async (toolName, input, { signal }) => {
      if (toolName === "Bash" && input.command.includes("deploy")) {
        const approved = await promptUser("Allow deployment?");
        if (!approved) {
          return { behavior: "deny", message: "User rejected deployment" };
        }
      }
      return { behavior: "allow", updatedInput: input };
    }
  }
})) { /* ... */ }
```

**Permission Modes:**
- `default` - Standard permission behavior
- `acceptEdits` - Auto-accept file edits
- `bypassPermissions` - Bypass all checks (requires `allowDangerouslySkipPermissions`)
- `plan` - Planning mode, no execution

### 8. Structured Outputs

Get type-safe structured responses:

```typescript
const schema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    issues: {
      type: "array",
      items: {
        type: "object",
        properties: {
          file: { type: "string" },
          line: { type: "number" },
          severity: { type: "string", enum: ["error", "warning", "info"] },
          message: { type: "string" }
        },
        required: ["file", "severity", "message"]
      }
    }
  },
  required: ["summary", "issues"]
};

for await (const message of query({
  prompt: "Analyze this codebase for issues",
  options: {
    allowedTools: ["Read", "Glob", "Grep"],
    outputFormat: { type: "json_schema", schema }
  }
})) {
  if (message.type === "result" && message.structured_output) {
    const analysis = message.structured_output as CodeAnalysis;
    console.log("Found", analysis.issues.length, "issues");
  }
}
```

### 9. File Checkpointing

Track and revert file changes:

```typescript
for await (const message of query({
  prompt: "Refactor the entire codebase",
  options: {
    allowedTools: ["Read", "Edit", "Write"],
    enableFileCheckpointing: true
  }
})) {
  if (message.type === "user") {
    // Can rewind to any user message
    const userMessageId = message.uuid;

    // Later: restore files to this state
    await query.rewindFiles(userMessageId);
  }
}
```

### 10. Sandbox Mode

Restrict command execution with sandboxing:

```typescript
for await (const message of query({
  prompt: "Build and test the project",
  options: {
    sandbox: {
      enabled: true,
      autoAllowBashIfSandboxed: true,
      excludedCommands: ["docker"],  // Always run outside sandbox
      network: {
        allowLocalBinding: true,  // For dev servers
        allowUnixSockets: ["/var/run/docker.sock"]
      }
    }
  }
})) { /* ... */ }
```

## Configuration Options

### Full Options Reference

```typescript
interface Options {
  // Core settings
  model?: string;                    // Claude model to use
  cwd?: string;                      // Working directory
  env?: Record<string, string>;      // Environment variables

  // Tool configuration
  allowedTools?: string[];           // Allowed tool names
  disallowedTools?: string[];        // Blocked tool names
  tools?: string[] | { type: "preset"; preset: "claude_code" };

  // Permission control
  permissionMode?: "default" | "acceptEdits" | "bypassPermissions" | "plan";
  allowDangerouslySkipPermissions?: boolean;
  canUseTool?: (tool, input, options) => Promise<PermissionResult>;

  // Session management
  resume?: string;                   // Session ID to resume
  forkSession?: boolean;             // Fork instead of continue
  continue?: boolean;                // Continue most recent

  // Agents and hooks
  agents?: Record<string, AgentDefinition>;
  hooks?: Record<HookEvent, HookCallbackMatcher[]>;

  // MCP servers
  mcpServers?: Record<string, McpServerConfig>;

  // Output control
  outputFormat?: { type: "json_schema"; schema: JSONSchema };
  includePartialMessages?: boolean;

  // Limits
  maxTurns?: number;
  maxBudgetUsd?: number;
  maxThinkingTokens?: number;

  // System prompt
  systemPrompt?: string | { type: "preset"; preset: "claude_code"; append?: string };

  // Settings sources
  settingSources?: ("user" | "project" | "local")[];

  // Sandbox
  sandbox?: SandboxSettings;

  // File tracking
  enableFileCheckpointing?: boolean;

  // Beta features
  betas?: ("context-1m-2025-08-07")[];
}
```

## Message Types

```typescript
// Result message with usage stats
interface SDKResultMessage {
  type: "result";
  subtype: "success" | "error_max_turns" | "error_during_execution" | "error_max_budget_usd";
  result: string;
  session_id: string;
  duration_ms: number;
  total_cost_usd: number;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens: number;
    cache_creation_input_tokens: number;
  };
  modelUsage: Record<string, ModelUsage>;
  structured_output?: unknown;
}

// System init message
interface SDKSystemMessage {
  type: "system";
  subtype: "init";
  session_id: string;
  tools: string[];
  model: string;
  permissionMode: string;
}

// Assistant message
interface SDKAssistantMessage {
  type: "assistant";
  uuid: string;
  session_id: string;
  message: {
    role: "assistant";
    content: ContentBlock[];
  };
}
```

## Third-Party Authentication

```bash
# Amazon Bedrock
export CLAUDE_CODE_USE_BEDROCK=1
# Configure AWS credentials (aws configure or IAM role)

# Google Vertex AI
export CLAUDE_CODE_USE_VERTEX=1
# Configure gcloud (gcloud auth application-default login)

# Microsoft Foundry
export CLAUDE_CODE_USE_FOUNDRY=1
# Configure Azure credentials
```

## Agent Design Best Practices

### Context Management

1. **Agentic Search**: Let the agent use Glob/Grep to find relevant files rather than loading everything upfront
2. **Subagents**: Use for parallel tasks or context isolation
3. **Compaction**: SDK auto-summarizes when approaching context limits

### Tool Categories

| Category | Tools | Use Case |
|----------|-------|----------|
| File Operations | Read, Write, Edit | Code manipulation |
| Search | Glob, Grep | Finding relevant code |
| Execution | Bash | Running commands, tests |
| External | WebSearch, WebFetch | Current information |
| User Interaction | AskUserQuestion | Clarification |

### Verification Strategies

1. **Rules-Based**: Use linters, TypeScript checks via Bash tool
2. **Visual Feedback**: Screenshots for UI tasks
3. **LLM-as-Judge**: Secondary model evaluation

### Error Handling

```typescript
for await (const message of query({ prompt, options })) {
  if (message.type === "result") {
    if (message.subtype === "error_max_turns") {
      console.error("Hit max turns limit");
    } else if (message.subtype === "error_max_budget_usd") {
      console.error("Budget exceeded:", message.total_cost_usd);
    } else if (message.subtype === "error_during_execution") {
      console.error("Execution errors:", message.errors);
    }
  }
}
```

## Resources

- **TypeScript SDK**: [GitHub](https://github.com/anthropics/claude-agent-sdk-typescript)
- **Python SDK**: [GitHub](https://github.com/anthropics/claude-agent-sdk-python)
- **Example Agents**: [Demos](https://github.com/anthropics/claude-agent-sdk-demos)
- **Documentation**: [platform.claude.com/docs/en/agent-sdk](https://platform.claude.com/docs/en/agent-sdk/overview)
