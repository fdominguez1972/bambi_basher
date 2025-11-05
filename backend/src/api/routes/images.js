import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getImages, getImageById } from '../../services/images.js';
import { handleUpload, getStoragePaths } from '../../services/upload.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { createError } from '../middleware/errorHandler.js';
import { get, run } from '../../db/database.js';

const router = express.Router();

// Configure multer for temporary uploads
const TEMP_DIR = path.join(process.cwd(), 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'upload-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 50
  }
});

/**
 * POST /api/images
 * Upload one or more images
 * Requires: Admin role
 */
router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  upload.array('images', 50),
  async (req, res, next) => {
    try {
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({
          error: 'No files provided'
        });
      }

      const userId = req.user.id;
      const results = {
        uploaded: [],
        failed: []
      };

      // Process each file
      for (const file of files) {
        try {
          const image = await handleUpload(file, userId);
          results.uploaded.push(image);
        } catch (error) {
          // Clean up temp file if it still exists
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }

          results.failed.push({
            filename: file.originalname,
            error: error.message
          });
        }
      }

      // Determine response status
      if (results.uploaded.length === 0) {
        return res.status(400).json({
          error: 'All uploads failed',
          failed: results.failed
        });
      } else if (results.failed.length > 0) {
        return res.status(207).json({
          uploaded: results.uploaded,
          failed: results.failed,
          count: results.uploaded.length,
          failedCount: results.failed.length
        });
      } else {
        return res.status(201).json({
          uploaded: results.uploaded,
          count: results.uploaded.length
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/images
 * Get paginated list of images with filters
 */
router.get('/', requireAuth, (req, res, next) => {
  try {
    const {
      limit,
      offset,
      start_date,
      end_date,
      species_id,
      location_id,
      status
    } = req.query;

    // Parse and validate parameters
    const filters = {};

    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        throw createError('Limit must be between 1 and 100', 400);
      }
      filters.limit = parsedLimit;
    }

    if (offset) {
      const parsedOffset = parseInt(offset, 10);
      if (isNaN(parsedOffset) || parsedOffset < 0) {
        throw createError('Offset must be a non-negative number', 400);
      }
      filters.offset = parsedOffset;
    }

    if (start_date) {
      const parsedStartDate = parseInt(start_date, 10);
      if (isNaN(parsedStartDate)) {
        throw createError('Invalid start_date', 400);
      }
      filters.start_date = parsedStartDate;
    }

    if (end_date) {
      const parsedEndDate = parseInt(end_date, 10);
      if (isNaN(parsedEndDate)) {
        throw createError('Invalid end_date', 400);
      }
      filters.end_date = parsedEndDate;
    }

    if (species_id) {
      const parsedSpeciesId = parseInt(species_id, 10);
      if (isNaN(parsedSpeciesId)) {
        throw createError('Invalid species_id', 400);
      }
      filters.species_id = parsedSpeciesId;
    }

    if (location_id) {
      const parsedLocationId = parseInt(location_id, 10);
      if (isNaN(parsedLocationId)) {
        throw createError('Invalid location_id', 400);
      }
      filters.location_id = parsedLocationId;
    }

    if (status) {
      const validStatuses = ['pending', 'processing', 'completed', 'failed'];
      if (!validStatuses.includes(status)) {
        throw createError('Invalid status. Must be: pending, processing, completed, or failed', 400);
      }
      filters.status = status;
    }

    const result = getImages(filters);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/images/:id/download
 * Download original image file
 * Requires: Authentication
 */
router.get('/:id/download', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const image = get('SELECT * FROM images WHERE id = ?', [id]);

    if (!image) {
      return res.status(404).json({
        error: 'Image not found'
      });
    }

    const storagePaths = getStoragePaths();
    const filePath = path.join(storagePaths.images, image.stored_filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'Image file not found on disk'
      });
    }

    // Set headers for download
    res.setHeader('Content-Type', image.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${image.filename}"`);
    res.setHeader('Content-Length', image.file_size);

    // Stream file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/images/:id
 * Get single image with detections
 */
router.get('/:id', requireAuth, (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      throw createError('Invalid image ID', 400);
    }

    const image = getImageById(id);

    if (!image) {
      throw createError('Image not found', 404);
    }

    res.json(image);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/images/:id
 * Delete image and associated data
 * Requires: Admin role
 */
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const image = get('SELECT * FROM images WHERE id = ?', [id]);

    if (!image) {
      return res.status(404).json({
        error: 'Image not found'
      });
    }

    // Count detections that will be removed
    const { count } = get(
      'SELECT COUNT(*) as count FROM detections WHERE image_id = ?',
      [id]
    );

    // Delete from database (cascades to detections)
    run('DELETE FROM images WHERE id = ?', [id]);

    // Remove file from storage
    const storagePaths = getStoragePaths();
    const filePath = path.join(storagePaths.images, image.stored_filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove thumbnail if exists
    if (image.thumbnail_path) {
      const thumbnailPath = path.join(storagePaths.thumbnails, path.basename(image.thumbnail_path));
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
    }

    res.json({
      message: 'Image deleted successfully',
      id: parseInt(id),
      detections_removed: count
    });
  } catch (error) {
    next(error);
  }
});

// Multer error handler
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File too large',
        message: 'Maximum file size is 50MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: 'Maximum 50 files per upload'
      });
    }
    return res.status(400).json({
      error: 'Upload error',
      message: error.message
    });
  }

  next(error);
});

export default router;
