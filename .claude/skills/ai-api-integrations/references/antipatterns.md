# AI Integration Anti-Patterns to Avoid

## 1. Hardcoded Model Names Throughout Codebase

### ❌ Anti-Pattern

```typescript
// translation.ts
const result = await openai.chat.completions.create({
  model: "gpt-4o-mini", // Hardcoded
  // ...
});

// image-generator.ts
const image = await vertexAI.generateImage({
  model: "imagen-3.0-fast", // Hardcoded
  // ...
});

// embeddings.ts
const embedding = await openai.embeddings.create({
  model: "text-embedding-3-small", // Hardcoded
  // ...
});
```

**Problem**: Upgrading models requires finding and changing every occurrence across the codebase.

### ✅ Good Pattern

```typescript
// config/ai-models.ts
export const TRANSLATION_MODEL = "gpt-4o-mini" as const;
export const IMAGE_MODEL = "imagen-3.0-fast" as const;
export const EMBEDDING_MODEL = "text-embedding-3-small" as const;

// translation.ts
import { TRANSLATION_MODEL } from "../config/ai-models";

const result = await openai.chat.completions.create({
  model: TRANSLATION_MODEL,
  // ...
});
```

**Benefits**: Single source of truth, easy upgrades, consistent configuration.

## 2. No Cost Tracking

### ❌ Anti-Pattern

```typescript
const result = await openai.chat.completions.create({...});

// No tracking of token usage or costs
return result.choices[0].message.content;
```

**Problem**: No visibility into spending, can't optimize costs, no budget alerts.

### ✅ Good Pattern

```typescript
const result = await openai.chat.completions.create({...});

const costCents = calculateCost(
  result.usage.prompt_tokens,
  result.usage.completion_tokens
);

// Store for analytics
await supabase.from("ai_costs").insert({
  model: TRANSLATION_MODEL,
  tokens: result.usage.total_tokens,
  cost_cents: costCents,
  user_id: userId,
  timestamp: new Date().toISOString(),
});

return {
  content: result.choices[0].message.content,
  metadata: {
    tokens_used: result.usage.total_tokens,
    cost_cents: costCents,
  },
};
```

## 3. No Max Token Limits

### ❌ Anti-Pattern

```typescript
const result = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [...],
  // No max_tokens = unbounded cost
});
```

**Problem**: Single request could consume thousands of tokens unexpectedly, causing cost spikes.

### ✅ Good Pattern

```typescript
const result = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [...],
  max_tokens: 1000, // Explicit limit
});
```

## 4. Ignoring Rate Limits

### ❌ Anti-Pattern

```typescript
for (const item of items) {
  const result = await openai.chat.completions.create({...});
  // No delay, no retry logic
}
```

**Problem**: Hits rate limits immediately, fails without recovery.

### ✅ Good Pattern

```typescript
import pLimit from "p-limit";

const limit = pLimit(5); // Max 5 concurrent requests

const results = await Promise.all(
  items.map(item =>
    limit(async () => {
      try {
        return await callWithRetry(() =>
          openai.chat.completions.create({...})
        );
      } catch (error) {
        console.error("Failed after retries:", error);
        return null;
      }
    })
  )
);
```

## 5. Not Using Structured Outputs

### ❌ Anti-Pattern

```typescript
const result = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    {
      role: "user",
      content: "Extract name, email, phone from: John Doe, john@example.com, 555-1234",
    },
  ],
});

// Parse unstructured response
const text = result.choices[0].message.content;
const parsed = JSON.parse(text); // May fail, inconsistent format
```

**Problem**: Unreliable parsing, format inconsistencies, parsing errors.

### ✅ Good Pattern

```typescript
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const ContactSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
});

const result = await openai.beta.chat.completions.parse({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Extract..." }],
  response_format: zodResponseFormat(ContactSchema, "contact"),
});

const contact = result.choices[0].message.parsed; // Guaranteed structure
```

## 6. Exposing Secret Keys to Frontend

### ❌ Anti-Pattern

```typescript
// Frontend code
const openai = new OpenAI({
  apiKey: "sk-..." // NEVER DO THIS
});
```

**Problem**: API keys exposed in browser, anyone can use your quota.

### ✅ Good Pattern

```typescript
// Frontend
const response = await fetch("/api/translate", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${userToken}`, // User's auth token
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ text, sourceLang, targetLang }),
});

// Backend API route
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Server-side only
});
```

## 7. No Error Handling

### ❌ Anti-Pattern

```typescript
const result = await openai.chat.completions.create({...});
return result.choices[0].message.content;
```

**Problem**: Crashes on API errors, no retry logic, poor user experience.

### ✅ Good Pattern

```typescript
try {
  const result = await callWithRetry(() =>
    openai.chat.completions.create({...})
  );
  return {
    success: true,
    content: result.choices[0].message.content,
  };
} catch (error) {
  console.error("Translation failed:", error);

  return {
    success: false,
    error: error instanceof Error ? error.message : "Unknown error",
    fallback: originalText, // Return original as fallback
  };
}
```

## 8. Inefficient Database Queries

### ❌ Anti-Pattern

```typescript
// Query all entries, filter in application
const { data } = await supabase.from("users").select("*");

const activeUsers = data.filter(u => u.status === "active");
```

**Problem**: Transfers all data, wastes bandwidth, slow performance.

### ✅ Good Pattern

```typescript
// Filter in database
const { data } = await supabase
  .from("users")
  .select("id, email, name")
  .eq("status", "active")
  .limit(100);
```

## 9. Not Validating AI Outputs

### ❌ Anti-Pattern

```typescript
const result = await openai.chat.completions.create({...});

// Blindly trust the output
await supabase.from("translations").insert({
  translated_text: result.choices[0].message.content,
});
```

**Problem**: AI can hallucinate, produce invalid data, or fail to follow schema.

### ✅ Good Pattern

```typescript
const result = await openai.beta.chat.completions.parse({
  response_format: zodResponseFormat(TranslationSchema, "translation"),
  // ...
});

const parsed = result.choices[0].message.parsed;

// Validate term spans
const validation = validateTranslationResponse(sourceText, parsed);

if (!validation.valid) {
  console.error("Validation errors:", validation.errors);
  // Log error, retry, or return fallback
}

// Only store if valid
await supabase.from("translations").insert({
  translated_text: parsed.translated_text,
  validation_passed: validation.valid,
});
```

## 10. Synchronous Processing of Large Batches

### ❌ Anti-Pattern

```typescript
const results = [];

for (const item of largeArray) {
  const result = await processWithAI(item);
  results.push(result);
}
// Takes forever, blocks other operations
```

**Problem**: Slow, blocks other operations, no parallelization, no progress tracking.

### ✅ Good Pattern

```typescript
// Use batch API (Anthropic, Google)
const batch = await anthropic.batches.create({
  requests: largeArray.map((item, i) => ({
    custom_id: `item-${i}`,
    params: { model: "claude-sonnet-4-5", messages: [...] },
  })),
});

// Or parallel processing with concurrency limit
import pLimit from "p-limit";

const limit = pLimit(10);

const results = await Promise.all(
  largeArray.map(item =>
    limit(() => processWithAI(item))
  )
);
```

## 11. Storing Sensitive Data in Metadata

### ❌ Anti-Pattern

```typescript
// Clerk public metadata (visible to frontend)
await clerk.users.updateUser(userId, {
  publicMetadata: {
    ssn: "123-45-6789", // NEVER
    creditCard: "4111...", // NEVER
  },
});
```

**Problem**: Sensitive data exposed to frontend, compliance violations.

### ✅ Good Pattern

```typescript
// Use private metadata for sensitive data
await clerk.users.updateUser(userId, {
  privateMetadata: {
    stripeCustomerId: "cus_123", // Backend only
    internalNotes: "VIP customer",
  },
  publicMetadata: {
    displayName: "John D.", // Safe for frontend
    role: "member",
  },
});
```

## 12. No Caching for Repeated Queries

### ❌ Anti-Pattern

```typescript
// User refreshes page
const embedding = await openai.embeddings.create({
  input: "same text as 5 seconds ago",
});

const results = await searchDatabase(embedding);
// Re-generates embedding every time
```

**Problem**: Wastes tokens and money on repeated identical requests.

### ✅ Good Pattern

```typescript
// Cache embeddings
const cacheKey = `embedding:${hashText(text)}`;

let embedding = await redis.get(cacheKey);

if (!embedding) {
  const response = await openai.embeddings.create({ input: text });
  embedding = response.data[0].embedding;

  await redis.set(cacheKey, JSON.stringify(embedding), {
    ex: 3600, // 1 hour TTL
  });
}

const results = await searchDatabase(JSON.parse(embedding));
```

## 13. Missing Input Validation

### ❌ Anti-Pattern

```typescript
export async function POST(req: Request) {
  const { text } = await req.json();

  // No validation
  const result = await translateText(text);
  return Response.json(result);
}
```

**Problem**: Accepts malicious input, wastes tokens on garbage, potential injection attacks.

### ✅ Good Pattern

```typescript
import { z } from "zod";

const RequestSchema = z.object({
  text: z.string().min(1).max(5000),
  sourceLang: z.enum(["en", "es", "fr", "pt"]),
  targetLang: z.enum(["en", "es", "fr", "pt"]),
});

export async function POST(req: Request) {
  const body = await req.json();

  // Validate input
  const validation = RequestSchema.safeParse(body);

  if (!validation.success) {
    return Response.json(
      { error: "Invalid input", details: validation.error },
      { status: 400 }
    );
  }

  const { text, sourceLang, targetLang } = validation.data;

  const result = await translateText(text, sourceLang, targetLang);
  return Response.json(result);
}
```

## 14. No Monitoring or Alerting

### ❌ Anti-Pattern

```typescript
// Code runs, no idea how it's performing
const result = await openai.chat.completions.create({...});
```

**Problem**: No visibility into errors, costs, performance degradation, or quota issues.

### ✅ Good Pattern

```typescript
// Structured logging
console.log(JSON.stringify({
  level: "info",
  service: "translation",
  model: TRANSLATION_MODEL,
  tokens: result.usage.total_tokens,
  latency_ms: Date.now() - startTime,
  cost_cents: calculateCost(result.usage),
  user_id: userId,
}));

// Alert on cost thresholds
if (dailyCost > DAILY_BUDGET_CENTS) {
  await sendAlert({
    type: "budget_exceeded",
    message: `Daily AI budget exceeded: $${dailyCost / 100}`,
  });
}
```

## 15. Cross-Language Embedding Mismatch

### ❌ Anti-Pattern

```typescript
// Dictionary is in English
const dictionaryEmbeddings = await generateEmbeddings(englishTerms);

// User query is in Spanish
const queryEmbedding = await openai.embeddings.create({
  input: "¿Dónde está el disyuntor?", // Spanish query
});

// Poor matches because embedding spaces don't align well
const results = await searchVectorDB(queryEmbedding);
```

**Problem**: Cross-language semantic search has poor accuracy.

### ✅ Good Pattern

```typescript
// Translate query to dictionary language first
const translatedQuery = await translateToEnglish(userQuery);

// Now embed in same language as dictionary
const queryEmbedding = await openai.embeddings.create({
  input: translatedQuery, // "circuit breaker"
});

// Much better matches
const results = await searchVectorDB(queryEmbedding);
```
