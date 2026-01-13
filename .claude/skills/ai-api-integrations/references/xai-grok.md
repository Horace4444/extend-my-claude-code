# xAI Grok API Reference

> **Last Updated**: January 2026
> **Official Pricing**: [docs.x.ai/docs/models](https://docs.x.ai/docs/models)

## Current Models (January 2026)

### Grok 4.1 Series (Latest)

#### Grok 4.1 (Flagship Reasoning)
- **Model ID**: `grok-4.1` or `grok-4-1-latest`
- **Context Window**: 2M tokens
- **Pricing**: $0.20/1M input, $0.50/1M output
- **Cached Input**: $0.05/1M tokens
- **Best For**: Advanced reasoning, #1 on LMArena (1483 Elo)
- **Note**: Available in "Auto" mode on grok.com, X apps

#### Grok 4.1 Fast (Non-Reasoning)
- **Model ID**: `grok-4-1-fast` or `grok-4-1-fast-non-reasoning`
- **Context Window**: 2M tokens
- **Pricing**: $0.20/1M input, $0.50/1M output
- **Best For**: Fast responses without thinking tokens
- **Note**: #2 on LMArena (1465 Elo), immediate responses

### Grok 4 Series

#### Grok 4 (Advanced Reasoning)
- **Model ID**: `grok-4` or `grok-4-latest`
- **Context Window**: 256K tokens (2M available)
- **Pricing**: $3.00/1M input, $15.00/1M output
- **Cached Input**: $0.75/1M tokens
- **Large Context (2M)**: $6.00/1M input, $30.00/1M output
- **Best For**: Complex reasoning, matches o3 performance

#### Grok 4 Fast
- **Model ID**: `grok-4-fast`
- **Context Window**: 2M tokens
- **Pricing**: $0.20/1M input, $0.50/1M output
- **Best For**: Fast inference with Grok 4 quality

### Grok 3 Series

#### Grok 3
- **Model ID**: `grok-3` or `grok-3-latest`
- **Context Window**: 131K tokens
- **Pricing**: $3.00/1M input, $15.00/1M output
- **Note**: Legacy model, consider using Grok 4.1 Fast instead

#### Grok 3 Mini (Budget)
- **Model ID**: `grok-3-mini`
- **Pricing**: $0.30/1M input, $0.50/1M output
- **Best For**: Budget-conscious tasks
- **Note**: Outperforms Grok 3 at 90% lower cost

### Specialized Models

#### Grok Code Fast 1
- **Model ID**: `grok-code-fast-1`
- **Pricing**: $0.20/1M input, $1.50/1M output
- **Best For**: Code generation and analysis

#### Grok 2 Vision
- **Model ID**: `grok-2-vision-latest`
- **Best For**: Image understanding and analysis

#### Grok 2 Image (Generation)
- **Model ID**: `grok-2-image`
- **Best For**: Image generation

### Server-Side Tools

| Tool | Price per 1,000 calls |
|------|----------------------|
| Web Search | $5.00 |
| X Search | $5.00 |
| Code Execution | $5.00 |
| Document Search | $5.00 |
| Collections Search | $2.50 |
| View Image | Token-based only |
| View X Video | Token-based only |
| Remote MCP Tools | Token-based only |

### Voice Agent API
- **Model ID**: `grok-voice-agent`
- **Pricing**: $0.05 per minute of connection time

## Pricing Summary Table

| Model | Input | Output | Cached | Notes |
|-------|-------|--------|--------|-------|
| Grok 4.1 | $0.20 | $0.50 | $0.05 | Best value, #1 LMArena |
| Grok 4.1 Fast | $0.20 | $0.50 | $0.05 | No thinking tokens |
| Grok 4 | $3.00 | $15.00 | $0.75 | Complex reasoning |
| Grok 4 Fast | $0.20 | $0.50 | $0.05 | Fast Grok 4 |
| Grok 4 (2M context) | $6.00 | $30.00 | - | Extended context |
| Grok 3 | $3.00 | $15.00 | - | Legacy |
| Grok 3 Mini | $0.30 | $0.50 | - | Budget |
| Grok Code Fast 1 | $0.20 | $1.50 | - | Code optimized |

*All prices per million tokens*

## Client Initialization

Grok uses an OpenAI-compatible API, so you can use the OpenAI SDK:

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: "https://api.x.ai/v1",
});
```

## Common Patterns

### 1. Standard Chat Completions

```typescript
const completion = await client.chat.completions.create({
  model: "grok-4.1",
  messages: [
    { role: "system", content: "You are an aging-in-place design consultant." },
    { role: "user", content: "What bathroom modifications help seniors stay safe?" },
  ],
  temperature: 0.7,
  max_tokens: 2000,
});

const response = completion.choices[0].message.content;
console.log(response);
```

### 2. Fast Non-Reasoning Mode

```typescript
// Use for quick, factual responses without thinking overhead
const completion = await client.chat.completions.create({
  model: "grok-4-1-fast-non-reasoning",
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Translate to Spanish: Install grab bars near the toilet" },
  ],
  temperature: 0,
});

console.log(completion.choices[0].message.content);
// "Instale barras de apoyo cerca del inodoro"
```

### 3. Streaming Responses

```typescript
const stream = await client.chat.completions.create({
  model: "grok-4.1",
  messages: [{ role: "user", content: "Write a detailed design proposal for an accessible kitchen" }],
  stream: true,
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || "";
  process.stdout.write(content);
}
```

### 4. Web Search Integration

```typescript
// Grok has built-in web search capabilities
const completion = await client.chat.completions.create({
  model: "grok-4.1",
  messages: [
    { role: "user", content: "What are the latest ADA bathroom requirements for 2026? Search the web for current information." },
  ],
  tools: [
    {
      type: "function",
      function: {
        name: "web_search",
        description: "Search the web for current information",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
          },
          required: ["query"],
        },
      },
    },
  ],
  tool_choice: "auto",
});

// Handle tool calls
const message = completion.choices[0].message;
if (message.tool_calls) {
  for (const toolCall of message.tool_calls) {
    console.log("Searching:", JSON.parse(toolCall.function.arguments).query);
  }
}
// Cost: $5 per 1,000 web searches
```

### 5. X (Twitter) Search

```typescript
// Search real-time X posts for trending topics
const completion = await client.chat.completions.create({
  model: "grok-4.1",
  messages: [
    { role: "user", content: "What are people saying about aging in place design trends on X?" },
  ],
  tools: [
    {
      type: "function",
      function: {
        name: "x_search",
        description: "Search X (Twitter) for real-time posts and trends",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string" },
            time_range: { type: "string", enum: ["hour", "day", "week"] },
          },
          required: ["query"],
        },
      },
    },
  ],
});
// Cost: $5 per 1,000 X searches
```

### 6. Code Execution

```typescript
// Safe sandboxed Python execution
const completion = await client.chat.completions.create({
  model: "grok-code-fast-1",
  messages: [
    {
      role: "user",
      content: "Calculate the total cost for these modifications: 4 grab bars at $80 each, 1 walk-in tub at $3500, and 2 widened doorways at $1200 each. Use code to compute this.",
    },
  ],
  tools: [
    {
      type: "function",
      function: {
        name: "code_execution",
        description: "Execute Python code safely",
        parameters: {
          type: "object",
          properties: {
            code: { type: "string", description: "Python code to execute" },
          },
          required: ["code"],
        },
      },
    },
  ],
});
// Cost: $5 per 1,000 code executions
```

### 7. Function Calling

```typescript
const tools = [
  {
    type: "function",
    function: {
      name: "calculate_modification_cost",
      description: "Calculate the cost of a home modification",
      parameters: {
        type: "object",
        properties: {
          modification: {
            type: "string",
            enum: ["grab_bars", "walk_in_tub", "stair_lift", "ramp", "widened_doorway"]
          },
          quantity: { type: "number" },
          quality: { type: "string", enum: ["standard", "premium"] },
        },
        required: ["modification", "quantity"],
      },
    },
  },
];

const completion = await client.chat.completions.create({
  model: "grok-4.1",
  messages: [{ role: "user", content: "How much would 4 premium grab bars cost?" }],
  tools,
  tool_choice: "auto",
});

const toolCalls = completion.choices[0].message.tool_calls;
if (toolCalls) {
  for (const call of toolCalls) {
    const args = JSON.parse(call.function.arguments);
    console.log(`Function: ${call.function.name}`, args);

    // Execute and continue conversation
    const result = await calculateCost(args.modification, args.quantity, args.quality);

    const followUp = await client.chat.completions.create({
      model: "grok-4.1",
      messages: [
        { role: "user", content: "How much would 4 premium grab bars cost?" },
        completion.choices[0].message,
        {
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        },
      ],
      tools,
    });
  }
}
```

### 8. Vision (Image Analysis)

```typescript
const completion = await client.chat.completions.create({
  model: "grok-2-vision-latest",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "Analyze this bathroom photo for accessibility issues and suggest modifications." },
        {
          type: "image_url",
          image_url: {
            url: "data:image/jpeg;base64,..." // or URL
          },
        },
      ],
    },
  ],
  max_tokens: 1500,
});
```

### 9. Automatic Prompt Caching

Grok automatically caches prompts - no configuration needed:

```typescript
// First request - cache miss
const response1 = await client.chat.completions.create({
  model: "grok-4.1",
  messages: [
    { role: "system", content: "You are an expert in ADA compliance and aging-in-place design. Here is the complete ADA guidelines document...(large context)" },
    { role: "user", content: "What are grab bar requirements?" },
  ],
});

// Subsequent request - automatic cache hit (same system prompt)
const response2 = await client.chat.completions.create({
  model: "grok-4.1",
  messages: [
    { role: "system", content: "You are an expert in ADA compliance and aging-in-place design. Here is the complete ADA guidelines document...(same context)" },
    { role: "user", content: "What are doorway width requirements?" },
  ],
});
// Cache read: $0.05/1M tokens (75% savings!)
```

### 10. Large Context (2M Tokens)

```typescript
// Use extended context for entire codebases, long documents
const completion = await client.chat.completions.create({
  model: "grok-4.1", // Supports 2M tokens
  messages: [
    {
      role: "user",
      content: `Here is the complete building code documentation (500K+ tokens):\n\n${largeDocument}\n\nWhat accessibility requirements apply to residential bathrooms?`,
    },
  ],
  max_tokens: 4000,
});
// Large context pricing: $6/1M input, $30/1M output for Grok 4
```

## Error Handling

```typescript
try {
  const completion = await client.chat.completions.create({...});
} catch (error) {
  if (error.status === 429) {
    const retryAfter = error.headers?.["retry-after"];
    console.error("Rate limit exceeded, retry after:", retryAfter);
    // Implement exponential backoff
  } else if (error.status === 401) {
    console.error("Invalid API key");
  } else if (error.status === 400) {
    console.error("Bad request:", error.message);
  } else {
    console.error("API error:", error);
  }
}
```

## Cost Calculation

```typescript
interface GrokPricing {
  input: number;
  output: number;
  cachedInput?: number;
  inputLargeContext?: number;
  outputLargeContext?: number;
}

const GROK_PRICING: Record<string, GrokPricing> = {
  "grok-4.1": { input: 0.20, output: 0.50, cachedInput: 0.05 },
  "grok-4.1-fast": { input: 0.20, output: 0.50, cachedInput: 0.05 },
  "grok-4": { input: 3.00, output: 15.00, cachedInput: 0.75, inputLargeContext: 6.00, outputLargeContext: 30.00 },
  "grok-4-fast": { input: 0.20, output: 0.50, cachedInput: 0.05 },
  "grok-3": { input: 3.00, output: 15.00 },
  "grok-3-mini": { input: 0.30, output: 0.50 },
  "grok-code-fast-1": { input: 0.20, output: 1.50 },
};

const TOOL_PRICING: Record<string, number> = {
  "web_search": 5.00,
  "x_search": 5.00,
  "code_execution": 5.00,
  "document_search": 5.00,
  "collections_search": 2.50,
};

function calculateGrokCost(
  inputTokens: number,
  outputTokens: number,
  model: string,
  cachedTokens: number = 0,
  isLargeContext: boolean = false,
  toolCalls: Record<string, number> = {}
): number {
  const prices = GROK_PRICING[model] || GROK_PRICING["grok-4.1"];

  const inputPrice = isLargeContext && prices.inputLargeContext
    ? prices.inputLargeContext
    : prices.input;
  const outputPrice = isLargeContext && prices.outputLargeContext
    ? prices.outputLargeContext
    : prices.output;

  const regularInputTokens = inputTokens - cachedTokens;
  const inputCost = (regularInputTokens / 1_000_000) * inputPrice;
  const cachedCost = prices.cachedInput
    ? (cachedTokens / 1_000_000) * prices.cachedInput
    : 0;
  const outputCost = (outputTokens / 1_000_000) * outputPrice;

  // Tool costs
  let toolCost = 0;
  for (const [tool, count] of Object.entries(toolCalls)) {
    toolCost += (count / 1000) * (TOOL_PRICING[tool] || 5.00);
  }

  return inputCost + cachedCost + outputCost + toolCost;
}

function calculateVoiceCost(durationMinutes: number): number {
  return durationMinutes * 0.05;
}
```

## Best Practices

### Model Selection Guide
| Use Case | Recommended Model | Why |
|----------|------------------|-----|
| Complex reasoning | Grok 4.1 | Best value, #1 LMArena |
| Quick responses | Grok 4.1 Fast | No thinking overhead |
| Code generation | Grok Code Fast 1 | Optimized for code |
| Budget tasks | Grok 3 Mini | 90% cheaper than Grok 3 |
| Image analysis | Grok 2 Vision | Vision capabilities |
| Real-time info | Grok 4.1 + Web/X Search | Built-in search tools |

### Temperature Settings
- **0.0-0.3**: Deterministic, factual (translations, structured data)
- **0.5-0.7**: Balanced (default)
- **0.8-1.0**: Creative, varied outputs

### Token Management
- Grok 4.1: 2M token context window
- Automatic prompt caching (no configuration needed)
- Set `max_tokens` to control response length and costs

### Rate Limits
- Vary by tier and model
- Monitor `x-ratelimit-*` headers
- Implement exponential backoff

### Cost Optimization
1. Use Grok 4.1/4.1 Fast - best value at $0.20/$0.50
2. Skip Grok 3 - use Grok 3 Mini (better performance, 90% cheaper)
3. Use automatic caching - 75% savings on repeated context
4. Use non-reasoning mode for simple tasks
5. Batch tool calls when possible ($5 per 1,000 calls)

### Tool Usage Best Practices
- **Web Search**: Current events, recent information
- **X Search**: Trending topics, public sentiment
- **Code Execution**: Complex calculations, data processing
- **Document Search**: Query uploaded documents

## Environment Variables

```bash
# Required
XAI_API_KEY=xai-...

# Optional
XAI_BASE_URL=https://api.x.ai/v1  # Default
```

## Upcoming: Grok 5 (Q1 2026)

- 6 trillion parameters (largest publicly announced)
- Native video understanding
- Training on Colossus 2 supercluster
- Expected Q1 2026

## Resources

- **API Documentation**: [docs.x.ai](https://docs.x.ai)
- **Models & Pricing**: [docs.x.ai/docs/models](https://docs.x.ai/docs/models)
- **Release Notes**: [docs.x.ai/docs/release-notes](https://docs.x.ai/docs/release-notes)
- **xAI Console**: [console.x.ai](https://console.x.ai)
- **X Post (Grok 4 Fast Free)**: Grok 4 Fast available free on OpenRouter and Vercel AI Gateway
