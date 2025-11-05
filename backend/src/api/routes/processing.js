/**
 * Processing Jobs API Routes
 */

import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { createJob, startProcessing, getJob, getJobs } from '../../services/processing.js';
import { query } from '../../db/database.js';

const router = express.Router();

/**
 * POST /api/processing/jobs
 * Create a new processing job
 * Requires: Admin role
 * Body: { imageIds: number[], autoStart?: boolean }
 */
router.post('/jobs', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { imageIds, autoStart = false } = req.body;
    const userId = req.user.id;

    // Validate imageIds
    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({
        error: 'Invalid image IDs',
        message: 'imageIds must be a non-empty array'
      });
    }

    // Validate all imageIds are numbers
    if (!imageIds.every(id => typeof id === 'number' && id > 0)) {
      return res.status(400).json({
        error: 'Invalid image IDs',
        message: 'All image IDs must be positive numbers'
      });
    }

    // Check if images exist
    const placeholders = imageIds.map(() => '?').join(',');
    const images = query(
      `SELECT id, processing_status FROM images WHERE id IN (${placeholders})`,
      imageIds
    );

    if (images.length !== imageIds.length) {
      const foundIds = images.map(img => img.id);
      const missingIds = imageIds.filter(id => !foundIds.includes(id));
      return res.status(404).json({
        error: 'Images not found',
        invalid_ids: missingIds
      });
    }

    // Check if any images are already processing
    const alreadyProcessing = images.filter(
      img => img.processing_status !== 'pending' && img.processing_status !== 'failed'
    );

    if (alreadyProcessing.length > 0) {
      return res.status(400).json({
        error: 'Images already processing',
        message: 'Some images are already being processed or have been completed',
        image_ids: alreadyProcessing.map(img => img.id)
      });
    }

    // Create job
    const job = createJob(imageIds, userId);

    // Optionally start processing
    if (autoStart) {
      await startProcessing(job.id);
      job.status = 'running';
    }

    res.status(201).json(job);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/processing/jobs/:id/start
 * Start a pending processing job
 * Requires: Admin role
 */
router.post('/jobs/:id/start', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const jobId = parseInt(id);

    if (isNaN(jobId)) {
      return res.status(400).json({
        error: 'Invalid job ID'
      });
    }

    const job = getJob(jobId);

    if (!job) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }

    if (job.status !== 'pending') {
      return res.status(400).json({
        error: 'Job cannot be started',
        message: `Job is in '${job.status}' status. Only 'pending' jobs can be started.`,
        current_status: job.status
      });
    }

    // Start processing
    await startProcessing(jobId);

    res.json({
      id: jobId,
      status: 'running',
      message: 'Processing started'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/processing/jobs
 * List processing jobs with pagination
 * Requires: Authentication
 * Query params: limit, offset, status, user_id (admin only)
 */
router.get('/jobs', requireAuth, async (req, res, next) => {
  try {
    const {
      limit = '20',
      offset = '0',
      status,
      user_id
    } = req.query;

    const filters = {
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    // Add status filter if provided
    if (status) {
      const validStatuses = ['pending', 'running', 'completed', 'failed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
          message: `Status must be one of: ${validStatuses.join(', ')}`
        });
      }
      filters.status = status;
    }

    // Regular users can only see their own jobs
    if (req.user.role !== 'admin') {
      filters.user_id = req.user.id;
    } else if (user_id) {
      // Admins can optionally filter by user_id
      filters.user_id = parseInt(user_id);
    }

    const result = getJobs(filters);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/processing/jobs/:id
 * Get job details
 * Requires: Authentication
 * Query params: includeImages=true to include related images
 */
router.get('/jobs/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { includeImages } = req.query;
    const jobId = parseInt(id);

    if (isNaN(jobId)) {
      return res.status(400).json({
        error: 'Invalid job ID'
      });
    }

    const job = getJob(jobId);

    if (!job) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }

    // Regular users can only view their own jobs
    if (req.user.role !== 'admin' && job.initiated_by !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only view your own jobs'
      });
    }

    // Optionally include related images
    if (includeImages === 'true') {
      const images = query(
        `SELECT id, filename, stored_filename, processing_status, error_message
         FROM images WHERE processing_job_id = ?
         ORDER BY id`,
        [jobId]
      );
      job.images = images;
    }

    res.json(job);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/processing/jobs/:id
 * Cancel or delete a processing job
 * Requires: Admin role
 */
router.delete('/jobs/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const jobId = parseInt(id);

    if (isNaN(jobId)) {
      return res.status(400).json({
        error: 'Invalid job ID'
      });
    }

    const { get, run } = await import('../../db/database.js');
    const job = get('SELECT * FROM processing_jobs WHERE id = ?', [jobId]);

    if (!job) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }

    if (job.status === 'running') {
      // Cancel running job
      run(
        'UPDATE processing_jobs SET status = ?, completed_at = ? WHERE id = ?',
        ['cancelled', Math.floor(Date.now() / 1000), jobId]
      );

      // Update image statuses back to pending
      run(
        'UPDATE images SET processing_status = ? WHERE processing_job_id = ? AND processing_status = ?',
        ['pending', jobId, 'processing']
      );

      return res.json({
        message: 'Job cancelled',
        id: jobId,
        status: 'cancelled'
      });
    } else {
      // Delete completed/failed/cancelled jobs
      run('DELETE FROM processing_jobs WHERE id = ?', [jobId]);

      return res.json({
        message: 'Job deleted',
        id: jobId
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
