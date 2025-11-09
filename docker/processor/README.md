# Wildlife Detection Processor

Docker container for processing trail camera images using MegaDetector.

## Overview

This container uses Microsoft's MegaDetector v5a model to detect animals, people, and vehicles in trail camera images. It also extracts EXIF metadata and generates thumbnails.

## Features

- **Wildlife Detection**: Uses MegaDetector for accurate animal detection
- **GPU Support**: Automatically uses CUDA if available, falls back to CPU
- **EXIF Extraction**: Captures camera metadata including timestamps and GPS
- **Thumbnail Generation**: Creates optimized thumbnails for quick previews
- **Batch Processing**: Process single images or entire directories
- **JSON Output**: Structured detection results in JSON format

## Quick Start

### 1. Build the Container

```bash
docker build -t bambi-basher-processor .
```

### 2. Download MegaDetector Model

```bash
# Option 1: Download during build (uncomment line in Dockerfile)
# Option 2: Download at runtime
docker run --rm -v ./models:/models bambi-basher-processor python download_model.py
```

### 3. Process Images

```bash
docker run --rm \
  -v /path/to/images:/data/input \
  -v /path/to/output:/data/output \
  -v /path/to/thumbnails:/data/thumbnails \
  -v ./models:/models \
  bambi-basher-processor \
  --input /data/input \
  --output /data/output \
  --thumbnails /data/thumbnails
```

## Using with GPU

For NVIDIA GPU support:

```bash
docker run --rm --gpus all \
  -v /path/to/images:/data/input \
  -v /path/to/output:/data/output \
  -v /path/to/thumbnails:/data/thumbnails \
  -v ./models:/models \
  bambi-basher-processor \
  --input /data/input \
  --output /data/output \
  --thumbnails /data/thumbnails
```

## Configuration

### Environment Variables

- `MODEL_PATH`: Path to model file (default: `/models/md_v5a.0.0.pt`)
- `CONFIDENCE_THRESHOLD`: Minimum detection confidence 0.0-1.0 (default: `0.1`)
- `THUMBNAIL_SIZE`: Maximum thumbnail dimension in pixels (default: `400`)

### Command Line Arguments

```bash
--input PATH          Input image or directory (required)
--output PATH         Output directory for results (required)
--thumbnails PATH     Output directory for thumbnails (required)
--model PATH          Path to MegaDetector model
--confidence FLOAT    Confidence threshold (0.0-1.0)
--thumbnail-size INT  Maximum thumbnail dimension
```

## Output Format

For each processed image, the container generates:

1. **Result JSON** (`{filename}_result.json`):
```json
{
  "filename": "deer_photo.jpg",
  "status": "success",
  "detections": [
    {
      "category": "animal",
      "confidence": 0.95,
      "bbox": {
        "x": 0.5,
        "y": 0.4,
        "width": 0.3,
        "height": 0.4
      }
    }
  ],
  "exif": {
    "captured_at": "2024:01:15 14:30:22",
    "camera_make": "Bushnell",
    "camera_model": "Trophy Cam HD"
  },
  "thumbnail": "deer_photo_thumb.jpg",
  "error": null
}
```

2. **Thumbnail** (`{filename}_thumb.jpg`): JPEG thumbnail with max dimension 400px

3. **Summary** (`summary.json`): Overall processing statistics

## Integration with Backend

The backend service uses the `dockerode` library to:

1. Copy images to container's input directory
2. Run the processor container
3. Retrieve results and thumbnails
4. Update database with detection data

See `backend/src/services/processing.js` for integration code.

## MegaDetector Information

- **Model**: MegaDetector v5a
- **Source**: Microsoft AI for Earth
- **License**: MIT License
- **Detection Classes**:
  - 1: Animal
  - 2: Person
  - 3: Vehicle

## Performance

- **CPU Processing**: ~2-5 seconds per image (depends on CPU)
- **GPU Processing**: ~0.5-1 seconds per image (depends on GPU)
- **Model Size**: ~97 MB
- **Memory Usage**: ~1-2 GB (CPU) / ~2-4 GB (GPU)

## Troubleshooting

### Model Not Found

```bash
# Download the model
docker run --rm -v ./models:/models bambi-basher-processor python download_model.py
```

### Out of Memory

Reduce batch size or use CPU instead of GPU:

```bash
# Force CPU usage
docker run --rm \
  -e CUDA_VISIBLE_DEVICES=-1 \
  ...
```

### Permission Errors

Ensure volume mount directories have correct permissions:

```bash
chmod -R 755 /path/to/images
chmod -R 755 /path/to/output
```

## Development

### Running Tests

```bash
# Build test image
docker build -t bambi-basher-processor:test .

# Run with sample images
docker run --rm \
  -v $(pwd)/test_images:/data/input \
  -v $(pwd)/test_output:/data/output \
  -v $(pwd)/test_thumbnails:/data/thumbnails \
  -v $(pwd)/models:/models \
  bambi-basher-processor:test \
  --input /data/input \
  --output /data/output \
  --thumbnails /data/thumbnails \
  --confidence 0.3
```

## License

See main project LICENSE file.

## References

- [MegaDetector on GitHub](https://github.com/ecologize/CameraTraps)
- [Microsoft AI for Earth](https://www.microsoft.com/en-us/ai/ai-for-earth)
