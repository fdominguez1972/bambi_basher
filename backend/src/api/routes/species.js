import express from 'express';
import { getSpecies, getSpeciesById } from '../../services/species.js';
import { requireAuth } from '../middleware/auth.js';
import { createError } from '../middleware/errorHandler.js';

const router = express.Router();

router.get('/', requireAuth, (req, res, next) => {
  try {
    const filters = {
      category: req.query.category,
      search: req.query.search,
      sort: req.query.sort
    };

    const result = getSpecies(filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireAuth, (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw createError('Invalid species ID', 400);
    }

    const species = getSpeciesById(id);
    if (!species) {
      throw createError('Species not found', 404);
    }

    res.json(species);
  } catch (error) {
    next(error);
  }
});

export default router;
