import { query } from '../db/database.js';

/**
 * Get paginated list of detections with filters
 * @param {Object} filters - Filter options
 * @returns {Object} Detections with pagination info
 */
export function getDetections(filters = {}) {
  const {
    limit = 20,
    offset = 0,
    image_id,
    species_id,
    min_confidence,
    start_date,
    end_date,
    sort = 'detected_at',
    order = 'desc'
  } = filters;

  let whereConditions = [];
  let params = [];

  if (image_id) {
    whereConditions.push('d.image_id = ?');
    params.push(image_id);
  }

  if (species_id) {
    whereConditions.push('d.species_id = ?');
    params.push(species_id);
  }

  if (min_confidence) {
    whereConditions.push('d.confidence >= ?');
    params.push(min_confidence);
  }

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

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM detections d
    ${whereClause}
  `;

  const result = query(countQuery, params);
  const total = result[0]?.total || 0;

  // Get detections
  const validSorts = ['detected_at', 'confidence'];
  const sortColumn = validSorts.includes(sort) ? sort : 'detected_at';
  const orderDir = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const detectionsQuery = `
    SELECT
      d.id,
      d.image_id,
      d.confidence,
      d.bounding_box_x,
      d.bounding_box_y,
      d.bounding_box_width,
      d.bounding_box_height,
      d.detected_at,
      s.id as species_id,
      s.common_name,
      s.scientific_name,
      s.category
    FROM detections d
    LEFT JOIN species s ON d.species_id = s.id
    ${whereClause}
    ORDER BY d.${sortColumn} ${orderDir}
    LIMIT ? OFFSET ?
  `;

  const detections = query(detectionsQuery, [...params, limit, offset]);

  const transformedDetections = detections.map(d => ({
    id: d.id,
    image_id: d.image_id,
    species: d.species_id ? {
      id: d.species_id,
      common_name: d.common_name,
      scientific_name: d.scientific_name,
      category: d.category
    } : null,
    confidence: d.confidence,
    bounding_box: {
      x: d.bounding_box_x,
      y: d.bounding_box_y,
      width: d.bounding_box_width,
      height: d.bounding_box_height
    },
    detected_at: d.detected_at
  }));

  return {
    detections: transformedDetections,
    total,
    limit,
    offset
  };
}

export default { getDetections };
