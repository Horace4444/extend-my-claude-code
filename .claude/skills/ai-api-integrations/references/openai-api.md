# OpenAI API Reference

> **Last Updated**: January 2026
> **Official Pricing**: [platform.openai.com/docs/pricing](https://platform.openai.com/docs/pricing)

## Current Models (January 2026)

### GPT-5.2 Series (Latest - December 2025)

#### GPT-5.2 (Flagship)
- **Model ID**: `gpt-5.2` or `gpt-5.2-2025-12-11`
- **Context Window**: 400K tokens input, 128K tokens output
- **Pricing**: $1.75/1M input, $14.00/1M output
- **Cached Input**: $0.175/1M tokens (90% discount)
- **Best For**: Complex reasoning, coding, agentic tasks
- **Note**: First model above 90% on ARC-AGI-1

#### GPT-5.2 Pro (Extended Thinking)
- **Model ID**: `gpt-5.2-pro`
- **Context Window**: 400K tokens
- **Pricing**: $21.00/1M input, $168.00/1M output
- **Best For**: Maximum reasoning depth, research tasks

#### GPT-5.2 Instant (Fast)
- **Model ID**: `gpt-5.2-instant`
- **Pricing**: ~$0.60/1M input, ~$2.40/1M output (estimated)
- **Best For**: Fast everyday tasks, info-seeking, translation

#### GPT-5.2-Codex (Agentic Coding)
- **Model ID**: `gpt-5.2-codex`
- **Best For**: Professional software engineering, defensive cybersecurity
- **Note**: API access rolling out

### GPT-5.1 Series

#### GPT-5.1
- **Model ID**: `gpt-5.1`
- **Context Window**: 256K tokens
- **Pricing**: $1.25/1M input, $10.00/1M output
- **Cached Input**: $0.125/1M tokens

#### GPT-5.1 Instant
- **Model ID**: `gpt-5.1-instant`
- **Best For**: Most-used model for everyday tasks

### GPT-4o Series (Previous Generation)

#### GPT-4o
- **Model ID**: `gpt-4o` or `gpt-4o-latest`
- **Context Window**: 128K tokens
- **Pricing**: $2.50/1M input, $10.00/1M output
- **Best For**: Multimodal (text + images), general tasks

#### GPT-4o Mini (Cost-Effective)
- **Model ID**: `gpt-4o-mini`
- **Context Window**: 128K tokens
- **Pricing**: $0.15/1M input, $0.60/1M output
- **Best For**: High-volume, cost-sensitive applications

### o-Series (Reasoning Models)

#### o3
- **Model ID**: `o3`
- **Context Window**: 200K tokens
- **Pricing**: $2.00/1M input, $8.00/1M output
- **Batch API**: $1.00/1M input, $4.00/1M output
- **Best For**: Complex reasoning, math, science

#### o3-mini
- **Model ID**: `o3-mini`
- **Context Window**: 200K tokens input, 100K output
- **Pricing**: $1.10/1M input, $4.40/1M output
- **Batch API**: $0.55/1M input, $2.20/1M output

### Embeddings

| Model | Price | Dimensions |
|-------|-------|------------|
| text-embedding-3-small | $0.02/1M tokens | 1536 |
| text-embedding-3-large | $0.13/1M tokens | 3072 |
| text-embedding-ada-002 | $0.10/1M tokens | 1536 (legacy) |

### Audio (Whisper)
- **Model ID**: `whisper-1`
- **Pricing**: $0.006 per minute of audio
- **Max File Size**: 25MB
- **Languages**: 50+ supported

## Pricing Summary Table

| Model | Input | Output | Cached Input | Notes |
|-------|-------|--------|--------------|-------|
| GPT-5.2 | $1.75 | $14.00 | $0.175 | 400K context, flagship |
| GPT-5.2 Pro | $21.00 | $168.00 | - | Extended thinking |
| GPT-5.1 | $1.25 | $10.00 | $0.125 | 256K context |
| GPT-4o | $2.50 | $10.00 | $1.25 | 128K, multimodal |
| GPT-4o-mini | $0.15 | $0.60 | $0.075 | Best value |
| o3 | $2.00 | $8.00 | - | Reasoning |
| o3-mini | $1.10 | $4.40 | - | Fast reasoning |

*All prices per million tokens*

## Client Initialization

```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

## Common Patterns

### 1. Standard Chat Completions

```typescript
const completion = await openai.chat.completions.create({
  model: "gpt-5.2",
  messages: [
    { role: "system", content: "You are an aging-in-place design consultant." },
    { role: "user", content: "What bathroom modifications help seniors?" },
  ],
  temperature: 0.7,
  max_tokens: 2000,
});

const response = completion.choices[0].message.content;
console.log(response);
```

### 2. Structured Outputs with Zod

```typescript
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const ModificationSchema = z.object({
  room: z.string(),
  modifications: z.array(z.object({
    name: z.string(),
    estimated_cost: z.number(),
    priority: z.enum(["high", "medium", "low"]),
    description: z.string(),
  })),
  total_estimated_cost: z.number(),
});

const completion = await openai.beta.chat.completions.parse({
  model: "gpt-5.2",
  messages: [
    { role: "system", content: "You analyze homes for aging-in-place modifications." },
    { role: "user", content: "Analyze bathroom modifications for a senior with mobility issues." },
  ],
  response_format: zodResponseFormat(ModificationSchema, "modification_plan"),
  temperature: 0.3,
});

const result = completion.choices[0].message.parsed;
// Typed result: { room: string, modifications: [...], total_estimated_cost: number }
```

### 3. Streaming Responses

```typescript
const stream = await openai.chat.completions.create({
  model: "gpt-5.2",
  messages: [{ role: "user", content: "Write a detailed design proposal" }],
  stream: true,
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || "";
  process.stdout.write(content);
}
```

### 4. Vision (Image Analysis)

```typescript
const completion = await openai.chat.completions.create({
  model: "gpt-5.2",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "Analyze this bathroom for accessibility issues." },
        {
          type: "image_url",
          image_url: {
            url: "data:image/jpeg;base64,..." // or URL
          }
        }
      ]
    }
  ],
  max_tokens: 1500,
});
```

### 5. Function Calling (Tools)

```typescript
const tools = [
  {
    type: "function",
    function: {
      name: "calculate_modification_cost",
      description: "Calculate cost for a home modification",
      parameters: {
        type: "object",
        properties: {
          modification: {
            type: "string",
            enum: ["grab_bars", "walk_in_tub", "stair_lift", "ramp"]
          },
          quantity: { type: "number" },
          quality: { type: "string", enum: ["standard", "premium"] }
        },
        required: ["modification", "quantity"]
      }
    }
  }
];

const completion = await openai.chat.completions.create({
  model: "gpt-5.2",
  messages: [{ role: "user", content: "How much would 3 grab bars cost?" }],
  tools,
  tool_choice: "auto",
});

// Handle tool calls
const toolCalls = completion.choices[0].message.tool_calls;
if (toolCalls) {
  for (const call of toolCalls) {
    const args = JSON.parse(call.function.arguments);
    console.log(`Function: ${call.function.name}`, args);

    // Execute function and continue conversation
    const result = await executeFunction(call.function.name, args);

    const followUp = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        { role: "user", content: "How much would 3 grab bars cost?" },
        completion.choices[0].message,
        {
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result)
        }
      ],
      tools,
    });
  }
}
```

### 6. Embeddings for Semantic Search

```typescript
const embedding = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: "ADA compliant grab bar installation requirements",
});

const vector = embedding.data[0].embedding; // 1536-dimensional array

// Use with vector database (Supabase pgvector, Pinecone, etc.)
```

### 7. Audio Transcription

```typescript
import fs from "fs";

const transcription = await openai.audio.transcriptions.create({
  file: fs.createReadStream("client_interview.mp3"),
  model: "whisper-1",
  language: "en",
  response_format: "verbose_json",
  timestamp_granularities: ["word", "segment"],
});

console.log(transcription.text);
// Access timestamps: transcription.segments, transcription.words
```

### 8. Web Search (GPT-5.2)

```typescript
// Web search is available as a tool in GPT-5.2
const completion = await openai.chat.completions.create({
  model: "gpt-5.2",
  messages: [
    { role: "user", content: "What are the latest ADA bathroom requirements for 2026?" }
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
            query: { type: "string" }
          },
          required: ["query"]
        }
      }
    }
  ]
});
```

### 9. Batch API (50% Discount)

```typescript
// Create batch file
const batchInput = [
  { custom_id: "req-1", method: "POST", url: "/v1/chat/completions", body: { model: "gpt-5.2", messages: [...] } },
  { custom_id: "req-2", method: "POST", url: "/v1/chat/completions", body: { model: "gpt-5.2", messages: [...] } },
];

// Upload and create batch
const file = await openai.files.create({
  file: fs.createReadStream("batch_input.jsonl"),
  purpose: "batch",
});

const batch = await openai.batches.create({
  input_file_id: file.id,
  endpoint: "/v1/chat/completions",
  completion_window: "24h",
});

// Check status
const status = await openai.batches.retrieve(batch.id);
if (status.status === "completed") {
  const results = await openai.files.content(status.output_file_id);
  // Process results
}
```

## Error Handling

```typescript
import { OpenAI, APIError, RateLimitError, AuthenticationError } from "openai";

try {
  const completion = await openai.chat.completions.create({...});
} catch (error) {
  if (error instanceof RateLimitError) {
    const retryAfter = error.headers?.["retry-after"];
    console.error("Rate limit exceeded, retry after:", retryAfter);
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
interface OpenAIPricing {
  input: number;
  output: number;
  cachedInput?: number;
}

const OPENAI_PRICING: Record<string, OpenAIPricing> = {
  "gpt-5.2": { input: 1.75, output: 14.00, cachedInput: 0.175 },
  "gpt-5.2-pro": { input: 21.00, output: 168.00 },
  "gpt-5.1": { input: 1.25, output: 10.00, cachedInput: 0.125 },
  "gpt-4o": { input: 2.50, output: 10.00, cachedInput: 1.25 },
  "gpt-4o-mini": { input: 0.15, output: 0.60, cachedInput: 0.075 },
  "o3": { input: 2.00, output: 8.00 },
  "o3-mini": { input: 1.10, output: 4.40 },
};

function calculateOpenAICost(
  inputTokens: number,
  outputTokens: number,
  model: string,
  cachedTokens: number = 0,
  isBatch: boolean = false
): number {
  const prices = OPENAI_PRICING[model] || OPENAI_PRICING["gpt-5.2"];
  const batchMultiplier = isBatch ? 0.5 : 1.0;

  const regularInputTokens = inputTokens - cachedTokens;
  const inputCost = (regularInputTokens / 1_000_000) * prices.input * batchMultiplier;
  const cachedCost = prices.cachedInput
    ? (cachedTokens / 1_000_000) * prices.cachedInput * batchMultiplier
    : 0;
  const outputCost = (outputTokens / 1_000_000) * prices.output * batchMultiplier;

  return inputCost + cachedCost + outputCost;
}

// Embedding cost
function calculateEmbeddingCost(tokens: number, model: string = "text-embedding-3-small"): number {
  const pricing = { "text-embedding-3-small": 0.02, "text-embedding-3-large": 0.13 };
  return (tokens / 1_000_000) * (pricing[model] || 0.02);
}

// Audio cost
function calculateAudioCost(durationMinutes: number): number {
  return durationMinutes * 0.006;
}
```

## Best Practices

### Model Selection Guide
| Use Case | Recommended Model | Why |
|----------|------------------|-----|
| Complex design proposals | GPT-5.2 | Best reasoning, 400K context |
| Quick client responses | GPT-5.2 Instant | Fast, cost-effective |
| Code generation | GPT-5.2-Codex | Specialized for coding |
| High-volume simple tasks | GPT-4o-mini | Lowest cost |
| Deep reasoning/research | GPT-5.2 Pro | Extended thinking |
| Batch processing | Any + Batch API | 50% discount |

### Temperature Settings
- **0.0-0.3**: Deterministic, factual (cost estimates, structured outputs)
- **0.3-0.7**: Balanced creativity and consistency
- **0.7-1.0**: Creative, varied (design proposals)

### Token Management
- GPT-5.2: 400K input, 128K output
- GPT-5.1: 256K context
- GPT-4o: 128K context
- Always set `max_tokens` to control costs

### Rate Limits by Tier
| Tier | Tokens/min | Requests/min |
|------|------------|--------------|
| Free | 200K | 3 |
| Tier 1 ($5+) | 800K | 500 |
| Tier 2 ($50+) | 2M | 5,000 |
| Tier 3 ($100+) | 4M | 5,000 |
| Tier 4 ($250+) | 10M | 10,000 |
| Tier 5 ($1,000+) | 30M | 10,000 |

### Cost Optimization
1. Use caching for repeated context (90% savings)
2. Use Batch API for non-urgent tasks (50% savings)
3. Use GPT-4o-mini for simple tasks
4. Use structured outputs to reduce token waste
5. Monitor usage in OpenAI dashboard

## Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...

# Optional
OPENAI_ORG_ID=org-...           # Organization ID
OPENAI_BASE_URL=https://api.openai.com/v1  # Custom endpoint
```

## Resources

- **Pricing Page**: [platform.openai.com/docs/pricing](https://platform.openai.com/docs/pricing)
- **Models Overview**: [platform.openai.com/docs/models](https://platform.openai.com/docs/models)
- **API Reference**: [platform.openai.com/docs/api-reference](https://platform.openai.com/docs/api-reference)
- **Cookbook**: [cookbook.openai.com](https://cookbook.openai.com)
