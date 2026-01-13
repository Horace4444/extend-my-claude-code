# Anthropic Claude API Reference

> **Last Updated**: January 2026
> **Official Pricing**: [platform.claude.com/docs/en/about-claude/pricing](https://platform.claude.com/docs/en/about-claude/pricing)

## Current Models (January 2026)

### Claude Opus 4.5 (Flagship)
- **Model ID**: `claude-opus-4-5-20251220`
- **Context Window**: 200K tokens (1M beta available)
- **Pricing**: $5.00/1M input, $25.00/1M output
- **Best For**: Highest intelligence, complex reasoning, creative tasks, agentic workflows
- **Note**: 67% cost reduction vs. Opus 4.1 with improved capabilities

### Claude Opus 4.1
- **Model ID**: `claude-opus-4-1-20250414`
- **Context Window**: 200K tokens
- **Pricing**: $15.00/1M input, $75.00/1M output
- **Best For**: Complex multi-step reasoning with extended thinking

### Claude Opus 4
- **Model ID**: `claude-opus-4-20250318`
- **Context Window**: 200K tokens
- **Pricing**: $15.00/1M input, $75.00/1M output
- **Best For**: Complex reasoning tasks

### Claude Sonnet 4.5 (Balanced)
- **Model ID**: `claude-sonnet-4-5-20241022`
- **Context Window**: 200K tokens (1M beta available for Tier 4+)
- **Pricing**: $3.00/1M input, $15.00/1M output
- **Long Context (>200K)**: $6.00/1M input, $22.50/1M output
- **Best For**: Balanced performance and cost, most workloads

### Claude Sonnet 4
- **Model ID**: `claude-sonnet-4-20250514`
- **Context Window**: 200K tokens (1M beta available)
- **Pricing**: $3.00/1M input, $15.00/1M output
- **Long Context (>200K)**: $6.00/1M input, $22.50/1M output

### Claude Haiku 4.5 (Fast)
- **Model ID**: `claude-haiku-4-5-20241022`
- **Context Window**: 200K tokens
- **Pricing**: $1.00/1M input, $5.00/1M output
- **Best For**: Fast responses, high-volume, cost-sensitive applications

### Claude Haiku 3.5 (Economy)
- **Model ID**: `claude-3-5-haiku-20241022`
- **Context Window**: 200K tokens
- **Pricing**: $0.80/1M input, $4.00/1M output
- **Best For**: Budget-conscious, high-volume tasks

### Claude Haiku 3 (Legacy)
- **Model ID**: `claude-3-haiku-20240307`
- **Context Window**: 200K tokens
- **Pricing**: $0.25/1M input, $1.25/1M output
- **Best For**: Lowest cost, simple tasks

## Pricing Summary Table

| Model | Input | Output | Cache Write (5m) | Cache Read | Batch Input | Batch Output |
|-------|-------|--------|------------------|------------|-------------|--------------|
| Opus 4.5 | $5 | $25 | $6.25 | $0.50 | $2.50 | $12.50 |
| Opus 4.1/4 | $15 | $75 | $18.75 | $1.50 | $7.50 | $37.50 |
| Sonnet 4.5/4 | $3 | $15 | $3.75 | $0.30 | $1.50 | $7.50 |
| Haiku 4.5 | $1 | $5 | $1.25 | $0.10 | $0.50 | $2.50 |
| Haiku 3.5 | $0.80 | $4 | $1 | $0.08 | $0.40 | $2 |
| Haiku 3 | $0.25 | $1.25 | $0.30 | $0.03 | $0.125 | $0.625 |

*All prices per million tokens (MTok)*

## Client Initialization

```typescript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
```

## Common Patterns

### 1. Standard Message Creation

```typescript
const message = await anthropic.messages.create({
  model: "claude-sonnet-4-5-20241022",
  max_tokens: 1024,
  messages: [
    {
      role: "user",
      content: "Explain quantum computing in simple terms",
    },
  ],
});

console.log(message.content[0].text);
```

### 2. System Prompts

```typescript
const message = await anthropic.messages.create({
  model: "claude-sonnet-4-5-20241022",
  max_tokens: 1024,
  system: "You are a professional interior designer specializing in aging-in-place modifications.",
  messages: [
    {
      role: "user",
      content: "What bathroom modifications improve safety for seniors?",
    },
  ],
});
```

### 3. Streaming Responses

```typescript
const stream = await anthropic.messages.create({
  model: "claude-sonnet-4-5-20241022",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Write a detailed design proposal" }],
  stream: true,
});

for await (const event of stream) {
  if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
    process.stdout.write(event.delta.text);
  }
}
```

### 4. Prompt Caching (90% Cost Savings)

```typescript
// First request creates cache (5-minute TTL by default)
const message1 = await anthropic.messages.create({
  model: "claude-sonnet-4-5-20241022",
  max_tokens: 1024,
  system: [
    {
      type: "text",
      text: "You are an expert in ADA compliance and aging-in-place design...", // Large context
      cache_control: { type: "ephemeral" }, // 5-minute cache
    },
  ],
  messages: [{ role: "user", content: "What are grab bar requirements?" }],
});

// For 1-hour cache TTL (costs 2x base input, but better for longer sessions)
const message2 = await anthropic.messages.create({
  model: "claude-sonnet-4-5-20241022",
  max_tokens: 1024,
  system: [
    {
      type: "text",
      text: "You are an expert in ADA compliance...",
      cache_control: { type: "ephemeral", ttl: 3600 }, // 1-hour cache
    },
  ],
  messages: [{ role: "user", content: "What about doorway widths?" }],
});

// Cache pricing:
// - 5-minute cache write: 1.25x base input price
// - 1-hour cache write: 2x base input price
// - Cache reads: 0.1x base input price (90% savings!)
// - Minimum cacheable length: 1024 tokens
```

### 5. Batch Processing (50% Cost Savings)

```typescript
// Submit batch request (processes within 24 hours)
const batch = await anthropic.batches.create({
  requests: [
    {
      custom_id: "client-assessment-1",
      params: {
        model: "claude-sonnet-4-5-20241022",
        max_tokens: 2048,
        messages: [{ role: "user", content: "Analyze this home layout for accessibility..." }],
      },
    },
    {
      custom_id: "client-assessment-2",
      params: {
        model: "claude-sonnet-4-5-20241022",
        max_tokens: 2048,
        messages: [{ role: "user", content: "Generate modification recommendations..." }],
      },
    },
  ],
});

// Check batch status
const status = await anthropic.batches.retrieve(batch.id);

// Get results when complete
if (status.processing_status === "ended") {
  const results = await anthropic.batches.results(batch.id);
  for await (const result of results) {
    console.log(result.custom_id, result.result.message.content[0].text);
  }
}
```

### 6. Tool Use (Function Calling)

```typescript
const message = await anthropic.messages.create({
  model: "claude-sonnet-4-5-20241022",
  max_tokens: 1024,
  tools: [
    {
      name: "calculate_modification_cost",
      description: "Calculate estimated cost for a home modification",
      input_schema: {
        type: "object",
        properties: {
          modification_type: {
            type: "string",
            enum: ["grab_bars", "ramp", "walk_in_tub", "stair_lift", "widened_doorway"]
          },
          quantity: { type: "number" },
          material_grade: { type: "string", enum: ["standard", "premium"] },
        },
        required: ["modification_type", "quantity"],
      },
    },
  ],
  messages: [{ role: "user", content: "How much would 4 grab bars cost?" }],
});

// Extract tool calls
const toolUse = message.content.find((block) => block.type === "tool_use");
if (toolUse) {
  console.log("Tool:", toolUse.name);
  console.log("Input:", toolUse.input);

  // Continue conversation with tool result
  const followUp = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20241022",
    max_tokens: 1024,
    messages: [
      { role: "user", content: "How much would 4 grab bars cost?" },
      { role: "assistant", content: message.content },
      {
        role: "user",
        content: [{
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: JSON.stringify({ estimated_cost: 320, breakdown: "4 x $80 each" })
        }]
      }
    ],
    tools: [...], // Same tools
  });
}
```

### 7. Server-Side Tools

```typescript
// Web Search ($10 per 1,000 searches)
const message = await anthropic.messages.create({
  model: "claude-sonnet-4-5-20241022",
  max_tokens: 4096,
  tools: [{ type: "web_search_20250305", name: "web_search" }],
  messages: [{ role: "user", content: "What are the latest ADA guidelines for residential bathrooms?" }],
});

// Web Fetch (no additional cost, only token costs)
const message2 = await anthropic.messages.create({
  model: "claude-sonnet-4-5-20241022",
  max_tokens: 4096,
  tools: [{
    type: "web_fetch_20250305",
    name: "web_fetch",
    max_content_tokens: 10000 // Limit fetched content
  }],
  messages: [{ role: "user", content: "Fetch the specifications from this product page: https://..." }],
});
```

## Error Handling

```typescript
import { APIError, RateLimitError, AuthenticationError } from "@anthropic-ai/sdk";

try {
  const message = await anthropic.messages.create({...});
} catch (error) {
  if (error instanceof RateLimitError) {
    const retryAfter = error.headers?.["retry-after"];
    console.error("Rate limit hit, retry after:", retryAfter);
    // Implement exponential backoff
  } else if (error instanceof AuthenticationError) {
    console.error("Invalid API key");
  } else if (error instanceof APIError) {
    console.error("API error:", error.status, error.message);
  } else {
    throw error;
  }
}
```

## Cost Calculation

```typescript
interface ClaudePricing {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite5m: number;
  cacheWrite1h: number;
}

const CLAUDE_PRICING: Record<string, ClaudePricing> = {
  "claude-opus-4-5": { input: 5.00, output: 25.00, cacheRead: 0.50, cacheWrite5m: 6.25, cacheWrite1h: 10.00 },
  "claude-opus-4-1": { input: 15.00, output: 75.00, cacheRead: 1.50, cacheWrite5m: 18.75, cacheWrite1h: 30.00 },
  "claude-opus-4": { input: 15.00, output: 75.00, cacheRead: 1.50, cacheWrite5m: 18.75, cacheWrite1h: 30.00 },
  "claude-sonnet-4-5": { input: 3.00, output: 15.00, cacheRead: 0.30, cacheWrite5m: 3.75, cacheWrite1h: 6.00 },
  "claude-sonnet-4": { input: 3.00, output: 15.00, cacheRead: 0.30, cacheWrite5m: 3.75, cacheWrite1h: 6.00 },
  "claude-haiku-4-5": { input: 1.00, output: 5.00, cacheRead: 0.10, cacheWrite5m: 1.25, cacheWrite1h: 2.00 },
  "claude-haiku-3-5": { input: 0.80, output: 4.00, cacheRead: 0.08, cacheWrite5m: 1.00, cacheWrite1h: 1.60 },
  "claude-haiku-3": { input: 0.25, output: 1.25, cacheRead: 0.03, cacheWrite5m: 0.30, cacheWrite1h: 0.50 },
};

function calculateClaudeCost(
  inputTokens: number,
  outputTokens: number,
  model: string,
  cacheReadTokens: number = 0,
  cacheWriteTokens: number = 0,
  cacheWriteType: "5m" | "1h" = "5m",
  isBatch: boolean = false
): number {
  const modelKey = Object.keys(CLAUDE_PRICING).find(k => model.includes(k)) || "claude-sonnet-4-5";
  const prices = CLAUDE_PRICING[modelKey];

  const batchMultiplier = isBatch ? 0.5 : 1.0;
  const cacheWritePrice = cacheWriteType === "5m" ? prices.cacheWrite5m : prices.cacheWrite1h;

  const inputCost = ((inputTokens - cacheReadTokens - cacheWriteTokens) / 1_000_000) * prices.input * batchMultiplier;
  const cacheReadCost = (cacheReadTokens / 1_000_000) * prices.cacheRead * batchMultiplier;
  const cacheWriteCost = (cacheWriteTokens / 1_000_000) * cacheWritePrice * batchMultiplier;
  const outputCost = (outputTokens / 1_000_000) * prices.output * batchMultiplier;

  return inputCost + cacheReadCost + cacheWriteCost + outputCost;
}
```

## Best Practices

### Model Selection Guide
| Use Case | Recommended Model | Why |
|----------|------------------|-----|
| Complex design proposals | Opus 4.5 | Highest quality, creative output |
| Daily client interactions | Sonnet 4.5 | Best balance of quality/cost |
| Quick Q&A, simple tasks | Haiku 4.5 | Fast, affordable |
| High-volume batch processing | Sonnet 4.5 + Batch API | 50% discount |
| Repeated context (assessments) | Any + Caching | 90% savings on cached tokens |

### Temperature Settings
- **0.0-0.3**: Deterministic, factual (cost estimates, compliance checks)
- **0.5-0.7**: Balanced (default: 1.0)
- **0.8-1.0**: Creative (design proposals, client communications)

### Token Management
- Always set `max_tokens` (required parameter)
- Standard: 1024-4096 tokens
- Extended: Up to 8192 tokens per request (32K for some models)
- 1M context window available for Sonnet 4/4.5 (Tier 4+ beta)

### Rate Limits by Tier
| Tier | Requests/min | Tokens/min | Monthly Spend |
|------|-------------|------------|---------------|
| 1 | 50 | 40K | $0+ |
| 2 | 1,000 | 80K | $40+ |
| 3 | 2,000 | 160K | $200+ |
| 4 | 4,000 | 400K | $400+ |

### Caching Strategy
- Cache large, repeated contexts (ADA guidelines, design standards, client history)
- Cache prefix must match exactly for cache hits
- Minimum cacheable: 1024 tokens
- Use 1-hour cache for long client sessions
- Use 5-minute cache for quick lookups

## Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Optional
ANTHROPIC_BASE_URL=https://api.anthropic.com  # For custom endpoints

# Third-party platforms
CLAUDE_CODE_USE_BEDROCK=1     # For AWS Bedrock
CLAUDE_CODE_USE_VERTEX=1      # For Google Vertex AI
CLAUDE_CODE_USE_FOUNDRY=1     # For Microsoft Foundry
```

## Resources

- **Pricing Page**: [platform.claude.com/docs/en/about-claude/pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- **Model Deprecations**: [platform.claude.com/docs/en/about-claude/model-deprecations](https://platform.claude.com/docs/en/about-claude/model-deprecations)
- **API Reference**: [platform.claude.com/docs/en/api](https://platform.claude.com/docs/en/api)
- **Rate Limits**: [platform.claude.com/docs/en/api/rate-limits](https://platform.claude.com/docs/en/api/rate-limits)
