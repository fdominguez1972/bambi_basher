import express from 'express';
import { getSummary, getSpeciesFrequency, getTemporalPatterns } from '../../services/statistics.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/summary', requireAuth, (req, res, next) => {
  try {
    const filters = {
      start_date: req.query.start_date ? parseInt(req.query.start_date) : undefined,
      end_date: req.query.end_date ? parseInt(req.query.end_date) : undefined
    };

    const result = getSummary(filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/species-frequency', requireAuth, (req, res, next) => {
  try {
    const filters = {
      start_date: req.query.start_date ? parseInt(req.query.start_date) : undefined,
      end_date: req.query.end_date ? parseInt(req.query.end_date) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    const result = getSpeciesFrequency(filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/temporal-patterns', requireAuth, (req, res, next) => {
  try {
    const filters = {
      group_by: req.query.group_by || 'hour',
      start_date: req.query.start_date ? parseInt(req.query.start_date) : undefined,
      end_date: req.query.end_date ? parseInt(req.query.end_date) : undefined,
      species_id: req.query.species_id ? parseInt(req.query.species_id) : undefined
    };

    const result = getTemporalPatterns(filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
