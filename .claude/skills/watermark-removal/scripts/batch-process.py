#!/usr/bin/env python3
"""
Batch process multiple images to remove SynthID watermarks.

Usage:
    python batch-process.py input_dir output_dir [--method crop|inpaint] [--pattern *.png]
"""

import argparse
from pathlib import Path
import sys

# Import from remove-watermark.py
from PIL import Image
import importlib.util

# Load remove_watermark functions
spec = importlib.util.spec_from_file_location(
    "remove_watermark",
    Path(__file__).parent / "remove-watermark.py"
)
remove_watermark_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(remove_watermark_module)


def batch_process(
    input_dir: Path,
    output_dir: Path,
    pattern: str = "*.png",
    method: str = "crop",
    watermark_size: int = 120
):
    """
    Process all images in input directory.

    Args:
        input_dir: Directory containing images to process
        output_dir: Directory to save cleaned images
        pattern: File pattern to match (default: *.png)
        method: Removal method ('crop', 'paint', or 'aggressive')
        watermark_size: Size of watermark area in pixels
    """
    # Find all matching images
    image_files = list(input_dir.glob(pattern))

    if not image_files:
        print(f"❌ No images found matching pattern '{pattern}' in {input_dir}")
        return

    print(f"🔍 Found {len(image_files)} images to process")
    print(f"📁 Input: {input_dir}")
    print(f"📁 Output: {output_dir}")
    print(f"🛠️  Method: {method}")
    print()

    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)

    # Process each image
    success_count = 0
    fail_count = 0

    for idx, img_path in enumerate(image_files, 1):
        try:
            print(f"[{idx}/{len(image_files)}] Processing: {img_path.name}")

            # Load image
            image = Image.open(img_path)

            # Remove watermark
            if method == 'crop':
                cleaned = remove_watermark_module.remove_watermark_crop(
                    image, margin=watermark_size, auto_detect=True
                )
            elif method == 'paint':
                cleaned = remove_watermark_module.remove_watermark_paint(
                    image, size=watermark_size
                )
            elif method == 'inpaint':
                cleaned = remove_watermark_module.remove_watermark_inpaint(
                    image, auto_detect=True, inpaint_radius=5
                )
            else:  # aggressive
                cleaned = remove_watermark_module.remove_watermark_aggressive(
                    image, auto_detect=True
                )

            # Save result
            output_path = output_dir / img_path.name
            cleaned.save(output_path, 'PNG', optimize=False, compress_level=1)

            print(f"   ✅ Saved to: {output_path.name}")
            success_count += 1

        except Exception as e:
            print(f"   ❌ Error: {e}")
            fail_count += 1

    # Summary
    print()
    print("=" * 60)
    print(f"✅ Successfully processed: {success_count}/{len(image_files)}")
    if fail_count > 0:
        print(f"❌ Failed: {fail_count}/{len(image_files)}")
    print(f"📁 Output directory: {output_dir}")
    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(
        description='Batch remove SynthID watermarks from Google AI images'
    )
    parser.add_argument('input_dir', help='Input directory containing images')
    parser.add_argument('output_dir', help='Output directory for cleaned images')
    parser.add_argument(
        '--method',
        choices=['crop', 'paint', 'inpaint', 'aggressive'],
        default='inpaint',
        help='Removal method: inpaint (ML, preserves dimensions - DEFAULT), aggressive (fast but crops 120px), crop (fastest, crops), paint (basic)'
    )
    parser.add_argument(
        '--pattern',
        default='*.png',
        help='File pattern to match (default: *.png)'
    )
    parser.add_argument(
        '--size',
        type=int,
        default=120,
        help='Watermark size in pixels (default: 120)'
    )

    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)

    if not input_dir.exists():
        print(f"❌ Error: Input directory not found: {input_dir}")
        sys.exit(1)

    if not input_dir.is_dir():
        print(f"❌ Error: Input path is not a directory: {input_dir}")
        sys.exit(1)

    batch_process(
        input_dir=input_dir,
        output_dir=output_dir,
        pattern=args.pattern,
        method=args.method,
        watermark_size=args.size
    )


if __name__ == '__main__':
    main()
