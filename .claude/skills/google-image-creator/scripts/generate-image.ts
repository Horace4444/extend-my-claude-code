#!/usr/bin/env npx tsx
/**
 * Google AI Image Generation Script
 *
 * Generates images using Google's AI models (Imagen and Gemini)
 * Tracks usage and calculates costs
 *
 * Usage:
 *   npx tsx generate-image.ts "prompt" [model] [output-path]
 *
 * Examples:
 *   npx tsx generate-image.ts "sunset over mountains"
 *   npx tsx generate-image.ts "product photo" "imagen-4.0-fast-generate-001" "./output.png"
 */

interface ImageGenerationResult {
  success: boolean;
  imagePath?: string;
  imageData?: string; // base64
  model: string;
  prompt: string;
  imagesGenerated: number;
  estimatedCost: number;
  error?: string;
}

interface ModelPricing {
  [key: string]: {
    name: string;
    pricePerImage: number;
    priceBatch?: number;
    endpoint: 'imagen' | 'gemini';
    description: string;
  };
}

// Top 3 + Additional Models (January 2026 pricing)
const MODEL_PRICING: ModelPricing = {
  // Top 3
  'gemini-2.5-flash-image': {
    name: 'Gemini 2.5 Flash Image',
    pricePerImage: 0.039,
    priceBatch: 0.0195,
    endpoint: 'gemini',
    description: 'Best value - Fast and cheap'
  },
  'imagen-4.0-fast-generate-001': {
    name: 'Imagen 4 Fast',
    pricePerImage: 0.020,
    endpoint: 'imagen',
    description: 'Photorealistic at good price'
  },
  'imagen-4.0-ultra-generate-001': {
    name: 'Imagen 4 Ultra',
    pricePerImage: 0.060,
    endpoint: 'imagen',
    description: 'Highest quality photorealism'
  },
  // Additional Imagen models
  'imagen-4.0-generate-001': {
    name: 'Imagen 4 Standard',
    pricePerImage: 0.040,
    endpoint: 'imagen',
    description: 'Balanced quality and speed'
  },
  'imagen-3.0-generate-002': {
    name: 'Imagen 3',
    pricePerImage: 0.030,
    endpoint: 'imagen',
    description: 'Previous generation'
  },
  // Additional Gemini models
  'gemini-3-pro-image-preview': {
    name: 'Gemini 3 Pro Image',
    pricePerImage: 0.134,
    priceBatch: 0.067,
    endpoint: 'gemini',
    description: 'Professional quality with 4K support'
  },
  'gemini-2.0-flash-exp-image-generation': {
    name: 'Gemini 2.0 Flash Experimental',
    pricePerImage: 0.039,
    endpoint: 'gemini',
    description: 'Experimental image generation'
  },
  'gemini-2.0-flash-preview-image-generation': {
    name: 'Gemini 2.0 Flash Preview',
    pricePerImage: 0.039,
    endpoint: 'gemini',
    description: 'Preview image generation'
  }
};

async function generateImageWithImagen(
  prompt: string,
  model: string,
  apiKey: string
): Promise<{ success: boolean; imageData?: string; error?: string }> {
  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: `API Error ${response.status}: ${errorData.error?.message || response.statusText}`
      };
    }

    const data = await response.json();

    if (!data.predictions || data.predictions.length === 0) {
      return { success: false, error: 'No images generated' };
    }

    const imageData = data.predictions[0].bytesBase64Encoded;
    return { success: true, imageData };

  } catch (error: any) {
    return { success: false, error: `Request failed: ${error.message}` };
  }
}

async function generateImageWithGemini(
  prompt: string,
  model: string,
  apiKey: string
): Promise<{ success: boolean; imageData?: string; error?: string }> {
  try {
    // Use the generateContent endpoint with responseModalities set to include image
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseModalities: ['IMAGE', 'TEXT'],
          responseMimeType: 'text/plain'
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || response.statusText;

      // Check for quota/billing errors
      if (response.status === 429 || errorMessage.includes('quota') || errorMessage.includes('limit')) {
        return {
          success: false,
          error: `Quota exceeded: ${errorMessage}. Gemini image generation requires a billing-enabled API key.`
        };
      }

      return {
        success: false,
        error: `API Error ${response.status}: ${errorMessage}`
      };
    }

    const data = await response.json();

    // Extract image from response
    if (!data.candidates || data.candidates.length === 0) {
      return { success: false, error: 'No response candidates' };
    }

    const parts = data.candidates[0].content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        return { success: true, imageData: part.inlineData.data };
      }
    }

    return { success: false, error: 'No image found in response. Model may not support image generation.' };

  } catch (error: any) {
    return { success: false, error: `Request failed: ${error.message}` };
  }
}

async function generateImage(
  prompt: string,
  model: string = 'gemini-2.5-flash-image',
  outputPath?: string
): Promise<ImageGenerationResult> {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      model,
      prompt,
      imagesGenerated: 0,
      estimatedCost: 0,
      error: 'GOOGLE_API_KEY or GEMINI_API_KEY environment variable not set. Get one at: https://aistudio.google.com/app/apikey'
    };
  }

  // Validate model
  if (!MODEL_PRICING[model]) {
    return {
      success: false,
      model,
      prompt,
      imagesGenerated: 0,
      estimatedCost: 0,
      error: `Unknown model: ${model}. Run "npx tsx list-models.ts" to see available models.`
    };
  }

  const pricing = MODEL_PRICING[model];

  // Generate image using appropriate endpoint
  let result: { success: boolean; imageData?: string; error?: string };

  if (pricing.endpoint === 'imagen') {
    result = await generateImageWithImagen(prompt, model, apiKey);
  } else {
    // Use Gemini generateContent API for Gemini image models
    result = await generateImageWithGemini(prompt, model, apiKey);
  }

  if (!result.success) {
    return {
      success: false,
      model,
      prompt,
      imagesGenerated: 0,
      estimatedCost: 0,
      error: result.error
    };
  }

  // Save image if output path provided
  let savedPath: string | undefined;
  if (outputPath && result.imageData) {
    const fs = await import('fs/promises');
    const buffer = Buffer.from(result.imageData, 'base64');
    await fs.writeFile(outputPath, buffer);
    savedPath = outputPath;
  }

  // Calculate cost
  const finalResult: ImageGenerationResult = {
    success: true,
    imagePath: savedPath,
    imageData: savedPath ? undefined : result.imageData,
    model,
    prompt,
    imagesGenerated: 1,
    estimatedCost: pricing.pricePerImage
  };

  return finalResult;
}

// CLI Execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
Google AI Image Generation

Usage:
  npx tsx generate-image.ts "prompt" [model] [output-path]

Arguments:
  prompt       Image description (required)
  model        Model ID (optional, default: gemini-2.5-flash-image)
  output-path  Where to save image (optional, prints base64 if not provided)

Top 3 Models:
  gemini-2.5-flash-image          $0.039/image (⭐ RECOMMENDED)
  imagen-4.0-fast-generate-001    $0.020/image
  imagen-4.0-ultra-generate-001   $0.060/image

Examples:
  npx tsx generate-image.ts "sunset over mountains"
  npx tsx generate-image.ts "product photo" "imagen-4.0-fast-generate-001"
  npx tsx generate-image.ts "cat in space" "imagen-4.0-ultra-generate-001" "./cat.png"

Environment:
  GOOGLE_API_KEY must be set (get at: https://aistudio.google.com/app/apikey)

More Info:
  npx tsx list-models.ts          # See all available models
  cat references/models.md        # Full model documentation
`);
    process.exit(0);
  }

  const prompt = args[0];
  const model = args[1] || 'gemini-2.5-flash-image';
  const outputPath = args[2];

  generateImage(prompt, model, outputPath).then(result => {
    if (result.success) {
      console.log('✅ Image generated successfully!');
      console.log(`   Model: ${MODEL_PRICING[result.model].name} (${result.model})`);
      console.log(`   Prompt: "${result.prompt}"`);
      if (result.imagePath) {
        console.log(`   Saved to: ${result.imagePath}`);
      } else {
        console.log(`   Base64 length: ${result.imageData?.length} characters`);
      }
      console.log(`   Images: ${result.imagesGenerated}`);
      console.log(`   Cost: $${result.estimatedCost.toFixed(4)}`);
    } else {
      console.error('❌ Image generation failed');
      console.error(`   Error: ${result.error}`);
      process.exit(1);
    }
  });
}

export { generateImage, MODEL_PRICING, ImageGenerationResult };
