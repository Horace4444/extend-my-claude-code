# AI API Integration Best Practices

## Prompt Construction

### Structured Prompts

**Good Pattern**:
```typescript
const systemPrompt = `You are a professional translator specializing in construction terminology.

Instructions:
1. Translate accurately while preserving technical terms
2. Use the provided dictionary entries for domain-specific vocabulary
3. Return structured JSON with translated text and term spans

Output format: Strict JSON matching the provided schema`;

const userPrompt = `Source: ${sourceLanguage}
Target: ${targetLanguage}

Dictionary Entries:
${dictionaryHits.map(hit => `- ${hit.preferred_label}: ${hit.definition}`).join('\n')}

Text to translate: "${text}"`;
```

**Anti-pattern**:
```typescript
// Vague, unstructured prompt
const prompt = `Translate this: ${text}. Make it good.`;
```

### Few-Shot Learning

**Good Pattern**:
```typescript
const examples = `
Example 1:
Input: "Install the GFCI outlet in the kitchen"
Output: {"translation": "Instale el tomacorriente GFCI en la cocina", "terms": ["GFCI outlet"]}

Example 2:
Input: "Check the P-trap under the sink"
Output: {"translation": "Revise el sifón P debajo del fregadero", "terms": ["P-trap", "sink"]}
`;

const prompt = `${examples}\n\nNow translate: ${userInput}`;
```

### Temperature Selection

| Task Type | Temperature | Reasoning |
|-----------|-------------|-----------|
| Translation | 0.0-0.3 | Deterministic, consistent |
| Code Generation | 0.0-0.2 | Precise syntax required |
| Data Extraction | 0.0-0.1 | Factual accuracy critical |
| Creative Writing | 0.7-1.0 | Variety and creativity desired |
| General Chat | 0.5-0.7 | Balanced consistency and variety |

## Cost Optimization

### 1. Model Selection Strategy

```typescript
// Cost-performance tiers
const modelStrategy = {
  // High-volume, simple tasks
  cheap: {
    openai: "gpt-4o-mini",      // $0.15/$0.60 per 1M
    anthropic: "claude-haiku-4", // $0.80/$4.00 per 1M
    google: "gemini-3-flash",    // $0.50/$3.00 per 1M
    xai: "grok-4.1",             // $0.20/$0.50 per 1M (cheapest)
  },
  // Production workloads
  balanced: {
    openai: "gpt-4o-mini",
    anthropic: "claude-sonnet-4-5",
    google: "gemini-2.5-flash",
    xai: "grok-4.1",
  },
  // Critical, complex tasks
  premium: {
    openai: "gpt-4o",
    anthropic: "claude-opus-4-5",
    google: "gemini-2.5-pro",
    xai: "grok-4",
  },
};
```

### 2. Prompt Caching

**Anthropic (90% savings on cached content)**:
```typescript
const cachedSystemPrompt = {
  type: "text",
  text: largeDocumentation, // Reused across requests
  cache_control: { type: "ephemeral" },
};

// First request: Cache miss (full cost)
await anthropic.messages.create({
  system: [cachedSystemPrompt],
  messages: [{ role: "user", content: "Question 1" }],
});

// Subsequent requests: Cache hit (90% savings on system prompt)
await anthropic.messages.create({
  system: [cachedSystemPrompt], // Same text = cached
  messages: [{ role: "user", content: "Question 2" }],
});
```

**xAI (automatic caching)**:
```typescript
// Grok automatically caches repeated prompts - no configuration needed
```

### 3. Batch Processing

**Anthropic (50% cost savings)**:
```typescript
const batch = await anthropic.batches.create({
  requests: items.map((item, i) => ({
    custom_id: `item-${i}`,
    params: {
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: item.text }],
    },
  })),
});

// Process results when complete
const results = await anthropic.batches.results(batch.id);
```

**Google (50% discount with Batch API)**:
```typescript
// Similar pattern - async processing, half-price
```

### 4. Token Management

```typescript
// Bad: Unbounded output
const result = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [...],
  // No max_tokens = potential runaway cost
});

// Good: Controlled output
const result = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [...],
  max_tokens: 500, // Explicit limit
});

// Better: Dynamic limits based on task
const limits = {
  translation: 1000,
  summary: 500,
  classification: 50,
};

const result = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [...],
  max_tokens: limits[taskType],
});
```

## Database Integration Patterns

### 1. Vector Search with AI Embeddings

**Complete Pattern** (from Vozra backend):
```typescript
// 1. Generate embedding for query
const queryEmbedding = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: searchText,
});

// 2. Search database with pgvector
const { data, error } = await supabase.rpc("match_dictionary_entries", {
  query_embedding: queryEmbedding.data[0].embedding,
  match_threshold: 0.5,
  match_count: 10,
});

// 3. Use results in AI prompt
const dictionaryContext = data
  .map(hit => `${hit.term}: ${hit.definition}`)
  .join("\n");

const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    { role: "system", content: "Use these definitions:\n" + dictionaryContext },
    { role: "user", content: userQuery },
  ],
});
```

### 2. Cross-Language Query Translation

**Anti-pattern** (poor search results):
```typescript
// Spanish query → English embeddings = poor matches
const embedding = await openai.embeddings.create({
  input: "¿Dónde está el disyuntor?", // Spanish query
});
// Searches English-based dictionary → weak results
```

**Good Pattern** (translate first):
```typescript
// 1. Translate query to English (dictionary language)
const translatedQuery = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    { role: "system", content: "Extract construction terms and translate to English" },
    { role: "user", content: "¿Dónde está el disyuntor?" },
  ],
});
// Result: "circuit breaker"

// 2. Embed translated query
const embedding = await openai.embeddings.create({
  input: translatedQuery.choices[0].message.content,
});
// Now searches effectively against English dictionary
```

### 3. Storing AI Results in Database

```typescript
// Pattern: Store AI metadata for analytics
const completion = await openai.chat.completions.create({...});

await supabase.from("translations").insert({
  user_id: userId,
  source_text: sourceText,
  translated_text: completion.choices[0].message.content,
  source_language: sourceLang,
  target_language: targetLang,
  model_used: "gpt-4o-mini",
  tokens_used: completion.usage.total_tokens,
  cost_cents: calculateCost(completion.usage),
  created_at: new Date().toISOString(),
});

// Benefits:
// - Cost tracking per user/tenant
// - Quality monitoring over time
// - Audit trail for compliance
// - Analytics and reporting
```

## Error Handling & Retries

### Exponential Backoff

```typescript
async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isRateLimitError =
        error?.status === 429 ||
        error?.message?.includes("rate limit");

      if (!isRateLimitError || attempt === maxRetries - 1) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 1000;

      console.log(`Rate limited. Retrying in ${delay + jitter}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }

  throw new Error("Max retries exceeded");
}

// Usage
const result = await callWithRetry(() =>
  openai.chat.completions.create({...})
);
```

### Graceful Degradation

```typescript
async function translateWithFallback(text: string, lang: string): Promise<string> {
  try {
    // Try premium model first
    return await translateWithModel(text, lang, "gpt-4o");
  } catch (error) {
    console.warn("Premium model failed, trying fallback:", error);

    try {
      // Fallback to cheaper model
      return await translateWithModel(text, lang, "gpt-4o-mini");
    } catch (fallbackError) {
      console.error("All translation attempts failed:", fallbackError);

      // Last resort: return original with error note
      return `[Translation unavailable] ${text}`;
    }
  }
}
```

## Authentication Flow

### Clerk + Supabase Pattern

```typescript
// 1. Authenticate with Clerk (frontend)
const { getToken } = useAuth();
const clerkToken = await getToken();

// 2. Exchange Clerk token for Supabase token (backend)
import { verifyToken } from "@clerk/backend";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const clerkToken = authHeader?.replace("Bearer ", "");

  // Verify Clerk token
  const clerkPayload = await verifyToken(clerkToken, {
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  // Create Supabase client with service role
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Use Clerk userId for RLS policies
  const { data, error } = await supabase
    .from("user_data")
    .select("*")
    .eq("clerk_user_id", clerkPayload.sub);

  return Response.json(data);
}
```

### Row-Level Security with Clerk IDs

```sql
-- Supabase RLS policy using Clerk user ID
CREATE POLICY "Users can only access their own data"
ON user_data
FOR ALL
USING (
  clerk_user_id = current_setting('app.current_user_id', true)
);

-- Set context in application
-- In your API route:
await supabase.rpc('set_config', {
  key: 'app.current_user_id',
  value: clerkUserId
});
```

## Debugging & Monitoring

### Logging Strategy

```typescript
interface AIRequestLog {
  timestamp: string;
  provider: "openai" | "anthropic" | "google" | "xai";
  model: string;
  operation: string;
  input_tokens?: number;
  output_tokens?: number;
  cost_cents: number;
  latency_ms: number;
  success: boolean;
  error?: string;
}

async function loggedAICall<T>(
  operation: string,
  provider: string,
  model: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  const log: AIRequestLog = {
    timestamp: new Date().toISOString(),
    provider: provider as any,
    model,
    operation,
    latency_ms: 0,
    cost_cents: 0,
    success: false,
  };

  try {
    const result = await fn();
    log.success = true;
    log.latency_ms = Date.now() - startTime;

    // Extract usage info (varies by provider)
    if ("usage" in result) {
      log.input_tokens = result.usage.prompt_tokens;
      log.output_tokens = result.usage.completion_tokens;
      log.cost_cents = calculateCost(result.usage);
    }

    return result;
  } catch (error) {
    log.success = false;
    log.latency_ms = Date.now() - startTime;
    log.error = error instanceof Error ? error.message : String(error);
    throw error;
  } finally {
    // Store log (Supabase, file, monitoring service)
    await storeLog(log);
  }
}

// Usage
const result = await loggedAICall(
  "translation",
  "openai",
  "gpt-4o-mini",
  () => openai.chat.completions.create({...})
);
```

### Cost Tracking Dashboard

```typescript
// Query for cost analytics
const { data } = await supabase
  .from("ai_request_logs")
  .select("provider, model, cost_cents, created_at")
  .gte("created_at", thirtyDaysAgo)
  .order("created_at", { ascending: false });

// Aggregate by provider
const costByProvider = data.reduce((acc, log) => {
  acc[log.provider] = (acc[log.provider] || 0) + log.cost_cents;
  return acc;
}, {});

console.log("Monthly AI costs:", {
  openai: `$${(costByProvider.openai / 100).toFixed(2)}`,
  anthropic: `$${(costByProvider.anthropic / 100).toFixed(2)}`,
  total: `$${(Object.values(costByProvider).reduce((a, b) => a + b, 0) / 100).toFixed(2)}`,
});
```
