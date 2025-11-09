#!/usr/bin/env python3
"""
Wildlife Detection Processing Script
Uses MegaDetector for animal detection in trail camera images
"""

import os
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple

import torch
import cv2
import numpy as np
from PIL import Image
import exifread

# MegaDetector uses YOLOv5 architecture
from ultralytics import YOLO


class WildlifeProcessor:
    """Processes trail camera images for wildlife detection"""

    # MegaDetector category IDs
    CATEGORY_MAPPING = {
        1: 'animal',
        2: 'person',
        3: 'vehicle'
    }

    def __init__(
        self,
        model_path: str,
        confidence_threshold: float = 0.1,
        thumbnail_size: int = 400
    ):
        """
        Initialize the processor

        Args:
            model_path: Path to MegaDetector model file
            confidence_threshold: Minimum detection confidence (0.0-1.0)
            thumbnail_size: Maximum dimension for thumbnail
        """
        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self.thumbnail_size = thumbnail_size
        self.model = None
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'

        print(f"Using device: {self.device}")

    def load_model(self):
        """Load the MegaDetector model"""
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(
                f"Model not found at {self.model_path}. "
                "Run download_model.py to download it."
            )

        print(f"Loading model from {self.model_path}...")
        self.model = YOLO(self.model_path)
        self.model.to(self.device)
        print("Model loaded successfully")

    def extract_exif(self, image_path: str) -> Dict:
        """
        Extract EXIF metadata from image

        Args:
            image_path: Path to image file

        Returns:
            Dictionary with EXIF data
        """
        exif_data = {}

        try:
            with open(image_path, 'rb') as f:
                tags = exifread.process_file(f)

                # Extract datetime
                if 'EXIF DateTimeOriginal' in tags:
                    exif_data['captured_at'] = str(tags['EXIF DateTimeOriginal'])
                elif 'Image DateTime' in tags:
                    exif_data['captured_at'] = str(tags['Image DateTime'])

                # Extract camera info
                if 'Image Make' in tags:
                    exif_data['camera_make'] = str(tags['Image Make'])
                if 'Image Model' in tags:
                    exif_data['camera_model'] = str(tags['Image Model'])

                # Extract GPS if available
                if 'GPS GPSLatitude' in tags and 'GPS GPSLongitude' in tags:
                    exif_data['has_gps'] = True
        except Exception as e:
            print(f"Warning: Could not extract EXIF from {image_path}: {e}")

        return exif_data

    def generate_thumbnail(self, image_path: str, output_path: str) -> Tuple[int, int]:
        """
        Generate thumbnail for image

        Args:
            image_path: Path to source image
            output_path: Path to save thumbnail

        Returns:
            Tuple of (width, height) of thumbnail
        """
        try:
            img = Image.open(image_path)

            # Calculate new dimensions maintaining aspect ratio
            img.thumbnail((self.thumbnail_size, self.thumbnail_size), Image.Resampling.LANCZOS)

            # Save thumbnail
            img.save(output_path, 'JPEG', quality=85)

            return img.size
        except Exception as e:
            print(f"Error generating thumbnail: {e}")
            return (0, 0)

    def detect_wildlife(self, image_path: str) -> List[Dict]:
        """
        Run wildlife detection on image

        Args:
            image_path: Path to image file

        Returns:
            List of detection dictionaries
        """
        if self.model is None:
            raise RuntimeError("Model not loaded. Call load_model() first.")

        # Run inference
        results = self.model(image_path, conf=self.confidence_threshold, verbose=False)

        detections = []

        # Process results
        for result in results:
            boxes = result.boxes

            for i, box in enumerate(boxes):
                # Get box coordinates (normalized 0-1)
                x1, y1, x2, y2 = box.xyxyn[0].tolist()

                # Convert to center coordinates and dimensions
                x_center = (x1 + x2) / 2
                y_center = (y1 + y2) / 2
                width = x2 - x1
                height = y2 - y1

                # Get confidence and class
                confidence = float(box.conf[0])
                class_id = int(box.cls[0])
                category = self.CATEGORY_MAPPING.get(class_id, 'unknown')

                detection = {
                    'category': category,
                    'confidence': confidence,
                    'bbox': {
                        'x': float(x_center),
                        'y': float(y_center),
                        'width': float(width),
                        'height': float(height)
                    }
                }

                detections.append(detection)

        return detections

    def process_image(
        self,
        input_path: str,
        output_dir: str,
        thumbnail_dir: str
    ) -> Dict:
        """
        Process a single image

        Args:
            input_path: Path to input image
            output_dir: Directory for output JSON
            thumbnail_dir: Directory for thumbnails

        Returns:
            Processing result dictionary
        """
        image_name = os.path.basename(input_path)
        base_name = os.path.splitext(image_name)[0]

        result = {
            'filename': image_name,
            'status': 'success',
            'detections': [],
            'exif': {},
            'thumbnail': None,
            'error': None
        }

        try:
            # Extract EXIF
            print(f"Extracting EXIF from {image_name}...")
            result['exif'] = self.extract_exif(input_path)

            # Generate thumbnail
            print(f"Generating thumbnail for {image_name}...")
            thumbnail_path = os.path.join(thumbnail_dir, f"{base_name}_thumb.jpg")
            thumb_size = self.generate_thumbnail(input_path, thumbnail_path)
            if thumb_size[0] > 0:
                result['thumbnail'] = os.path.basename(thumbnail_path)
                result['thumbnail_size'] = {'width': thumb_size[0], 'height': thumb_size[1]}

            # Run detection
            print(f"Running detection on {image_name}...")
            detections = self.detect_wildlife(input_path)
            result['detections'] = detections

            print(f"Found {len(detections)} detection(s)")

            # Save result JSON
            output_path = os.path.join(output_dir, f"{base_name}_result.json")
            with open(output_path, 'w') as f:
                json.dump(result, f, indent=2)

        except Exception as e:
            result['status'] = 'failed'
            result['error'] = str(e)
            print(f"Error processing {image_name}: {e}")

        return result


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Process trail camera images for wildlife detection'
    )
    parser.add_argument(
        '--input',
        required=True,
        help='Input image path or directory'
    )
    parser.add_argument(
        '--output',
        required=True,
        help='Output directory for results'
    )
    parser.add_argument(
        '--thumbnails',
        required=True,
        help='Output directory for thumbnails'
    )
    parser.add_argument(
        '--model',
        default=os.getenv('MODEL_PATH', '/models/md_v5a.0.0.pt'),
        help='Path to MegaDetector model'
    )
    parser.add_argument(
        '--confidence',
        type=float,
        default=float(os.getenv('CONFIDENCE_THRESHOLD', '0.1')),
        help='Confidence threshold (0.0-1.0)'
    )
    parser.add_argument(
        '--thumbnail-size',
        type=int,
        default=int(os.getenv('THUMBNAIL_SIZE', '400')),
        help='Maximum thumbnail dimension'
    )

    args = parser.parse_args()

    # Create output directories
    os.makedirs(args.output, exist_ok=True)
    os.makedirs(args.thumbnails, exist_ok=True)

    # Initialize processor
    processor = WildlifeProcessor(
        model_path=args.model,
        confidence_threshold=args.confidence,
        thumbnail_size=args.thumbnail_size
    )

    # Load model
    processor.load_model()

    # Process input
    input_path = Path(args.input)

    if input_path.is_file():
        # Single file
        images = [input_path]
    elif input_path.is_dir():
        # Directory - find all images
        image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
        images = [
            f for f in input_path.iterdir()
            if f.suffix.lower() in image_extensions
        ]
    else:
        print(f"Error: {input_path} is not a file or directory")
        sys.exit(1)

    if not images:
        print("No images found to process")
        sys.exit(1)

    print(f"\nProcessing {len(images)} image(s)...\n")

    # Process all images
    results = []
    for image_path in images:
        result = processor.process_image(
            str(image_path),
            args.output,
            args.thumbnails
        )
        results.append(result)

    # Summary
    successful = sum(1 for r in results if r['status'] == 'success')
    failed = len(results) - successful
    total_detections = sum(len(r['detections']) for r in results)

    print(f"\n{'='*60}")
    print(f"Processing complete!")
    print(f"  Total images: {len(results)}")
    print(f"  Successful: {successful}")
    print(f"  Failed: {failed}")
    print(f"  Total detections: {total_detections}")
    print(f"{'='*60}\n")

    # Save summary
    summary = {
        'timestamp': datetime.now().isoformat(),
        'total_images': len(results),
        'successful': successful,
        'failed': failed,
        'total_detections': total_detections,
        'results': results
    }

    summary_path = os.path.join(args.output, 'summary.json')
    with open(summary_path, 'w') as f:
        json.dump(summary, f, indent=2)

    print(f"Results saved to {args.output}")
    print(f"Summary saved to {summary_path}")


if __name__ == '__main__':
    main()
