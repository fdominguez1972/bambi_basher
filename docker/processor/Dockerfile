# Wildlife Detection Processing Container
# Based on PyTorch with CPU/GPU support

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy processing scripts
COPY process.py .
COPY download_model.py .

# Create directories for models and data
RUN mkdir -p /models /data/input /data/output /data/thumbnails

# Download MegaDetector model on build (optional - can also be done at runtime)
# Uncomment the following line to download model during build:
# RUN python download_model.py

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV MODEL_PATH=/models/md_v5a.0.0.pt
ENV CONFIDENCE_THRESHOLD=0.1
ENV THUMBNAIL_SIZE=400

# Entry point
ENTRYPOINT ["python", "process.py"]
