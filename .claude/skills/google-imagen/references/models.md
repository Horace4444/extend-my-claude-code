# Google AI Image Generation Models

**Last Updated:** January 2026
**Source:** https://ai.google.dev/pricing

## Current Models (Top 6 Options)

### 🚀 Nano Banana Models (Gemini with Image Generation)

#### 1. Gemini 2.5 Flash Image (`gemini-2.5-flash-image`) ⭐ RECOMMENDED - Best Value

**Pricing:**
- Standard: $0.039 per image
- Batch: $0.0195 per image (50% discount)

**Best For:**
- High-volume generation
- Low-latency tasks
- Content pipelines
- Cost-sensitive projects

**Capabilities:**
- Fastest generation speed
- Text-to-image
- Image editing (text + image → image)
- Multi-turn conversational iteration
- Multiple aspect ratios
- Efficient for batch processing

**Limitations:**
- Lower quality than Pro or Imagen 4
- Best for speed over perfection

---

#### 2. Gemini 3 Pro Image Preview (`gemini-3-pro-image-preview`) ⭐ Professional Quality

**Pricing:**
- Standard: $0.134 per image (1K/2K), $0.24 per 4K
- Batch: $0.067 per image (1K/2K), $0.12 per 4K

**Best For:**
- Professional asset production
- Marketing materials
- Infographics and diagrams
- High-resolution needs (up to 4K)

**Capabilities:**
- Advanced reasoning
- High-resolution output (1K, 2K, 4K)
- Superior text rendering
- Google Search grounding (real-time data)
- Up to 14 reference images
- Thinking mode with composition refinement
- Consistent character/object generation

**Limitations:**
- Higher cost
- Slower than Flash variant

---

### 📷 Imagen Models

#### 3. Imagen 4 Fast (`imagen-4.0-fast-generate-001`)

**Pricing:** $0.02 per image

**Best For:**
- Quick iterations
- High-volume photorealistic generation
- Standard quality needs

**Capabilities:**
- Fastest Imagen variant
- Good photorealism
- SynthID watermark included
- 1-4 images per request
- Aspect ratios: 1:1, 3:4, 4:3, 9:16, 16:9

---

#### 4. Imagen 4 Standard (`imagen-4.0-generate-001`)

**Pricing:** $0.04 per image

**Best For:**
- Balanced quality and speed
- General-purpose photorealistic images
- Marketing content

**Capabilities:**
- High-quality photorealism
- Multiple output sizes (1K, 2K)
- SynthID watermark
- Person generation controls

---

#### 5. Imagen 4 Ultra (`imagen-4.0-ultra-generate-001`) ⭐ Highest Quality

**Pricing:** $0.06 per image

**Best For:**
- Premium deliverables
- Highest photorealism requirements
- Client-facing work

**Capabilities:**
- Maximum quality
- Best detail and realism
- 2K resolution support
- SynthID watermark

---

#### 6. Imagen 3 (`imagen-3.0-generate-002`)

**Pricing:** $0.03 per image

**Best For:**
- Legacy compatibility
- Mid-range quality/cost balance

**Capabilities:**
- Previous generation quality
- Reliable and proven
- SynthID watermark

---

## Cost Comparison (100 images)

| Model | Standard | Batch |
|-------|----------|-------|
| **Gemini 2.5 Flash** | $3.90 | $1.95 ⭐ Cheapest |
| **Gemini 3 Pro (1K/2K)** | $13.40 | $6.70 |
| **Gemini 3 Pro (4K)** | $24.00 | $12.00 |
| **Imagen 4 Fast** | $2.00 | N/A |
| **Imagen 4 Standard** | $4.00 | N/A |
| **Imagen 4 Ultra** | $6.00 ⭐ Highest Quality | N/A |
| **Imagen 3** | $3.00 | N/A |

---

## Model Selection Guide

### Choose **Gemini 2.5 Flash** if:
- ✅ Need lowest cost (especially batch mode)
- ✅ High-volume generation
- ✅ Speed is critical
- ✅ Quality is "good enough"
- ✅ Content pipeline/automation

### Choose **Gemini 3 Pro** if:
- ✅ Need professional quality
- ✅ Text rendering in images (infographics, menus)
- ✅ High-resolution output (4K)
- ✅ Google Search grounding needed
- ✅ Consistent characters/objects across images

### Choose **Imagen 4 Ultra** if:
- ✅ Maximum photorealism required
- ✅ Premium client deliverables
- ✅ Budget allows for highest quality
- ✅ Need SynthID watermarking

### Choose **Imagen 4 Fast** if:
- ✅ Photorealism at low cost
- ✅ Don't need Gemini's advanced features
- ✅ Simple text-to-image only

---

## Technical Specifications

### Imagen Models

**Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/{model}:predict`

**Request Format:**
```json
{
  "instances": [{
    "prompt": "your description"
  }],
  "parameters": {
    "sampleCount": 4,
    "imageSize": "2K",
    "aspectRatio": "16:9",
    "personGeneration": "allow_adult"
  }
}
```

**Constraints:**
- Max prompt length: 480 tokens
- Images per request: 1-4
- Text in images: ~25 characters optimal

---

### Gemini Image Models

**Endpoint:** Use Gemini API with image generation

**Features:**
- Multi-turn conversations
- Image editing (not just generation)
- Reference images (Gemini 3 Pro)
- Search grounding (Gemini 3 Pro)

---

## Updating This Reference

**Check for updates:**
1. https://ai.google.dev/pricing
2. https://ai.google.dev/gemini-api/docs/imagen
3. https://ai.google.dev/gemini-api/docs/image-generation

**Update locations:**
1. This file (`references/models.md`)
2. `scripts/generate-image.ts` MODEL_PRICING
3. `scripts/list-models.ts` MODELS array
4. Repackage skill

---

## API Keys

Get your key: https://aistudio.google.com/app/apikey

Set environment variable:
```bash
export GOOGLE_API_KEY="your-key"
```

All image generation is **paid tier only** (no free quota).
