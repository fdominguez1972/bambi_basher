import express from 'express';
import { getDetections } from '../../services/detections.js';
import { requireAuth } from '../middleware/auth.js';
import { createError } from '../middleware/errorHandler.js';

const router = express.Router();

router.get('/', requireAuth, (req, res, next) => {
  try {
    const filters = {
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset) : undefined,
      image_id: req.query.image_id ? parseInt(req.query.image_id) : undefined,
      species_id: req.query.species_id ? parseInt(req.query.species_id) : undefined,
      min_confidence: req.query.min_confidence ? parseFloat(req.query.min_confidence) : undefined,
      start_date: req.query.start_date ? parseInt(req.query.start_date) : undefined,
      end_date: req.query.end_date ? parseInt(req.query.end_date) : undefined,
      sort: req.query.sort,
      order: req.query.order
    };

    const result = getDetections(filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
