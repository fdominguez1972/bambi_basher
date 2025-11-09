import { query, get } from '../db/database.js';

/**
 * Get all maps (filtered by user role)
 * @param {Object} user - Current user
 * @returns {Object} Maps list
 */
export function getMaps(user) {
  // Admins see all maps, regular users see only shared maps
  const whereClause = user.role === 'admin'
    ? ''
    : 'WHERE m.is_shared = 1';

  const mapsQuery = `
    SELECT
      m.id,
      m.name,
      m.description,
      m.is_shared,
      m.created_by,
      COUNT(cl.id) as location_count
    FROM maps m
    LEFT JOIN camera_locations cl ON m.id = cl.map_id
    ${whereClause}
    GROUP BY m.id
    ORDER BY m.name
  `;

  const maps = query(mapsQuery);

  return { maps };
}

/**
 * Get map by ID with camera locations
 * @param {number} id - Map ID
 * @param {Object} user - Current user
 * @returns {Object|null} Map with locations
 */
export function getMapById(id, user) {
  const mapQuery = `
    SELECT *
    FROM maps
    WHERE id = ?
  `;

  const map = get(mapQuery, [id]);

  if (!map) {
    return null;
  }

  // Check access: admins can see all, users can only see shared maps
  if (user.role !== 'admin' && map.is_shared !== 1) {
    return { error: 'Forbidden', status: 403 };
  }

  // Get locations
  const locationsQuery = `
    SELECT
      cl.id,
      cl.label,
      cl.latitude,
      cl.longitude,
      COUNT(i.id) as image_count,
      MAX(i.captured_at) as latest_capture
    FROM camera_locations cl
    LEFT JOIN images i ON cl.id = i.camera_location_id
    WHERE cl.map_id = ?
    GROUP BY cl.id
  `;

  const locations = query(locationsQuery, [id]);

  return {
    id: map.id,
    name: map.name,
    description: map.description,
    is_shared: map.is_shared,
    created_by: map.created_by,
    locations
  };
}

/**
 * Get locations for a map
 * @param {number} mapId - Map ID
 * @param {Object} user - Current user
 * @returns {Object|null} Locations list
 */
export function getMapLocations(mapId, user) {
  // First check if user has access to this map
  const mapQuery = `SELECT is_shared FROM maps WHERE id = ?`;
  const map = get(mapQuery, [mapId]);

  if (!map) {
    return null;
  }

  if (user.role !== 'admin' && map.is_shared !== 1) {
    return { error: 'Forbidden', status: 403 };
  }

  const locationsQuery = `
    SELECT
      cl.id,
      cl.label,
      cl.latitude,
      cl.longitude,
      COUNT(i.id) as image_count,
      MAX(i.captured_at) as latest_capture
    FROM camera_locations cl
    LEFT JOIN images i ON cl.id = i.camera_location_id
    WHERE cl.map_id = ?
    GROUP BY cl.id
  `;

  const locations = query(locationsQuery, [mapId]);

  return { locations };
}

export default {
  getMaps,
  getMapById,
  getMapLocations
};
