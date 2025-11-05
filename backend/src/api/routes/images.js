import express from 'express';
import { getImages, getImageById } from '../../services/images.js';
import { requireAuth } from '../middleware/auth.js';
import { createError } from '../middleware/errorHandler.js';

const router = express.Router();

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

export default router;
