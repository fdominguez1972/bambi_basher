import Docker from 'dockerode';
import path from 'path';
import fs from 'fs';
import { run, get, query, transaction } from '../db/database.js';
import { getStoragePaths } from './upload.js';

const docker = new Docker();

/**
 * Create a processing job
 * @param {Array<number>} imageIds - Array of image IDs to process
 * @param {number} userId - User ID initiating the job
 * @returns {Object} Created job
 */
export function createJob(imageIds, userId) {
  const now = Math.floor(Date.now() / 1000);

  const result = run(
    `INSERT INTO processing_jobs (
      initiated_by, status, total_images, processed_images,
      successful_images, failed_images, started_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, 'pending', imageIds.length, 0, 0, 0, now]
  );

  const jobId = result.lastInsertRowid;

  // Update images with job ID
  const placeholders = imageIds.map(() => '?').join(',');
  run(
    `UPDATE images SET processing_job_id = ?, processing_status = 'pending'
     WHERE id IN (${placeholders})`,
    [jobId, ...imageIds]
  );

  return {
    id: jobId,
    status: 'pending',
    total_images: imageIds.length,
    processed_images: 0
  };
}

/**
 * Start processing a job
 * @param {number} jobId - Job ID
 * @returns {Promise<void>}
 */
export async function startProcessing(jobId) {
  // Update job status
  run(
    'UPDATE processing_jobs SET status = ?, started_at = ? WHERE id = ?',
    ['running', Math.floor(Date.now() / 1000), jobId]
  );

  // Get images for this job
  const images = query(
    'SELECT * FROM images WHERE processing_job_id = ? AND processing_status = ?',
    [jobId, 'pending']
  );

  // Process in background
  processImages(jobId, images).catch(error => {
    console.error('Processing error:', error);
    updateJobStatus(jobId, 'failed', error.message);
  });
}

/**
 * Process images using Docker container
 * @param {number} jobId - Job ID
 * @param {Array} images - Images to process
 */
async function processImages(jobId, images) {
  const storagePaths = getStoragePaths();
  const useMockProcessing = process.env.USE_MOCK_PROCESSING === 'true';

  for (const image of images) {
    try {
      // Update image status
      run('UPDATE images SET processing_status = ? WHERE id = ?', ['processing', image.id]);

      if (useMockProcessing) {
        // Use mock processing for development
        await createMockDetections(image.id);
      } else {
        // Use Docker container for real processing
        await processImageWithDocker(image, storagePaths);
      }

      // Update image status
      run('UPDATE images SET processing_status = ? WHERE id = ?', ['completed', image.id]);

      // Update job progress
      updateJobProgress(jobId, true);
    } catch (error) {
      console.error(`Failed to process image ${image.id}:`, error);

      // Update image status
      run(
        'UPDATE images SET processing_status = ?, error_message = ? WHERE id = ?',
        ['failed', error.message, image.id]
      );

      // Update job progress
      updateJobProgress(jobId, false);
    }
  }

  // Mark job as completed
  const now = Math.floor(Date.now() / 1000);
  run(
    'UPDATE processing_jobs SET status = ?, completed_at = ? WHERE id = ?',
    ['completed', now, jobId]
  );
}

/**
 * Process a single image using Docker
 * @param {Object} image - Image record
 * @param {Object} storagePaths - Storage paths
 */
async function processImageWithDocker(image, storagePaths) {
  const imagePath = path.join(storagePaths.images, image.stored_filename);
  const outputDir = path.join(storagePaths.images, 'processing_output');
  const thumbnailDir = storagePaths.thumbnails;

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Docker container configuration
  const containerConfig = {
    Image: process.env.PROCESSOR_IMAGE || 'bambi-basher-processor:latest',
    HostConfig: {
      Binds: [
        `${path.resolve(imagePath)}:/data/input/${image.stored_filename}`,
        `${path.resolve(outputDir)}:/data/output`,
        `${path.resolve(thumbnailDir)}:/data/thumbnails`,
        `${path.resolve(process.env.MODEL_PATH || './models')}:/models`
      ],
      AutoRemove: true
    },
    Cmd: [
      '--input', `/data/input/${image.stored_filename}`,
      '--output', '/data/output',
      '--thumbnails', '/data/thumbnails',
      '--confidence', process.env.DETECTION_CONFIDENCE || '0.1'
    ]
  };

  try {
    // Create and start container
    const container = await docker.createContainer(containerConfig);
    await container.start();

    // Wait for completion
    const result = await container.wait();

    if (result.StatusCode !== 0) {
      throw new Error(`Docker container exited with code ${result.StatusCode}`);
    }

    // Read result JSON
    const baseName = path.parse(image.stored_filename).name;
    const resultPath = path.join(outputDir, `${baseName}_result.json`);

    if (!fs.existsSync(resultPath)) {
      throw new Error('Processing result file not found');
    }

    const resultData = JSON.parse(fs.readFileSync(resultPath, 'utf8'));

    // Update image record with thumbnail path
    if (resultData.thumbnail) {
      run(
        'UPDATE images SET thumbnail_path = ? WHERE id = ?',
        [resultData.thumbnail, image.id]
      );
    }

    // Create detection records
    await createDetectionsFromResult(image.id, resultData.detections);

    // Clean up result file
    fs.unlinkSync(resultPath);

  } catch (error) {
    console.error(`Docker processing error for image ${image.id}:`, error);
    throw error;
  }
}

/**
 * Create detection records from Docker result
 * @param {number} imageId - Image ID
 * @param {Array} detections - Detection data from Docker
 */
async function createDetectionsFromResult(imageId, detections) {
  const now = Math.floor(Date.now() / 1000);

  // Get species mapping for categories
  const speciesMap = {
    'animal': query('SELECT id FROM species WHERE common_name = ?', ['Unidentified Wildlife'])[0]?.id,
    'person': query('SELECT id FROM species WHERE common_name = ?', ['Human'])[0]?.id,
    'vehicle': query('SELECT id FROM species WHERE common_name = ?', ['Vehicle'])[0]?.id
  };

  for (const detection of detections) {
    // Map category to species
    let speciesId = speciesMap[detection.category];

    // Fall back to "Unknown" if no mapping found
    if (!speciesId) {
      const unknownSpecies = query('SELECT id FROM species WHERE common_name = ?', ['Unknown'])[0];
      speciesId = unknownSpecies?.id;
    }

    if (!speciesId) continue;

    // Insert detection
    run(
      `INSERT INTO detections (
        image_id, species_id, confidence,
        bounding_box_x, bounding_box_y, bounding_box_width, bounding_box_height,
        detected_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        imageId,
        speciesId,
        detection.confidence,
        detection.bbox.x,
        detection.bbox.y,
        detection.bbox.width,
        detection.bbox.height,
        now
      ]
    );
  }
}

/**
 * Create mock detections for testing
 * @param {number} imageId - Image ID
 */
async function createMockDetections(imageId) {
  // Get random species
  const species = query('SELECT id FROM species WHERE common_name != ? LIMIT 3', ['Unknown']);

  if (species.length === 0) return;

  const now = Math.floor(Date.now() / 1000);

  // Create 1-2 detections
  const detectionCount = 1 + Math.floor(Math.random() * 2);

  for (let i = 0; i < detectionCount; i++) {
    const randomSpecies = species[Math.floor(Math.random() * species.length)];
    const confidence = 0.7 + Math.random() * 0.3; // 0.7-1.0

    run(
      `INSERT INTO detections (
        image_id, species_id, confidence,
        bounding_box_x, bounding_box_y, bounding_box_width, bounding_box_height,
        detected_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        imageId,
        randomSpecies.id,
        confidence,
        Math.random() * 0.5, // x
        Math.random() * 0.5, // y
        0.2 + Math.random() * 0.3, // width
        0.2 + Math.random() * 0.3, // height
        now
      ]
    );
  }

  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
}

/**
 * Update job progress
 * @param {number} jobId - Job ID
 * @param {boolean} success - Whether image processed successfully
 */
function updateJobProgress(jobId, success) {
  const field = success ? 'successful_images' : 'failed_images';

  run(
    `UPDATE processing_jobs
     SET processed_images = processed_images + 1,
         ${field} = ${field} + 1
     WHERE id = ?`,
    [jobId]
  );
}

/**
 * Update job status
 * @param {number} jobId - Job ID
 * @param {string} status - New status
 * @param {string} errorLog - Optional error log
 */
function updateJobStatus(jobId, status, errorLog = null) {
  const now = Math.floor(Date.now() / 1000);

  if (errorLog) {
    run(
      'UPDATE processing_jobs SET status = ?, completed_at = ?, error_log = ? WHERE id = ?',
      [status, now, errorLog, jobId]
    );
  } else {
    run(
      'UPDATE processing_jobs SET status = ?, completed_at = ? WHERE id = ?',
      [status, now, jobId]
    );
  }
}

/**
 * Get job by ID
 * @param {number} jobId - Job ID
 * @returns {Object|null} Job details
 */
export function getJob(jobId) {
  return get('SELECT * FROM processing_jobs WHERE id = ?', [jobId]);
}

/**
 * Get all jobs
 * @param {Object} filters - Filter options
 * @returns {Object} Jobs list with pagination
 */
export function getJobs(filters = {}) {
  const { limit = 20, offset = 0, status, user_id } = filters;

  let whereConditions = [];
  let params = [];

  if (status) {
    whereConditions.push('status = ?');
    params.push(status);
  }

  if (user_id) {
    whereConditions.push('initiated_by = ?');
    params.push(user_id);
  }

  const whereClause = whereConditions.length > 0
    ? 'WHERE ' + whereConditions.join(' AND ')
    : '';

  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM processing_jobs ${whereClause}`;
  const { total } = get(countQuery, params);

  // Get jobs
  const jobsQuery = `
    SELECT * FROM processing_jobs
    ${whereClause}
    ORDER BY started_at DESC
    LIMIT ? OFFSET ?
  `;

  const jobs = query(jobsQuery, [...params, limit, offset]);

  return { jobs, total, limit, offset };
}

export default {
  createJob,
  startProcessing,
  getJob,
  getJobs
};
