# Custom Tool Development Patterns

Advanced patterns for creating production-ready custom tools with SDK MCP servers.

## Table of Contents

1. [Tool Design Principles](#tool-design-principles)
2. [Common Tool Patterns](#common-tool-patterns)
3. [Error Handling](#error-handling)
4. [Type Safety](#type-safety)
5. [Performance](#performance)
6. [Security](#security)
7. [Testing Tools](#testing-tools)

## Tool Design Principles

### Single Responsibility

Each tool should do one thing well:

```typescript
// ❌ Bad: Multi-purpose tool
tool("process_data", "Process data in various ways", {...}, async (args) => {
  if (args.mode === "validate") { /*...*/ }
  else if (args.mode === "transform") { /*...*/ }
  else if (args.mode === "export") { /*...*/ }
});

// ✅ Good: Focused tools
tool("validate_data", "Validate data against schema", {...}, validateHandler);
tool("transform_data", "Transform data to target format", {...}, transformHandler);
tool("export_data", "Export data to storage", {...}, exportHandler);
```

### Clear Input/Output Contracts

Use Zod for comprehensive schemas:

```typescript
import { z } from "zod";

const userSchema = z.object({
  id: z.string().uuid().describe("User UUID"),
  email: z.string().email().describe("User email address"),
  role: z.enum(["admin", "user", "guest"]).describe("User role"),
  metadata: z.record(z.any()).optional().describe("Additional user data")
});

tool(
  "get_user",
  "Fetch user details by ID",
  { userId: z.string().uuid() },
  async (args) => {
    const user = await db.users.findUnique({ where: { id: args.userId } });

    // Validate output
    const validated = userSchema.parse(user);

    return {
      content: [{
        type: "text",
        text: JSON.stringify(validated, null, 2)
      }]
    };
  }
);
```

### Composability

Design tools to work together:

```typescript
// Tool 1: Fetch data
tool("fetch_customer_data", ..., async (args) => {
  const data = await api.getCustomer(args.customerId);
  return { content: [{ type: "text", text: JSON.stringify(data) }] };
});

// Tool 2: Analyze data (works with output from Tool 1)
tool("analyze_customer_churn", ..., async (args) => {
  const customer = JSON.parse(args.customerData);
  const risk = calculateChurnRisk(customer);
  return { content: [{ type: "text", text: `Risk: ${risk}` }] };
});

// Agent can chain: fetch_customer_data → analyze_customer_churn
```

## Common Tool Patterns

### Pattern 1: Data Retrieval

```typescript
tool(
  "query_database",
  "Execute read-only SQL queries against the database",
  {
    query: z.string().describe("SQL SELECT query"),
    params: z.array(z.any()).optional().describe("Query parameters")
  },
  async (args) => {
    // Validate query is read-only
    const normalized = args.query.trim().toLowerCase();
    if (!normalized.startsWith("select")) {
      return {
        content: [{ type: "text", text: "Only SELECT queries allowed" }],
        isError: true
      };
    }

    try {
      const results = await db.raw(args.query, args.params || []);

      return {
        content: [{
          type: "text",
          text: JSON.stringify(results, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Query failed: ${error.message}`
        }],
        isError: true
      };
    }
  }
);
```

### Pattern 2: API Gateway

```typescript
interface APIConfig {
  baseUrl: string;
  authHeader: string;
  rateLimit: number;
}

const createAPITool = (name: string, config: APIConfig) => {
  return tool(
    name,
    `Make authenticated requests to ${name} API`,
    {
      endpoint: z.string().describe("API endpoint path"),
      method: z.enum(["GET", "POST", "PUT", "DELETE"]),
      body: z.record(z.any()).optional(),
      query: z.record(z.string()).optional()
    },
    async (args) => {
      const url = new URL(args.endpoint, config.baseUrl);

      if (args.query) {
        Object.entries(args.query).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }

      try {
        const response = await fetch(url.toString(), {
          method: args.method,
          headers: {
            [config.authHeader]: process.env[`${name.toUpperCase()}_API_KEY`]!,
            "Content-Type": "application/json"
          },
          body: args.body ? JSON.stringify(args.body) : undefined
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

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
};

// Usage
const stripeTools = createSdkMcpServer({
  name: "stripe",
  version: "1.0.0",
  tools: [
    createAPITool("stripe", {
      baseUrl: "https://api.stripe.com/v1",
      authHeader: "Authorization",
      rateLimit: 100
    })
  ]
});
```

### Pattern 3: File Processing

```typescript
tool(
  "process_csv",
  "Parse and analyze CSV files",
  {
    filePath: z.string().describe("Path to CSV file"),
    operation: z.enum(["summary", "filter", "aggregate"]),
    filterColumn: z.string().optional(),
    filterValue: z.string().optional()
  },
  async (args) => {
    const fs = require("fs/promises");
    const Papa = require("papaparse");

    try {
      const content = await fs.readFile(args.filePath, "utf-8");
      const parsed = Papa.parse(content, { header: true });

      let result;

      switch (args.operation) {
        case "summary":
          result = {
            rows: parsed.data.length,
            columns: Object.keys(parsed.data[0] || {})
          };
          break;

        case "filter":
          if (!args.filterColumn || !args.filterValue) {
            throw new Error("Filter requires column and value");
          }
          result = parsed.data.filter(
            row => row[args.filterColumn] === args.filterValue
          );
          break;

        case "aggregate":
          // Implementation
          break;
      }

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
          text: `CSV processing failed: ${error.message}`
        }],
        isError: true
      };
    }
  }
);
```

### Pattern 4: State Management

```typescript
class StatefulToolServer {
  private cache: Map<string, any> = new Map();

  createTools() {
    return [
      tool(
        "store_value",
        "Store a value in agent memory",
        {
          key: z.string(),
          value: z.any()
        },
        async (args) => {
          this.cache.set(args.key, args.value);
          return {
            content: [{
              type: "text",
              text: `Stored: ${args.key}`
            }]
          };
        }
      ),

      tool(
        "retrieve_value",
        "Retrieve a stored value",
        { key: z.string() },
        async (args) => {
          const value = this.cache.get(args.key);

          if (value === undefined) {
            return {
              content: [{
                type: "text",
                text: `No value found for key: ${args.key}`
              }],
              isError: true
            };
          }

          return {
            content: [{
              type: "text",
              text: JSON.stringify(value, null, 2)
            }]
          };
        }
      ),

      tool(
        "list_keys",
        "List all stored keys",
        {},
        async () => {
          const keys = Array.from(this.cache.keys());
          return {
            content: [{
              type: "text",
              text: JSON.stringify(keys, null, 2)
            }]
          };
        }
      )
    ];
  }

  getServer() {
    return createSdkMcpServer({
      name: "memory",
      version: "1.0.0",
      tools: this.createTools()
    });
  }
}
```

### Pattern 5: Vision/Multimodal

```typescript
tool(
  "analyze_image",
  "Analyze images and extract information",
  {
    imagePath: z.string().describe("Path to image file"),
    analysis: z.enum(["objects", "text", "faces", "colors"])
  },
  async (args) => {
    const fs = require("fs/promises");

    // Read image as base64
    const imageBuffer = await fs.readFile(args.imagePath);
    const base64Image = imageBuffer.toString("base64");

    // Return image for Claude to analyze
    return {
      content: [
        {
          type: "image",
          data: base64Image,
          mimeType: "image/jpeg"
        },
        {
          type: "text",
          text: `Analyze this image for: ${args.analysis}`
        }
      ]
    };
  }
);
```

## Error Handling

### Recoverable vs Fatal Errors

```typescript
tool("fetch_data", ..., async (args) => {
  try {
    const data = await api.get(args.endpoint);
    return {
      content: [{ type: "text", text: JSON.stringify(data) }]
    };
  } catch (error) {
    if (error.code === "ENOTFOUND") {
      // Recoverable: network issue, agent can retry or use fallback
      return {
        content: [{
          type: "text",
          text: `Network error: ${error.message}. Consider retrying.`
        }],
        isError: false  // Agent can continue
      };
    } else if (error.code === 401) {
      // Fatal: authentication issue, agent should stop
      return {
        content: [{
          type: "text",
          text: `Authentication failed. Check API credentials.`
        }],
        isError: true  // Agent should halt
      };
    } else {
      // Unknown error
      return {
        content: [{
          type: "text",
          text: `Unexpected error: ${error.message}`
        }],
        isError: true
      };
    }
  }
});
```

### Validation Errors

```typescript
tool("create_user", ..., async (args) => {
  // Validate input
  const errors: string[] = [];

  if (!args.email.includes("@")) {
    errors.push("Invalid email format");
  }

  if (args.password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }

  if (errors.length > 0) {
    return {
      content: [{
        type: "text",
        text: `Validation errors:\n${errors.join("\n")}`
      }],
      isError: true
    };
  }

  // Proceed with creation
  // ...
});
```

## Type Safety

### Runtime + Compile-time Validation

```typescript
import { z } from "zod";

// Define schema once
const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().datetime().optional(),
  assignee: z.string().optional()
});

// Extract TypeScript type
type Task = z.infer<typeof TaskSchema>;

tool(
  "create_task",
  "Create a new task",
  TaskSchema.shape,  // Use schema for input
  async (args) => {
    // args is typed as Task automatically
    const task: Task = {
      id: crypto.randomUUID(),
      ...args
    };

    // Runtime validation
    const validated = TaskSchema.parse(task);

    await db.tasks.create({ data: validated });

    return {
      content: [{
        type: "text",
        text: JSON.stringify(validated, null, 2)
      }]
    };
  }
);
```

## Performance

### Caching

```typescript
class CachedAPITool {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5 minutes

  getTool() {
    return tool(
      "get_cached_data",
      "Fetch data with caching",
      { key: z.string() },
      async (args) => {
        const cached = this.cache.get(args.key);

        if (cached && Date.now() - cached.timestamp < this.ttl) {
          return {
            content: [{
              type: "text",
              text: `[CACHED] ${JSON.stringify(cached.data)}`
            }]
          };
        }

        const data = await this.fetchFreshData(args.key);
        this.cache.set(args.key, { data, timestamp: Date.now() });

        return {
          content: [{
            type: "text",
            text: JSON.stringify(data, null, 2)
          }]
        };
      }
    );
  }

  private async fetchFreshData(key: string) {
    // Expensive operation
    return await api.get(key);
  }
}
```

### Batching

```typescript
tool(
  "batch_process",
  "Process multiple items efficiently",
  {
    items: z.array(z.string()).max(100).describe("Items to process (max 100)")
  },
  async (args) => {
    // Process in batches of 10
    const batchSize = 10;
    const results = [];

    for (let i = 0; i < args.items.length; i += batchSize) {
      const batch = args.items.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(item => processItem(item))
      );
      results.push(...batchResults);
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify(results, null, 2)
      }]
    };
  }
);
```

## Security

### Input Sanitization

```typescript
tool("execute_search", ..., async (args) => {
  // Prevent SQL injection
  const sanitized = args.query
    .replace(/[^\w\s-]/g, "")  // Remove special chars
    .trim();

  if (sanitized.length < 3) {
    return {
      content: [{ type: "text", text: "Query too short" }],
      isError: true
    };
  }

  const results = await db.search(sanitized);
  // ...
});
```

### Rate Limiting

```typescript
class RateLimitedTool {
  private calls: Map<string, number[]> = new Map();
  private limit = 10; // calls per minute

  getTool() {
    return tool("rate_limited_api", ..., async (args) => {
      const now = Date.now();
      const userId = args.userId || "default";
      const userCalls = this.calls.get(userId) || [];

      // Remove calls older than 1 minute
      const recentCalls = userCalls.filter(time => now - time < 60000);

      if (recentCalls.length >= this.limit) {
        return {
          content: [{
            type: "text",
            text: "Rate limit exceeded. Try again later."
          }],
          isError: true
        };
      }

      recentCalls.push(now);
      this.calls.set(userId, recentCalls);

      // Proceed with operation
      // ...
    });
  }
}
```

### Credential Management

```typescript
// ❌ Bad: Hardcoded credentials
const apiKey = "sk-1234567890";

// ✅ Good: Environment variables
const apiKey = process.env.API_KEY;

if (!apiKey) {
  throw new Error("API_KEY environment variable required");
}

// ✅ Better: Secrets manager
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

async function getSecret(name: string): Promise<string> {
  const client = new SecretsManagerClient({ region: "us-east-1" });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: name })
  );
  return response.SecretString!;
}
```

## Testing Tools

### Unit Testing

```typescript
import { describe, it, expect } from "vitest";

describe("data validation tool", () => {
  const validateTool = tool("validate", ..., validationHandler);

  it("accepts valid data", async () => {
    const result = await validateTool.handler({
      data: { name: "John", age: 30 }
    });

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain("valid");
  });

  it("rejects invalid data", async () => {
    const result = await validateTool.handler({
      data: { name: "", age: -1 }
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("error");
  });
});
```

### Integration Testing

```typescript
import { query, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";

async function testToolIntegration() {
  const server = createSdkMcpServer({
    name: "test-tools",
    version: "1.0.0",
    tools: [myTool]
  });

  async function* messages() {
    yield {
      type: "user" as const,
      message: {
        role: "user" as const,
        content: "Use the tool to process data X"
      }
    };
  }

  let toolWasCalled = false;

  for await (const message of query({
    prompt: messages(),
    options: {
      mcpServers: { "test": server },
      allowedTools: ["mcp__test__my_tool"]
    }
  })) {
    if (message.type === "assistant") {
      const toolUse = message.message.content.find(
        block => "name" in block && block.name === "mcp__test__my_tool"
      );
      if (toolUse) toolWasCalled = true;
    }
  }

  console.assert(toolWasCalled, "Tool should have been called");
}
```

## Best Practices Summary

1. **Single Responsibility** - One tool, one job
2. **Type Everything** - Use Zod for schemas
3. **Handle Errors Gracefully** - Distinguish recoverable from fatal
4. **Validate Inputs** - Never trust input data
5. **Test Independently** - Unit test tools before agent integration
6. **Cache Expensive Operations** - Reduce latency and costs
7. **Rate Limit** - Protect external APIs
8. **Secure Credentials** - Use environment variables or secrets managers
9. **Document Thoroughly** - Clear descriptions help Claude use tools correctly
10. **Design for Composability** - Tools should chain together naturally
