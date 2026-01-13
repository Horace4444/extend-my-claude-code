# Google AI (Gemini & Vertex AI) API Reference

> **Last Updated**: January 2026
> **Official Pricing**: [ai.google.dev/gemini-api/docs/pricing](https://ai.google.dev/gemini-api/docs/pricing)

## Current Models (January 2026)

### Gemini 3 Series (Latest)

#### Gemini 3 Pro (Flagship)
- **Model ID**: `gemini-3-pro-preview` or `gemini-3-pro`
- **Context Window**: 2M tokens
- **Pricing (≤200K)**: $2.00/1M input, $12.00/1M output
- **Pricing (>200K)**: $4.00/1M input, $18.00/1M output
- **Best For**: State-of-the-art reasoning, vibe coding, complex multimodal tasks
- **Note**: Select "Thinking" mode in model dropdown

#### Gemini 3 Flash (Fast & Affordable)
- **Model ID**: `gemini-3-flash` or `gemini-3-flash-preview`
- **Context Window**: 2M tokens
- **Pricing**: $0.50/1M input, $3.00/1M output
- **Audio Input**: $1.00/1M tokens
- **Best For**: Fast frontier-class performance, high-volume tasks
- **Note**: Default model in Gemini API, includes 90% context caching discount

#### Gemini 3 Deep Think (Advanced Reasoning)
- **Model ID**: Select "Deep Think" + "Thinking" mode
- **Best For**: Complex reasoning, research
- **Note**: Available for Google AI Ultra subscribers

### Gemini 2.5 Series

#### Gemini 2.5 Pro
- **Model ID**: `gemini-2.5-pro`
- **Context Window**: 2M tokens
- **Pricing (≤200K)**: $1.25/1M input, $10.00/1M output
- **Pricing (>200K)**: $2.50/1M input, $15.00/1M output
- **Best For**: Complex reasoning, high-quality outputs

#### Gemini 2.5 Flash (Balanced)
- **Model ID**: `gemini-2.5-flash`
- **Context Window**: 2M tokens
- **Pricing**: $0.30/1M input (text/image/video), $2.50/1M output
- **With Thinking**: $3.50/1M output tokens
- **Audio Input**: $1.00/1M tokens
- **Best For**: Balanced speed and capability

#### Gemini 2.5 Flash-Lite (Budget)
- **Model ID**: `gemini-2.5-flash-lite`
- **Context Window**: 2M tokens
- **Pricing**: $0.10/1M input, $0.40/1M output
- **Best For**: Ultra-low-cost, high-volume tasks

### Gemini 2.0 Series

#### Gemini 2.0 Flash
- **Model ID**: `gemini-2.0-flash`
- **Pricing**: $0.10/1M input, $0.40/1M output
- **Audio Input**: $0.70/1M tokens
- **Best For**: Cost-effective general tasks

#### Gemini 2.0 Flash-Lite
- **Model ID**: `gemini-2.0-flash-lite`
- **Pricing**: $0.075/1M input, $0.30/1M output
- **Best For**: Lowest cost option

### Imagen 3 (Image Generation)
- **Imagen 3 Fast**: `imagen-3.0-fast-generate-001` - $0.02/image
- **Imagen 3 Standard**: `imagen-3.0-generate-002` - $0.04/image
- **Resolutions**: 1024x1024, 896x1280, 1280x896, 768x1408, 1408x768

### Embeddings
- **text-embedding-004**: $0.025/1M tokens (≤128), $0.13/1M tokens (>128)
- **Dimensions**: 768

## Pricing Summary Table

| Model | Input | Output | Notes |
|-------|-------|--------|-------|
| Gemini 3 Pro (≤200K) | $2.00 | $12.00 | Flagship |
| Gemini 3 Pro (>200K) | $4.00 | $18.00 | Long context |
| Gemini 3 Flash | $0.50 | $3.00 | Fast frontier |
| Gemini 2.5 Pro (≤200K) | $1.25 | $10.00 | High quality |
| Gemini 2.5 Flash | $0.30 | $2.50 | Balanced |
| Gemini 2.5 Flash-Lite | $0.10 | $0.40 | Budget |
| Gemini 2.0 Flash | $0.10 | $0.40 | Economy |
| Gemini 2.0 Flash-Lite | $0.075 | $0.30 | Lowest cost |

*All prices per million tokens*

### Free Tier (Generous!)
- Gemini 3 Flash: Free tier available
- Gemini 2.5 Flash: Free tier available
- Gemini 2.5 Flash-Lite: Free tier available
- Gemini 2.0 Flash: Free tier available
- Up to 1,000 requests/day, 15 requests/minute

## Client Initialization

### Vertex AI (Recommended for Production)

```typescript
import { VertexAI } from "@google-cloud/vertexai";

const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: "us-central1",
});

const model = vertexAI.getGenerativeModel({
  model: "gemini-3-flash",
});
```

### Google AI SDK (Simpler, for Development)

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash" });
```

## Common Patterns

### 1. Text Generation

```typescript
const result = await model.generateContent(
  "What bathroom modifications help seniors age in place safely?"
);
console.log(result.response.text());
```

### 2. System Instructions

```typescript
const model = genAI.getGenerativeModel({
  model: "gemini-3-flash",
  systemInstruction: "You are an aging-in-place design consultant specializing in ADA-compliant modifications.",
});

const result = await model.generateContent("Recommend grab bar placement for a bathroom.");
```

### 3. Multimodal (Images)

```typescript
import { readFileSync } from "fs";

const imagePart = {
  inlineData: {
    data: readFileSync("bathroom.jpg").toString("base64"),
    mimeType: "image/jpeg",
  },
};

const result = await model.generateContent([
  "Analyze this bathroom for accessibility issues and suggest modifications.",
  imagePart,
]);

console.log(result.response.text());
```

### 4. Streaming Responses

```typescript
const result = await model.generateContentStream(
  "Write a detailed aging-in-place design proposal for a kitchen renovation."
);

for await (const chunk of result.stream) {
  process.stdout.write(chunk.text());
}
```

### 5. Function Calling (Tools)

```typescript
const tools = [{
  functionDeclarations: [{
    name: "calculate_modification_cost",
    description: "Calculate estimated cost for a home modification",
    parameters: {
      type: "OBJECT",
      properties: {
        modification_type: {
          type: "STRING",
          enum: ["grab_bars", "ramp", "walk_in_tub", "stair_lift", "widened_doorway"]
        },
        quantity: { type: "NUMBER" },
        quality: { type: "STRING", enum: ["standard", "premium"] },
      },
      required: ["modification_type", "quantity"],
    },
  }],
}];

const result = await model.generateContent({
  contents: [{ role: "user", parts: [{ text: "How much would 4 grab bars cost?" }] }],
  tools,
});

const functionCall = result.response.functionCalls()[0];
if (functionCall) {
  console.log("Function:", functionCall.name);
  console.log("Args:", functionCall.args);

  // Execute function and continue
  const functionResponse = await executeFunction(functionCall.name, functionCall.args);

  const followUp = await model.generateContent({
    contents: [
      { role: "user", parts: [{ text: "How much would 4 grab bars cost?" }] },
      { role: "model", parts: [{ functionCall }] },
      { role: "function", parts: [{ functionResponse: { name: functionCall.name, response: functionResponse } }] },
    ],
    tools,
  });
}
```

### 6. Structured Output (JSON)

```typescript
const schema = {
  type: "OBJECT",
  properties: {
    room: { type: "STRING" },
    modifications: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          estimated_cost: { type: "NUMBER" },
          priority: { type: "STRING", enum: ["high", "medium", "low"] },
        },
        required: ["name", "estimated_cost", "priority"],
      },
    },
    total_cost: { type: "NUMBER" },
  },
  required: ["room", "modifications", "total_cost"],
};

const result = await model.generateContent({
  contents: [{ role: "user", parts: [{ text: "Analyze bathroom modifications for accessibility" }] }],
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: schema,
  },
});

const data = JSON.parse(result.response.text());
```

### 7. Image Generation (Imagen)

```typescript
const imageModel = vertexAI.preview.getGenerativeModel({
  model: "imagen-3.0-fast-generate-001",
});

const result = await imageModel.generateImages({
  prompt: "Modern accessible bathroom with grab bars, walk-in shower, and safety features, professional interior design photo",
  numberOfImages: 1,
  aspectRatio: "16:9",
  negativePrompt: "blurry, low quality, distorted, unrealistic",
  safetyFilterLevel: "block_some",
  personGeneration: "dont_allow",
});

const image = result.images[0];
// Save or display image.imageUrl or image.bytesBase64Encoded
```

### 8. Context Caching (90% Savings)

```typescript
// Create cached content (great for large documents, design guidelines)
const cacheResult = await vertexAI.preview.cachedContents.create({
  model: "gemini-3-flash",
  contents: [
    {
      role: "user",
      parts: [{ text: "Here is the complete ADA guidelines document...(large text)" }],
    },
  ],
  ttl: "3600s", // 1 hour
  displayName: "ADA Guidelines Cache",
});

// Use cached content for multiple queries
const modelWithCache = vertexAI.getGenerativeModel({
  model: "gemini-3-flash",
  cachedContent: cacheResult.name,
});

const result1 = await modelWithCache.generateContent("What are grab bar height requirements?");
const result2 = await modelWithCache.generateContent("What are doorway width requirements?");
// Both queries use cached context - 90% cost savings!

// Cache pricing:
// - Storage: $1.00 per hour per 1M tokens
// - Cache reads: $0.01-$0.40 per 1M tokens (varies by model)
```

### 9. Grounding with Google Search

```typescript
// Available in Gemini API - first 1,500 queries/day free
const result = await model.generateContent({
  contents: [{ role: "user", parts: [{ text: "What are the latest ADA bathroom requirements for 2026?" }] }],
  tools: [{ googleSearchRetrieval: {} }],
});

// Grounding pricing (after free tier):
// $35 per 1,000 grounding queries
```

### 10. Video Understanding

```typescript
// Gemini 3 supports native video understanding
const videoFile = await genAI.uploadFile("home_tour.mp4", {
  mimeType: "video/mp4",
});

const result = await model.generateContent([
  "Analyze this home tour video and identify all accessibility issues and potential modifications for aging in place.",
  { fileData: { fileUri: videoFile.uri, mimeType: "video/mp4" } },
]);
```

## Error Handling

```typescript
try {
  const result = await model.generateContent(prompt);
  console.log(result.response.text());
} catch (error) {
  if (error.status === 429) {
    console.error("Rate limit exceeded, implement backoff");
  } else if (error.status === 400) {
    console.error("Invalid request:", error.message);
  } else if (error.message?.includes("SAFETY")) {
    console.error("Content blocked by safety filters");
    // Adjust safety settings or rephrase prompt
  } else if (error.message?.includes("RECITATION")) {
    console.error("Response blocked due to recitation concerns");
  } else {
    console.error("Generation error:", error);
  }
}
```

## Cost Calculation

```typescript
interface GeminiPricing {
  input: number;
  output: number;
  inputLongContext?: number;
  outputLongContext?: number;
}

const GEMINI_PRICING: Record<string, GeminiPricing> = {
  "gemini-3-pro": { input: 2.00, output: 12.00, inputLongContext: 4.00, outputLongContext: 18.00 },
  "gemini-3-flash": { input: 0.50, output: 3.00 },
  "gemini-2.5-pro": { input: 1.25, output: 10.00, inputLongContext: 2.50, outputLongContext: 15.00 },
  "gemini-2.5-flash": { input: 0.30, output: 2.50 },
  "gemini-2.5-flash-lite": { input: 0.10, output: 0.40 },
  "gemini-2.0-flash": { input: 0.10, output: 0.40 },
  "gemini-2.0-flash-lite": { input: 0.075, output: 0.30 },
};

function calculateGeminiCost(
  inputTokens: number,
  outputTokens: number,
  model: string,
  isLongContext: boolean = false,
  cachedTokens: number = 0
): number {
  const prices = GEMINI_PRICING[model] || GEMINI_PRICING["gemini-3-flash"];

  const inputPrice = isLongContext && prices.inputLongContext
    ? prices.inputLongContext
    : prices.input;
  const outputPrice = isLongContext && prices.outputLongContext
    ? prices.outputLongContext
    : prices.output;

  // Cache read is ~90% discount
  const cacheReadPrice = inputPrice * 0.1;

  const regularInputTokens = inputTokens - cachedTokens;
  const inputCost = (regularInputTokens / 1_000_000) * inputPrice;
  const cacheCost = (cachedTokens / 1_000_000) * cacheReadPrice;
  const outputCost = (outputTokens / 1_000_000) * outputPrice;

  return inputCost + cacheCost + outputCost;
}

function calculateImageCost(imageCount: number, model: string = "imagen-3.0-fast"): number {
  const pricing = {
    "imagen-3.0-fast": 0.02,
    "imagen-3.0-standard": 0.04,
  };
  return imageCount * (pricing[model] || 0.02);
}
```

## Best Practices

### Model Selection Guide
| Use Case | Recommended Model | Why |
|----------|------------------|-----|
| Complex design proposals | Gemini 3 Pro | State-of-the-art reasoning |
| Daily operations | Gemini 3 Flash | Fast, affordable, frontier-class |
| High-volume tasks | Gemini 2.5 Flash-Lite | Lowest cost |
| Image generation | Imagen 3 Fast | Quick renders |
| Video analysis | Gemini 3 Flash/Pro | Native video understanding |
| Large documents | Any + Context Caching | 90% savings |

### Temperature Settings
- **0.0-0.3**: Deterministic (cost estimates, structured data)
- **0.5-0.9**: Balanced creativity
- **0.9-2.0**: Maximum creativity (design ideation)

### Safety Settings
```typescript
const safetySettings = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
];

const result = await model.generateContent({
  contents: [...],
  safetySettings,
});
```

### Rate Limits
- Free tier: 15 requests/minute, 1,000 requests/day
- Paid tier: 200+ requests/minute (varies by model)
- Gemini 3 Flash: 200 requests/minute

### Cost Optimization
1. Use free tier for development (1,000 requests/day)
2. Use context caching for repeated large contexts (90% savings)
3. Use Batch API for non-urgent tasks (50% savings)
4. Start with Flash models, upgrade to Pro only when needed
5. Use structured outputs to reduce token waste

## Environment Variables

```bash
# For Google AI SDK (development)
GOOGLE_AI_API_KEY=...

# For Vertex AI (production)
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Or use Application Default Credentials
# gcloud auth application-default login
```

## Region Selection

Best regions for low latency:
- **us-central1**: US East Coast
- **us-west1**: US West Coast
- **europe-west1**: Europe
- **asia-southeast1**: Asia Pacific

## Resources

- **Pricing Page**: [ai.google.dev/gemini-api/docs/pricing](https://ai.google.dev/gemini-api/docs/pricing)
- **Models Overview**: [ai.google.dev/gemini-api/docs/models](https://ai.google.dev/gemini-api/docs/models)
- **Vertex AI Pricing**: [cloud.google.com/vertex-ai/generative-ai/pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing)
- **AI Studio**: [aistudio.google.com](https://aistudio.google.com)
- **Changelog**: [ai.google.dev/gemini-api/docs/changelog](https://ai.google.dev/gemini-api/docs/changelog)
