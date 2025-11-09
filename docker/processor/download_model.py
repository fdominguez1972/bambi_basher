#!/usr/bin/env python3
"""
Download MegaDetector model

MegaDetector is a wildlife detection model from Microsoft AI for Earth.
This script downloads the model weights for offline use.
"""

import os
import sys
import requests
from pathlib import Path
from tqdm import tqdm


# MegaDetector v5a model
MODEL_URL = 'https://github.com/ecologize/CameraTraps/releases/download/v5.0/md_v5a.0.0.pt'
MODEL_FILENAME = 'md_v5a.0.0.pt'
MODEL_SIZE_MB = 97  # Approximate size


def download_file(url: str, destination: str) -> bool:
    """
    Download file with progress bar

    Args:
        url: URL to download from
        destination: Local file path to save to

    Returns:
        True if successful, False otherwise
    """
    try:
        print(f"Downloading from: {url}")
        print(f"Saving to: {destination}")

        # Create directory if needed
        os.makedirs(os.path.dirname(destination), exist_ok=True)

        # Stream download with progress bar
        response = requests.get(url, stream=True)
        response.raise_for_status()

        total_size = int(response.headers.get('content-length', 0))

        with open(destination, 'wb') as f, tqdm(
            desc=MODEL_FILENAME,
            total=total_size,
            unit='iB',
            unit_scale=True,
            unit_divisor=1024,
        ) as progress_bar:
            for chunk in response.iter_content(chunk_size=8192):
                size = f.write(chunk)
                progress_bar.update(size)

        print(f"✓ Download complete: {destination}")
        return True

    except requests.exceptions.RequestException as e:
        print(f"✗ Download failed: {e}")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def verify_model(model_path: str) -> bool:
    """
    Verify the model file is valid

    Args:
        model_path: Path to model file

    Returns:
        True if valid, False otherwise
    """
    try:
        import torch

        print(f"Verifying model at {model_path}...")

        # Try to load the model
        checkpoint = torch.load(model_path, map_location='cpu')

        print(f"✓ Model verified successfully")
        print(f"  Model type: {checkpoint.get('model', {}).get('yaml_file', 'Unknown')}")

        return True

    except Exception as e:
        print(f"✗ Model verification failed: {e}")
        return False


def main():
    """Main entry point"""
    # Default model directory
    model_dir = os.getenv('MODEL_PATH', '/models')

    # Handle case where MODEL_PATH includes filename
    if model_dir.endswith('.pt'):
        model_dir = os.path.dirname(model_dir)

    model_path = os.path.join(model_dir, MODEL_FILENAME)

    print("=" * 60)
    print("MegaDetector Model Downloader")
    print("=" * 60)
    print()

    # Check if already exists
    if os.path.exists(model_path):
        file_size = os.path.getsize(model_path) / (1024 * 1024)
        print(f"Model already exists: {model_path}")
        print(f"Size: {file_size:.1f} MB")
        print()

        response = input("Do you want to re-download? (y/N): ").strip().lower()
        if response != 'y':
            print("Skipping download.")

            # Verify existing model
            if verify_model(model_path):
                return 0
            else:
                print("\nExisting model is invalid. Re-downloading...")
        else:
            print()

    # Download model
    print(f"Downloading MegaDetector v5a (~{MODEL_SIZE_MB} MB)...")
    print()

    success = download_file(MODEL_URL, model_path)

    if not success:
        print("\nDownload failed. Please check your internet connection and try again.")
        return 1

    # Verify downloaded model
    print()
    if verify_model(model_path):
        print()
        print("=" * 60)
        print("✓ Model ready for use!")
        print(f"  Location: {model_path}")
        print("=" * 60)
        return 0
    else:
        print("\nModel verification failed. The download may be corrupted.")
        print("Please try again.")
        return 1


if __name__ == '__main__':
    sys.exit(main())
