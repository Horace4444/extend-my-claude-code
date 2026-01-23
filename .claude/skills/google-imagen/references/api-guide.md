# Google AI API Integration Guide

Quick reference for using Google's Gemini/Imagen API for image generation.

## Authentication Setup

### Get API Key

1. Visit: https://aistudio.google.com/app/apikey
2. Create new project or select existing
3. Generate API key
4. Copy key to environment

### Environment Configuration

```bash
# Option 1: GOOGLE_API_KEY (recommended)
export GOOGLE_API_KEY="your-api-key-here"

# Option 2: GEMINI_API_KEY (also supported)
export GEMINI_API_KEY="your-api-key-here"
```

**Persistent Setup (.bashrc / .zshrc):**

```bash
echo 'export GOOGLE_API_KEY="your-api-key"' >> ~/.zshrc
source ~/.zshrc
```

**Project-specific (.env):**

```
GOOGLE_API_KEY=your-api-key-here
```

---

## API Endpoints

### Image Generation

```
POST https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateImages
```

**Headers:**
```
Content-Type: application/json
x-goog-api-key: YOUR_API_KEY
```

**Body:**
```json
{
  "prompt": {
    "text": "image description"
  },
  "config": {
    "numberOfImages": 1
  }
}
```

**Response:**
```json
{
  "generatedImages": [
    {
      "bytesBase64Encoded": "base64...",
      "mimeType": "image/png"
    }
  ]
}
```

---

## Usage Patterns

### Basic Generation (TypeScript)

```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-fast-generate-001:generateImages`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GOOGLE_API_KEY
    },
    body: JSON.stringify({
      prompt: { text: "sunset over mountains" },
      config: { numberOfImages: 1 }
    })
  }
);

const data = await response.json();
const imageBase64 = data.generatedImages[0].bytesBase64Encoded;
```

### Save Image to File

```typescript
import fs from 'fs/promises';

const buffer = Buffer.from(imageBase64, 'base64');
await fs.writeFile('output.png', buffer);
```

### Error Handling

```typescript
if (!response.ok) {
  const error = await response.json();
  throw new Error(`API Error: ${error.error?.message}`);
}
```

---

## Rate Limits

**Free Tier:**
- 60 requests per minute
- 1,500 requests per day

**Paid Tier:**
- Higher limits based on plan
- Contact Google for enterprise quotas

**Best Practices:**
- Implement exponential backoff
- Cache results when possible
- Batch requests appropriately

---

## Security

### API Key Protection

**DO:**
- ✅ Use environment variables
- ✅ Add `.env` to `.gitignore`
- ✅ Rotate keys regularly
- ✅ Use separate keys for dev/prod

**DON'T:**
- ❌ Commit keys to version control
- ❌ Share keys in chat/email
- ❌ Use production keys in development
- ❌ Embed keys in client-side code

### Key Rotation

```bash
# Generate new key in Google AI Studio
# Update environment
export GOOGLE_API_KEY="new-key"

# Test new key
npx tsx scripts/list-models.ts

# Revoke old key in Google AI Studio
```

---

## Troubleshooting

### Common Issues

**"API key not valid"**
- Check environment variable is set: `echo $GOOGLE_API_KEY`
- Verify key in Google AI Studio
- Ensure no extra spaces/newlines

**"Quota exceeded"**
- Check usage in Google Cloud Console
- Wait for quota reset (daily/monthly)
- Upgrade to paid tier if needed

**"Model not found"**
- Verify model ID spelling
- Check model availability in your region
- Ensure API version (v1beta) is correct

**"Content filtered"**
- Prompt may contain policy violations
- Revise prompt to be more appropriate
- Check Google's content policy

---

## Testing

### Verify Setup

```bash
# Test API key
curl -H "x-goog-api-key: $GOOGLE_API_KEY" \
  "https://generativelanguage.googleapis.com/v1beta/models"

# Test image generation
npx tsx scripts/generate-image.ts "test image"
```

### Debug Mode

Add detailed logging:

```typescript
console.log('Request:', {
  model,
  prompt,
  endpoint
});

console.log('Response Status:', response.status);
console.log('Response Headers:', response.headers);
```

---

## Cost Management

### Track Usage

```typescript
let totalCost = 0;

function trackCost(model: string, images: number) {
  const cost = MODEL_PRICING[model].pricePerImage * images;
  totalCost += cost;
  console.log(`Session cost: $${cost.toFixed(4)}`);
  console.log(`Total cost: $${totalCost.toFixed(4)}`);
}
```

### Set Budget Alerts

1. Go to Google Cloud Console
2. Billing > Budgets & Alerts
3. Create budget for Gemini API
4. Set alert thresholds (e.g., 50%, 80%, 100%)
5. Configure email notifications

---

## References

- **Official Docs:** https://ai.google.dev/docs
- **Pricing:** https://ai.google.dev/pricing
- **API Reference:** https://ai.google.dev/api/generate-images
- **Support:** https://ai.google.dev/support
- **Status:** https://status.cloud.google.com/

---

## Updates

**Check for API changes:**
- Follow Google AI blog: https://blog.google/technology/ai/
- Subscribe to API changelog
- Test with new releases before production deployment

**Version this guide:**
- Current API version: v1beta
- Last verified: January 2026
- Next review: March 2026
