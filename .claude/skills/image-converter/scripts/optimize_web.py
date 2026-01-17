#!/usr/bin/env python3
"""
Web Image Optimizer - Optimize images for web with size targets.

Usage:
    optimize_web.py <input> <output> [options]

Options:
    --max-size KB       Target max file size in KB (default: 200)
    --max-width PX      Maximum width in pixels (default: 1920)
    --format FORMAT     Output format: jpg, webp (default: jpg)
    --min-quality N     Minimum quality threshold (default: 60)

Examples:
    optimize_web.py photo.heic photo.jpg --max-size 150
    optimize_web.py image.png image.webp --max-width 1200 --max-size 100
"""

import argparse
import os
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
    import pillow_heif
    pillow_heif.register_heif_opener()
except ImportError as e:
    print(f"Missing dependency: {e}")
    print("Install with: pip install pillow pillow-heif")
    sys.exit(1)


def optimize_for_web(
    input_path: Path,
    output_path: Path,
    max_size_kb: int = 200,
    max_width: int = 1920,
    output_format: str = 'jpg',
    min_quality: int = 60
) -> dict:
    """
    Optimize image for web with size constraints.

    Uses binary search to find optimal quality that meets size target.
    """
    result = {
        'input': str(input_path),
        'output': str(output_path),
        'success': False,
        'original_size': os.path.getsize(input_path),
        'final_size': None,
        'final_quality': None,
        'dimensions': None
    }

    try:
        img = Image.open(input_path)

        # Handle EXIF orientation
        img = ImageOps.exif_transpose(img)

        # Resize if wider than max_width
        if img.width > max_width:
            ratio = max_width / img.width
            new_size = (max_width, int(img.height * ratio))
            img = img.resize(new_size, Image.LANCZOS)

        # Convert mode for JPEG
        if output_format in ('jpg', 'jpeg') and img.mode in ('RGBA', 'LA', 'P'):
            # For images with transparency, use white background
            if img.mode == 'RGBA':
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[3])
                img = background
            else:
                img = img.convert('RGB')

        # Preserve ICC profile
        icc_profile = img.info.get('icc_profile')

        result['dimensions'] = f"{img.width}x{img.height}"

        # Binary search for optimal quality
        low, high = min_quality, 95
        best_quality = high
        max_size_bytes = max_size_kb * 1024

        while low <= high:
            quality = (low + high) // 2

            # Save to temporary buffer to check size
            from io import BytesIO
            buffer = BytesIO()

            save_kwargs = {'optimize': True, 'quality': quality}
            if output_format in ('jpg', 'jpeg'):
                save_kwargs['progressive'] = True
                if icc_profile:
                    save_kwargs['icc_profile'] = icc_profile
            elif output_format == 'webp':
                save_kwargs['method'] = 6

            img.save(buffer, format=output_format.upper() if output_format != 'jpg' else 'JPEG', **save_kwargs)
            size = buffer.tell()

            if size <= max_size_bytes:
                best_quality = quality
                low = quality + 1
            else:
                high = quality - 1

        # Save with best quality found
        save_kwargs = {'optimize': True, 'quality': best_quality}
        if output_format in ('jpg', 'jpeg'):
            save_kwargs['progressive'] = True
            if icc_profile:
                save_kwargs['icc_profile'] = icc_profile
        elif output_format == 'webp':
            save_kwargs['method'] = 6

        img.save(output_path, **save_kwargs)

        result['success'] = True
        result['final_size'] = os.path.getsize(output_path)
        result['final_quality'] = best_quality
        result['compression_ratio'] = result['original_size'] / result['final_size']

    except Exception as e:
        result['error'] = str(e)

    return result


def main():
    parser = argparse.ArgumentParser(description='Optimize images for web')
    parser.add_argument('input', type=Path, help='Input image file')
    parser.add_argument('output', type=Path, help='Output image file')
    parser.add_argument('--max-size', type=int, default=200,
                        help='Target max file size in KB (default: 200)')
    parser.add_argument('--max-width', type=int, default=1920,
                        help='Maximum width in pixels (default: 1920)')
    parser.add_argument('--format', dest='output_format', default='jpg',
                        choices=['jpg', 'webp'],
                        help='Output format (default: jpg)')
    parser.add_argument('--min-quality', type=int, default=60,
                        help='Minimum quality threshold (default: 60)')

    args = parser.parse_args()

    if not args.input.exists():
        print(f"Error: Input file not found: {args.input}")
        sys.exit(1)

    # Create output directory if needed
    args.output.parent.mkdir(parents=True, exist_ok=True)

    print(f"Optimizing: {args.input}")
    print(f"Target: {args.max_size}KB max, {args.max_width}px max width")

    result = optimize_for_web(
        args.input,
        args.output,
        max_size_kb=args.max_size,
        max_width=args.max_width,
        output_format=args.output_format,
        min_quality=args.min_quality
    )

    if result['success']:
        orig_kb = result['original_size'] / 1024
        final_kb = result['final_size'] / 1024
        savings = (1 - result['final_size'] / result['original_size']) * 100

        print(f"\nSuccess!")
        print(f"  Original: {orig_kb:.1f} KB")
        print(f"  Optimized: {final_kb:.1f} KB ({savings:.1f}% smaller)")
        print(f"  Quality: {result['final_quality']}")
        print(f"  Dimensions: {result['dimensions']}")
        print(f"  Output: {result['output']}")
    else:
        print(f"\nError: {result.get('error', 'Unknown error')}")
        sys.exit(1)


if __name__ == "__main__":
    main()
