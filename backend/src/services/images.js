import { query, get } from '../db/database.js';

/**
 * Get paginated list of images with filters
 * @param {Object} filters - Filter options
 * @param {number} filters.limit - Max results
 * @param {number} filters.offset - Offset for pagination
 * @param {number} filters.start_date - Start date (Unix timestamp)
 * @param {number} filters.end_date - End date (Unix timestamp)
 * @param {number} filters.species_id - Filter by species
 * @param {number} filters.location_id - Filter by camera location
 * @param {string} filters.status - Filter by processing status
 * @returns {Object} Images with pagination info
 */
export function getImages(filters = {}) {
  const {
    limit = 20,
    offset = 0,
    start_date,
    end_date,
    species_id,
    location_id,
    status
  } = filters;

  // Build query
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

  if (species_id) {
    whereConditions.push(`EXISTS (
      SELECT 1 FROM detections d
      WHERE d.image_id = i.id AND d.species_id = ?
    )`);
    params.push(species_id);
  }

  if (location_id) {
    whereConditions.push('i.camera_location_id = ?');
    params.push(location_id);
  }

  if (status) {
    whereConditions.push('i.processing_status = ?');
    params.push(status);
  }

  const whereClause = whereConditions.length > 0
    ? 'WHERE ' + whereConditions.join(' AND ')
    : '';

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM images i
    ${whereClause}
  `;

  const { total } = get(countQuery, params);

  // Get images
  const imagesQuery = `
    SELECT
      i.id,
      i.filename,
      i.captured_at,
      i.uploaded_at,
      i.thumbnail_path,
      i.processing_status,
      cl.id as location_id,
      cl.label as location_label,
      cl.latitude as location_latitude,
      cl.longitude as location_longitude
    FROM images i
    LEFT JOIN camera_locations cl ON i.camera_location_id = cl.id
    ${whereClause}
    ORDER BY i.captured_at DESC
    LIMIT ? OFFSET ?
  `;

  const images = query(imagesQuery, [...params, limit, offset]);

  // Transform results
  const transformedImages = images.map(img => ({
    id: img.id,
    filename: img.filename,
    captured_at: img.captured_at,
    uploaded_at: img.uploaded_at,
    thumbnail_path: img.thumbnail_path,
    processing_status: img.processing_status,
    camera_location: img.location_id ? {
      id: img.location_id,
      label: img.location_label,
      latitude: img.location_latitude,
      longitude: img.location_longitude
    } : null
  }));

  return {
    images: transformedImages,
    total,
    limit,
    offset
  };
}

/**
 * Get single image by ID with detections
 * @param {number} id - Image ID
 * @returns {Object|null} Image with detections
 */
export function getImageById(id) {
  const imageQuery = `
    SELECT
      i.*,
      cl.id as location_id,
      cl.label as location_label,
      cl.latitude as location_latitude,
      cl.longitude as location_longitude
    FROM images i
    LEFT JOIN camera_locations cl ON i.camera_location_id = cl.id
    WHERE i.id = ?
  `;

  const image = get(imageQuery, [id]);

  if (!image) {
    return null;
  }

  // Get detections
  const detectionsQuery = `
    SELECT
      d.id,
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
    WHERE d.image_id = ?
    ORDER BY d.confidence DESC
  `;

  const detections = query(detectionsQuery, [id]);

  // Transform detections
  const transformedDetections = detections.map(d => ({
    id: d.id,
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
    id: image.id,
    filename: image.filename,
    stored_filename: image.stored_filename,
    file_size: image.file_size,
    mime_type: image.mime_type,
    captured_at: image.captured_at,
    uploaded_at: image.uploaded_at,
    processing_status: image.processing_status,
    camera_location: image.location_id ? {
      id: image.location_id,
      label: image.location_label,
      latitude: image.location_latitude,
      longitude: image.location_longitude
    } : null,
    detections: transformedDetections
  };
}

export default {
  getImages,
  getImageById
};
