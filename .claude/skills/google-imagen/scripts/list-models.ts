#!/usr/bin/env npx tsx
/**
 * List Top 3 Google AI Image Models
 *
 * Displays the current recommended image generation models with pricing
 * Helps users choose the right model for their needs
 *
 * Usage:
 *   npx tsx list-models.ts [--json]
 */

interface ModelInfo {
  id: string;
  name: string;
  pricePerImage: number;
  priceBatch?: number;
  description: string;
  capabilities: string[];
  recommended: boolean;
}

// Top 3 Google AI Image Models (January 2026)
const TOP_3_MODELS: ModelInfo[] = [
  {
    id: 'gemini-2.5-flash-image',
    name: 'Gemini 2.5 Flash Image',
    pricePerImage: 0.039,
    priceBatch: 0.0195,
    description: 'Best value - Fast generation at lowest cost',
    capabilities: [
      'Lowest cost ($0.039/image, $0.0195 batch)',
      'Fastest generation speed',
      'Text-to-image and image editing',
      'Multi-turn conversations',
      'Perfect for high-volume'
    ],
    recommended: true
  },
  {
    id: 'imagen-4.0-fast-generate-001',
    name: 'Imagen 4 Fast',
    pricePerImage: 0.020,
    description: 'Photorealistic quality at good price',
    capabilities: [
      'Fast photorealistic generation',
      'Good quality-to-cost ratio',
      'SynthID watermark included',
      'Multiple aspect ratios',
      'Simple and reliable'
    ],
    recommended: false
  },
  {
    id: 'imagen-4.0-ultra-generate-001',
    name: 'Imagen 4 Ultra',
    pricePerImage: 0.060,
    description: 'Highest photorealistic quality',
    capabilities: [
      'Maximum quality and realism',
      'Best for premium deliverables',
      '2K resolution support',
      'SynthID watermark',
      'Client-facing work'
    ],
    recommended: false
  }
];

function listModels(format: 'text' | 'json' = 'text'): void {
  if (format === 'json') {
    console.log(JSON.stringify(TOP_3_MODELS, null, 2));
    return;
  }

  console.log('\n🎨 Top 3 Google AI Image Generation Models\n');
  console.log('═'.repeat(70));

  TOP_3_MODELS.forEach((model, index) => {
    const badge = model.recommended ? ' ⭐ RECOMMENDED' : '';
    console.log(`\n${index + 1}. ${model.name}${badge}`);
    console.log(`   ID: ${model.id}`);

    if (model.priceBatch) {
      console.log(`   Price: $${model.pricePerImage.toFixed(3)}/image (standard), $${model.priceBatch.toFixed(4)}/image (batch)`);
    } else {
      console.log(`   Price: $${model.pricePerImage.toFixed(3)} per image`);
    }

    console.log(`   ${model.description}`);
    console.log(`\n   Capabilities:`);
    model.capabilities.forEach(cap => {
      console.log(`     • ${cap}`);
    });
  });

  console.log('\n' + '═'.repeat(70));
  console.log('\n💡 Cost Comparison (100 images):\n');

  TOP_3_MODELS.forEach(model => {
    if (model.priceBatch) {
      const standardCost = (model.pricePerImage * 100).toFixed(2);
      const batchCost = (model.priceBatch * 100).toFixed(2);
      console.log(`   ${model.name.padEnd(25)} $${standardCost} (standard) / $${batchCost} (batch)`);
    } else {
      const cost = (model.pricePerImage * 100).toFixed(2);
      console.log(`   ${model.name.padEnd(25)} $${cost}`);
    }
  });

  console.log('\n📚 Usage:');
  console.log('   npx tsx generate-image.ts "your prompt" "model-id"\n');
  console.log('📖 Full model list: See references/models.md\n');
}

// CLI Execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const format = args.includes('--json') ? 'json' : 'text';
  listModels(format);
}

export { TOP_3_MODELS, ModelInfo, listModels };
