import { query, get } from '../db/database.js';

/**
 * Get summary statistics
 * @param {Object} filters - Filter options
 * @returns {Object} Summary statistics
 */
export function getSummary(filters = {}) {
  const { start_date, end_date } = filters;

  let whereConditions = [];
  let params = [];

  if (start_date) {
    whereConditions.push('i.captured_at >= ?');
    params.push(start_date);
  }

  if (end_date) {
    whereConditions.push('i.captured_at <= ?');
    params.push(end_date);
  }

  const whereClause = whereConditions.length > 0
    ? 'WHERE ' + whereConditions.join(' AND ')
    : '';

  // Total images
  const totalImagesQuery = `
    SELECT COUNT(*) as total_images
    FROM images i
    ${whereClause}
  `;

  const { total_images } = get(totalImagesQuery, params);

  // Total detections
  const totalDetectionsQuery = `
    SELECT COUNT(*) as total_detections
    FROM detections d
    JOIN images i ON d.image_id = i.id
    ${whereClause}
  `;

  const { total_detections } = get(totalDetectionsQuery, params);

  // Unique species
  const uniqueSpeciesQuery = `
    SELECT COUNT(DISTINCT d.species_id) as unique_species
    FROM detections d
    JOIN images i ON d.image_id = i.id
    ${whereClause}
  `;

  const { unique_species } = get(uniqueSpeciesQuery, params);

  // Latest capture
  const latestCaptureQuery = `
    SELECT MAX(captured_at) as latest_capture
    FROM images i
    ${whereClause}
  `;

  const { latest_capture } = get(latestCaptureQuery, params);

  // Processing status breakdown
  const processingStatusQuery = `
    SELECT
      processing_status,
      COUNT(*) as count
    FROM images i
    ${whereClause}
    GROUP BY processing_status
  `;

  const statusResults = query(processingStatusQuery, params);

  const processing_status = {
    completed: 0,
    pending: 0,
    processing: 0,
    failed: 0
  };

  statusResults.forEach(row => {
    processing_status[row.processing_status] = row.count;
  });

  return {
    total_images,
    total_detections,
    unique_species,
    latest_capture,
    processing_status
  };
}

/**
 * Get species frequency statistics
 * @param {Object} filters - Filter options
 * @returns {Object} Species frequency data
 */
export function getSpeciesFrequency(filters = {}) {
  const { start_date, end_date, limit = 10 } = filters;

  let whereConditions = [];
  let params = [];

  if (start_date) {
    whereConditions.push('d.detected_at >= ?');
    params.push(start_date);
  }

  if (end_date) {
    whereConditions.push('d.detected_at <= ?');
    params.push(end_date);
  }

  const whereClause = whereConditions.length > 0
    ? 'WHERE ' + whereConditions.join(' AND ')
    : '';

  // Get total detections for percentage calculation
  const totalQuery = `
    SELECT COUNT(*) as total
    FROM detections d
    ${whereClause}
  `;

  const { total } = get(totalQuery, params);

  // Get species frequency
  const frequencyQuery = `
    SELECT
      s.id as species_id,
      s.common_name,
      s.scientific_name,
      COUNT(d.id) as detection_count,
      ROUND(COUNT(d.id) * 100.0 / ?, 2) as percentage
    FROM detections d
    JOIN species s ON d.species_id = s.id
    ${whereClause}
    GROUP BY s.id
    ORDER BY detection_count DESC
    LIMIT ?
  `;

  const species_frequency = query(frequencyQuery, [total || 1, ...params, limit]);

  return { species_frequency };
}

/**
 * Get temporal patterns
 * @param {Object} filters - Filter options
 * @returns {Object} Temporal pattern data
 */
export function getTemporalPatterns(filters = {}) {
  const { group_by = 'hour', start_date, end_date, species_id } = filters;

  let whereConditions = [];
  let params = [];

  if (start_date) {
    whereConditions.push('d.detected_at >= ?');
    params.push(start_date);
  }

  if (end_date) {
    whereConditions.push('d.detected_at <= ?');
    params.push(end_date);
  }

  if (species_id) {
    whereConditions.push('d.species_id = ?');
    params.push(species_id);
  }

  const whereClause = whereConditions.length > 0
    ? 'WHERE ' + whereConditions.join(' AND ')
    : '';

  // Determine time grouping
  let timeFormat;
  switch (group_by) {
    case 'hour':
      timeFormat = "strftime('%Y-%m-%d %H:00', datetime(d.detected_at, 'unixepoch'))";
      break;
    case 'day':
      timeFormat = "strftime('%Y-%m-%d', datetime(d.detected_at, 'unixepoch'))";
      break;
    case 'week':
      timeFormat = "strftime('%Y-W%W', datetime(d.detected_at, 'unixepoch'))";
      break;
    case 'month':
      timeFormat = "strftime('%Y-%m', datetime(d.detected_at, 'unixepoch'))";
      break;
    default:
      timeFormat = "strftime('%Y-%m-%d', datetime(d.detected_at, 'unixepoch'))";
  }

  const patternsQuery = `
    SELECT
      ${timeFormat} as time_bucket,
      COUNT(d.id) as detection_count
    FROM detections d
    ${whereClause}
    GROUP BY time_bucket
    ORDER BY time_bucket
  `;

  const patterns = query(patternsQuery, params);

  return { patterns };
}

export default {
  getSummary,
  getSpeciesFrequency,
  getTemporalPatterns
};
