import express from 'express';
import { getMaps, getMapById, getMapLocations } from '../../services/maps.js';
import { requireAuth } from '../middleware/auth.js';
import { createError } from '../middleware/errorHandler.js';

const router = express.Router();

router.get('/', requireAuth, (req, res, next) => {
  try {
    const result = getMaps(req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireAuth, (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw createError('Invalid map ID', 400);
    }

    const result = getMapById(id, req.user);

    if (!result) {
      throw createError('Map not found', 404);
    }

    if (result.error) {
      throw createError(result.error, result.status);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:id/locations', requireAuth, (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw createError('Invalid map ID', 400);
    }

    const result = getMapLocations(id, req.user);

    if (!result) {
      throw createError('Map not found', 404);
    }

    if (result.error) {
      throw createError(result.error, result.status);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
