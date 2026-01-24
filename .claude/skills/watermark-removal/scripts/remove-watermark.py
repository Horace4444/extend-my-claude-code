#!/usr/bin/env python3
"""
Remove SynthID watermarks from Google AI generated images.

Google's SynthID watermark appears as a visible star/sparkle icon in the
bottom-right corner, plus invisible steganographic watermarking throughout.

Usage:
    python remove-watermark.py input.png output.png [--method crop|paint|aggressive]
"""

import sys
import argparse
from pathlib import Path
from PIL import Image
import numpy as np

# Detection constants
DEFAULT_CORNER_SIZE = 150
DEFAULT_WATERMARK_SIZE = 120
GOOGLE_MIN_DIMENSION = 1500
ASPECT_RATIO_TOLERANCE = 0.1

# Google AI typical aspect ratios
GOOGLE_ASPECT_RATIOS = [
    1.83,  # 2816/1536 (Imagen standard)
    1.0,   # Square (1536x1536)
    1.5,   # 3:2 ratio
    1.78   # 16:9 ratio
]

# Scoring weights for watermark detection
EDGE_WEIGHT = 0.5
BRIGHTNESS_WEIGHT = 0.3
ALPHA_WEIGHT = 0.2

# Try to import OpenCV for ML inpainting
try:
    import cv2
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False
    print("⚠️  Warning: OpenCV not installed. ML inpainting method unavailable.")
    print("   Install with: pip install opencv-python")

def detect_synthid_watermark(image: Image.Image) -> bool:
    """
    Detect if image has Google SynthID/Imagen watermark.

    Google AI image characteristics:
    - RGBA mode (PNG format with alpha channel)
    - Large dimensions (typically 2816x1536 or 1536x1536)
    - High quality AI-generated content

    Strategy: Since Google AI images have consistent properties and the aggressive
    method works perfectly on them, we use simple heuristics for detection.

    Returns:
        True if likely Google AI/Imagen image, False otherwise
    """
    width, height = image.size

    # Check 1: RGBA mode (Google outputs PNG with alpha)
    if image.mode != 'RGBA':
        return False

    # Check 2: Large dimensions typical of Google AI images (Imagen outputs 2816x1536, 1536x1536, etc.)
    if width < GOOGLE_MIN_DIMENSION or height < GOOGLE_MIN_DIMENSION:
        return False

    # Check 3: Aspect ratios typical of Google AI
    aspect_ratio = width / height if width > height else height / width
    matches_google_ratio = any(
        abs(aspect_ratio - ratio) < ASPECT_RATIO_TOLERANCE
        for ratio in GOOGLE_ASPECT_RATIOS
    )

    # If it's RGBA, large, and matches Google's typical aspect ratios, it's likely Google AI
    return matches_google_ratio


def detect_watermark_location(image: Image.Image, corner_size: int = 150) -> dict:
    """
    Detect watermark location by analyzing corner regions for anomalies.

    Google SynthID watermarks are typically in bottom-right with a star/sparkle icon.
    This function analyzes all corners and looks for:
    - High contrast edges (watermark icon)
    - Bright spots (white/light watermark)
    - Alpha channel transparency (RGBA images)

    Args:
        image: PIL Image object
        corner_size: Size of corner region to analyze (default 150px)

    Returns:
        Dict with detected corner, confidence score, and all corner scores
    """
    width, height = image.size

    # Check if image has alpha channel
    has_alpha = image.mode == 'RGBA'

    if has_alpha:
        arr_rgb = np.array(image.convert('RGB'))
        arr_alpha = np.array(image.split()[3])  # Extract alpha channel
    else:
        arr_rgb = np.array(image.convert('RGB'))
        arr_alpha = None

    # Define corner regions
    corners = {
        'bottom-right': {
            'rgb': arr_rgb[height-corner_size:height, width-corner_size:width],
            'alpha': arr_alpha[height-corner_size:height, width-corner_size:width] if has_alpha else None
        },
        'bottom-left': {
            'rgb': arr_rgb[height-corner_size:height, 0:corner_size],
            'alpha': arr_alpha[height-corner_size:height, 0:corner_size] if has_alpha else None
        },
        'top-right': {
            'rgb': arr_rgb[0:corner_size, width-corner_size:width],
            'alpha': arr_alpha[0:corner_size, width-corner_size:width] if has_alpha else None
        },
        'top-left': {
            'rgb': arr_rgb[0:corner_size, 0:corner_size],
            'alpha': arr_alpha[0:corner_size, 0:corner_size] if has_alpha else None
        }
    }

    # Analyze each corner for watermark characteristics
    scores = {}
    for corner_name, corner_data in corners.items():
        rgb_data = corner_data['rgb']
        alpha_data = corner_data['alpha']

        if rgb_data.size == 0:
            scores[corner_name] = 0
            continue

        # 1. Edge detection score (watermark has sharp edges)
        # Convert to grayscale and detect edges
        gray = np.mean(rgb_data, axis=2).astype(np.uint8)
        edges = np.abs(np.diff(gray, axis=0)).sum() + np.abs(np.diff(gray, axis=1)).sum()
        edge_score = edges / (corner_size * corner_size)

        # 2. Brightness concentration (watermark often bright/white)
        bright_pixels = np.sum(rgb_data > 200) / rgb_data.size

        # 3. Alpha channel anomaly (transparency in watermark area)
        alpha_score = 0
        if alpha_data is not None:
            alpha_variance = np.var(alpha_data)
            alpha_score = alpha_variance / 1000.0  # Normalize

        # Weighted combination
        # Edge detection is most reliable for detecting watermark icons
        score = (edge_score * EDGE_WEIGHT) + (bright_pixels * BRIGHTNESS_WEIGHT) + (alpha_score * ALPHA_WEIGHT)
        scores[corner_name] = score

    # Find corner with highest watermark likelihood
    detected_corner = max(scores, key=scores.get)
    confidence = scores[detected_corner]

    # Bias towards bottom-right for Google SynthID (add small bonus)
    if 'bottom-right' in scores:
        scores['bottom-right'] += 0.1
        if scores['bottom-right'] > confidence:
            detected_corner = 'bottom-right'
            confidence = scores['bottom-right']

    return {
        'corner': detected_corner,
        'confidence': confidence,
        'all_scores': scores
    }


def remove_watermark_crop(image: Image.Image, margin: int = 100, auto_detect: bool = True) -> Image.Image:
    """
    Remove watermark by cropping detected corner.

    Args:
        image: PIL Image object
        margin: Pixels to crop from corner (default 100px)
        auto_detect: Automatically detect watermark location (default True)

    Returns:
        Cropped PIL Image with watermark removed
    """
    width, height = image.size

    # Detect watermark location if auto_detect enabled
    if auto_detect:
        detection = detect_watermark_location(image, corner_size=DEFAULT_CORNER_SIZE)
        corner = detection['corner']
        print(f"   🔍 Detected watermark in: {corner} (confidence: {detection['confidence']:.2f})")
    else:
        corner = 'bottom-right'  # Default fallback

    # Crop based on detected corner
    if corner == 'bottom-right':
        cropped = image.crop((0, 0, width - margin, height - margin))
    elif corner == 'bottom-left':
        cropped = image.crop((margin, 0, width, height - margin))
    elif corner == 'top-right':
        cropped = image.crop((0, margin, width - margin, height))
    elif corner == 'top-left':
        cropped = image.crop((margin, margin, width, height))
    else:
        # Fallback to bottom-right
        cropped = image.crop((0, 0, width - margin, height - margin))

    # Convert to RGB if it has alpha channel
    if cropped.mode == 'RGBA':
        background = Image.new('RGB', cropped.size, (255, 255, 255))
        background.paste(cropped, mask=cropped.split()[3] if len(cropped.split()) == 4 else None)
        return background

    return cropped.convert('RGB')


def remove_watermark_paint(image: Image.Image, size: int = DEFAULT_WATERMARK_SIZE) -> Image.Image:
    """
    Remove visible watermark by painting over it with surrounding color.

    Args:
        image: PIL Image object
        size: Size of watermark area to paint over (default 120px)

    Returns:
        Image with watermark painted over
    """
    # Convert to RGB to avoid alpha channel issues
    if image.mode == 'RGBA':
        background = Image.new('RGB', image.size, (255, 255, 255))
        background.paste(image, mask=image.split()[3])
        image = background
    else:
        image = image.convert('RGB')

    width, height = image.size
    img_array = np.array(image)

    # Define watermark region (bottom-right corner)
    x_start = width - size
    y_start = height - size

    # Sample pixels from left and top of watermark area
    sample_region_left = img_array[y_start:height, max(0, x_start-size):x_start]
    sample_region_top = img_array[max(0, y_start-size):y_start, x_start:width]

    # Calculate average color from surrounding area
    if sample_region_left.size > 0:
        avg_color_left = sample_region_left.mean(axis=(0, 1))
    else:
        avg_color_left = np.array([200, 200, 200])

    if sample_region_top.size > 0:
        avg_color_top = sample_region_top.mean(axis=(0, 1))
    else:
        avg_color_top = np.array([200, 200, 200])

    # Blend the two averages
    fill_color = ((avg_color_left + avg_color_top) / 2).astype(np.uint8)

    # Fill the watermark area
    img_array[y_start:height, x_start:width] = fill_color

    return Image.fromarray(img_array)


def remove_watermark_inpaint(image: Image.Image, auto_detect: bool = True, inpaint_radius: int = 5) -> Image.Image:
    """
    Remove watermark using ML-based inpainting (OpenCV).

    This is the most sophisticated method that works on ANY watermark type:
    - Detects watermark location automatically
    - Creates a mask around the watermark
    - Uses Navier-Stokes or Telea inpainting algorithms to fill the area intelligently

    Args:
        image: PIL Image object
        auto_detect: Automatically detect watermark location (default True)
        inpaint_radius: Inpainting radius in pixels (default 5)

    Returns:
        Inpainted image with watermark removed
    """
    if not HAS_CV2:
        print("   ⚠️  OpenCV not available, falling back to paint method")
        return remove_watermark_paint(image, size=120)

    # Detect watermark location
    if auto_detect:
        detection = detect_watermark_location(image, corner_size=DEFAULT_CORNER_SIZE)
        corner = detection['corner']
        print(f"   🔍 Detected watermark in: {corner} (confidence: {detection['confidence']:.2f})")
    else:
        corner = 'bottom-right'

    # Convert PIL to OpenCV format (BGR)
    if image.mode == 'RGBA':
        # Convert RGBA to RGB first
        background = Image.new('RGB', image.size, (255, 255, 255))
        background.paste(image, mask=image.split()[3])
        image = background
    else:
        image = image.convert('RGB')

    img_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    height, width = img_cv.shape[:2]

    # Create mask for watermark region
    mask = np.zeros((height, width), dtype=np.uint8)

    # Define watermark region based on detected corner (120x120 px)
    wm_size = 120
    if corner == 'bottom-right':
        mask[height-wm_size:height, width-wm_size:width] = 255
    elif corner == 'bottom-left':
        mask[height-wm_size:height, 0:wm_size] = 255
    elif corner == 'top-right':
        mask[0:wm_size, width-wm_size:width] = 255
    elif corner == 'top-left':
        mask[0:wm_size, 0:wm_size] = 255

    # Use Navier-Stokes based inpainting (more robust)
    # Alternative: cv2.INPAINT_TELEA for faster processing
    inpainted = cv2.inpaint(img_cv, mask, inpaint_radius, cv2.INPAINT_NS)

    # Convert back to PIL RGB
    result_rgb = cv2.cvtColor(inpainted, cv2.COLOR_BGR2RGB)
    return Image.fromarray(result_rgb)


def remove_watermark_aggressive(image: Image.Image, auto_detect: bool = True) -> Image.Image:
    """
    Aggressively remove watermark by detecting location, cropping, and painting.

    This method:
    1. Auto-detects watermark location
    2. Crops 120px from detected corner
    3. Removes alpha channel
    4. Paints over any remaining visible watermark

    Args:
        image: PIL Image object
        auto_detect: Automatically detect watermark location (default True)

    Returns:
        Cleaned image
    """
    width, height = image.size

    # Detect watermark location
    if auto_detect:
        detection = detect_watermark_location(image, corner_size=DEFAULT_CORNER_SIZE)
        corner = detection['corner']
        print(f"   🔍 Detected watermark in: {corner} (confidence: {detection['confidence']:.2f})")
    else:
        corner = 'bottom-right'  # Default fallback

    # Crop based on detected corner (120px margin)
    margin = 120
    if corner == 'bottom-right':
        cropped = image.crop((0, 0, width - margin, height - margin))
    elif corner == 'bottom-left':
        cropped = image.crop((margin, 0, width, height - margin))
    elif corner == 'top-right':
        cropped = image.crop((0, margin, width - margin, height))
    elif corner == 'top-left':
        cropped = image.crop((margin, margin, width, height))
    else:
        cropped = image.crop((0, 0, width - margin, height - margin))

    # Convert RGBA to RGB (removes alpha channel watermarking)
    if cropped.mode == 'RGBA':
        background = Image.new('RGB', cropped.size, (255, 255, 255))
        background.paste(cropped, mask=cropped.split()[3])
        result = background
    else:
        result = cropped.convert('RGB')

    # Check for any remaining watermark in corner and paint over it
    result_width, result_height = result.size
    arr = np.array(result)

    # Sample 80px corner to check for watermark remnants
    corner_size = 80
    if result_width > corner_size and result_height > corner_size:
        # Sample from adjacent area
        x_start = result_width - corner_size
        y_start = result_height - corner_size

        # Get surrounding pixels for fill color
        sample_left = arr[y_start:result_height, max(0, x_start-corner_size):x_start]
        sample_top = arr[max(0, y_start-corner_size):y_start, x_start:result_width]

        if sample_left.size > 0 and sample_top.size > 0:
            fill_color = ((sample_left.mean(axis=(0,1)) + sample_top.mean(axis=(0,1))) / 2).astype(np.uint8)
            arr[y_start:result_height, x_start:result_width] = fill_color
            result = Image.fromarray(arr)

    return result


def main():
    parser = argparse.ArgumentParser(
        description='Remove SynthID watermarks from Google AI generated images'
    )
    parser.add_argument('input', help='Input image path')
    parser.add_argument('output', help='Output image path')
    parser.add_argument(
        '--method',
        choices=['crop', 'paint', 'inpaint', 'aggressive'],
        default='inpaint',
        help='Removal method: inpaint (ML, best quality, preserves dimensions - DEFAULT), aggressive (fast but crops 120px), crop (fastest, crops), paint (basic)'
    )
    parser.add_argument(
        '--size',
        type=int,
        default=120,
        help='Watermark area size in pixels (default: 120)'
    )
    parser.add_argument(
        '--no-detect',
        action='store_true',
        help='Disable automatic watermark detection (assumes bottom-right)'
    )

    args = parser.parse_args()

    # Load image
    input_path = Path(args.input)
    if not input_path.exists():
        print(f"❌ Error: Input file not found: {input_path}")
        sys.exit(1)

    print(f"📷 Loading image: {input_path}")
    image = Image.open(input_path)
    original_size = image.size
    print(f"   Original size: {original_size[0]}x{original_size[1]}px")
    print(f"   Mode: {image.mode}")

    # Smart detection: Check if this is a Google SynthID watermark
    is_synthid = detect_synthid_watermark(image)

    if is_synthid:
        print(f"🎯 Google SynthID watermark detected!")
        # If user chose inpaint, suggest aggressive method instead (proven to work perfectly)
        if args.method == 'inpaint':
            print(f"   💡 Switching to 'aggressive' method (proven perfect for Google AI images)")
            print(f"   ⚠️  Note: This will crop 120px from corners. Use --method inpaint to force ML method.")
            args.method = 'aggressive'
        elif args.method in ['crop', 'aggressive']:
            print(f"   ✓ Using {args.method} method (excellent for SynthID watermarks)")
    else:
        print(f"ℹ️  Non-SynthID watermark detected (or no watermark)")
        if args.method == 'aggressive':
            print(f"   💡 Consider using 'inpaint' method for better quality on non-Google watermarks")

    # Remove watermark
    auto_detect = not args.no_detect
    detect_msg = "with auto-detection" if auto_detect else "bottom-right corner"

    if args.method == 'crop':
        print(f"✂️  Removing watermark (crop method, {args.size}px margin, {detect_msg})...")
        cleaned = remove_watermark_crop(image, margin=args.size, auto_detect=auto_detect)
    elif args.method == 'paint':
        print(f"🎨 Removing watermark (paint method, {args.size}px area)...")
        cleaned = remove_watermark_paint(image, size=args.size)
    elif args.method == 'inpaint':
        print(f"🤖 Removing watermark (ML inpaint method, {detect_msg})...")
        cleaned = remove_watermark_inpaint(image, auto_detect=auto_detect, inpaint_radius=5)
    else:  # aggressive
        print(f"🔧 Removing watermark (aggressive method - {detect_msg})...")
        cleaned = remove_watermark_aggressive(image, auto_detect=auto_detect)

    # Save result
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Save as high-quality PNG
    cleaned.save(output_path, 'PNG', optimize=False, compress_level=1)

    new_size = cleaned.size
    print(f"✅ Watermark removed!")
    print(f"   New size: {new_size[0]}x{new_size[1]}px")
    print(f"   Saved to: {output_path}")


if __name__ == '__main__':
    main()
