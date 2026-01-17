#!/usr/bin/env python3
"""
Batch Image Converter - Convert multiple images with parallel processing.

Usage:
    batch_convert.py <input_dir> <output_dir> [options]

Options:
    --format FORMAT     Output format: jpg, png, webp (default: jpg)
    --quality QUALITY   Quality 1-100 for lossy formats (default: 85)
    --scale SCALE       Scale factor 0.1-1.0 (default: 1.0)
    --max-dim MAX       Max dimension in pixels (default: none)
    --workers N         Number of parallel workers (default: 4)
    --strip-exif        Strip EXIF metadata
    --recursive         Process subdirectories

Examples:
    batch_convert.py ./photos ./output --format jpg --quality 80 --scale 0.5
    batch_convert.py ./images ./web --format webp --max-dim 1920 --strip-exif
"""

import argparse
import os
import sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    from PIL import Image, ImageOps
    import pillow_heif
    pillow_heif.register_heif_opener()
except ImportError as e:
    print(f"Missing dependency: {e}")
    print("Install with: pip install pillow pillow-heif")
    sys.exit(1)

SUPPORTED_EXTENSIONS = {
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif',
    '.webp', '.heic', '.heif'
}


def convert_image(
    input_path: Path,
    output_dir: Path,
    output_format: str = 'jpg',
    quality: int = 85,
    scale: float = 1.0,
    max_dim: int = None,
    strip_exif: bool = False,
    preserve_structure: bool = False,
    base_input_dir: Path = None
) -> dict:
    """Convert a single image with specified options."""
    result = {'input': str(input_path), 'success': False, 'output': None, 'error': None}

    try:
        img = Image.open(input_path)

        # Handle EXIF orientation
        img = ImageOps.exif_transpose(img)

        # Apply scaling
        if scale != 1.0:
            new_size = (int(img.width * scale), int(img.height * scale))
            img = img.resize(new_size, Image.LANCZOS)

        # Apply max dimension constraint
        if max_dim and (img.width > max_dim or img.height > max_dim):
            ratio = min(max_dim / img.width, max_dim / img.height)
            new_size = (int(img.width * ratio), int(img.height * ratio))
            img = img.resize(new_size, Image.LANCZOS)

        # Convert mode for JPEG
        if output_format in ('jpg', 'jpeg') and img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGB')

        # Determine output path
        if preserve_structure and base_input_dir:
            rel_path = input_path.parent.relative_to(base_input_dir)
            final_output_dir = output_dir / rel_path
            final_output_dir.mkdir(parents=True, exist_ok=True)
        else:
            final_output_dir = output_dir

        output_path = final_output_dir / f"{input_path.stem}.{output_format}"

        # Get ICC profile if preserving
        icc_profile = None if strip_exif else img.info.get('icc_profile')

        # Save with format-specific options
        save_kwargs = {'optimize': True}

        if output_format in ('jpg', 'jpeg'):
            save_kwargs['quality'] = quality
            save_kwargs['progressive'] = True
            if icc_profile:
                save_kwargs['icc_profile'] = icc_profile

        elif output_format == 'webp':
            save_kwargs['quality'] = quality
            save_kwargs['method'] = 6

        elif output_format == 'png':
            save_kwargs['compress_level'] = 9

        img.save(output_path, **save_kwargs)

        result['success'] = True
        result['output'] = str(output_path)
        result['size'] = os.path.getsize(output_path)
        result['dimensions'] = f"{img.width}x{img.height}"

    except Exception as e:
        result['error'] = str(e)

    return result


def find_images(input_dir: Path, recursive: bool = False) -> list:
    """Find all supported image files in directory."""
    images = []

    if recursive:
        for ext in SUPPORTED_EXTENSIONS:
            images.extend(input_dir.rglob(f"*{ext}"))
            images.extend(input_dir.rglob(f"*{ext.upper()}"))
    else:
        for ext in SUPPORTED_EXTENSIONS:
            images.extend(input_dir.glob(f"*{ext}"))
            images.extend(input_dir.glob(f"*{ext.upper()}"))

    return sorted(set(images))


def main():
    parser = argparse.ArgumentParser(description='Batch convert images')
    parser.add_argument('input_dir', type=Path, help='Input directory')
    parser.add_argument('output_dir', type=Path, help='Output directory')
    parser.add_argument('--format', dest='output_format', default='jpg',
                        choices=['jpg', 'jpeg', 'png', 'webp'],
                        help='Output format (default: jpg)')
    parser.add_argument('--quality', type=int, default=85,
                        help='Quality 1-100 for lossy formats (default: 85)')
    parser.add_argument('--scale', type=float, default=1.0,
                        help='Scale factor 0.1-1.0 (default: 1.0)')
    parser.add_argument('--max-dim', type=int, default=None,
                        help='Maximum dimension in pixels')
    parser.add_argument('--workers', type=int, default=4,
                        help='Number of parallel workers (default: 4)')
    parser.add_argument('--strip-exif', action='store_true',
                        help='Strip EXIF metadata')
    parser.add_argument('--recursive', action='store_true',
                        help='Process subdirectories')

    args = parser.parse_args()

    if not args.input_dir.exists():
        print(f"Error: Input directory not found: {args.input_dir}")
        sys.exit(1)

    args.output_dir.mkdir(parents=True, exist_ok=True)

    images = find_images(args.input_dir, args.recursive)

    if not images:
        print(f"No supported images found in {args.input_dir}")
        sys.exit(0)

    print(f"Found {len(images)} images to convert")
    print(f"Output format: {args.output_format}, Quality: {args.quality}")

    if args.scale != 1.0:
        print(f"Scale: {args.scale * 100:.0f}%")
    if args.max_dim:
        print(f"Max dimension: {args.max_dim}px")

    successful = 0
    failed = 0
    total_size = 0

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {
            executor.submit(
                convert_image,
                img,
                args.output_dir,
                args.output_format,
                args.quality,
                args.scale,
                args.max_dim,
                args.strip_exif,
                args.recursive,
                args.input_dir
            ): img for img in images
        }

        for future in as_completed(futures):
            result = future.result()

            if result['success']:
                successful += 1
                total_size += result['size']
                print(f"  OK: {Path(result['input']).name} -> {result['dimensions']} ({result['size'] // 1024}KB)")
            else:
                failed += 1
                print(f"  FAIL: {Path(result['input']).name} - {result['error']}")

    print(f"\nComplete: {successful} converted, {failed} failed")
    print(f"Total output size: {total_size / (1024 * 1024):.1f} MB")


if __name__ == "__main__":
    main()
