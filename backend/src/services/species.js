import { query, get } from '../db/database.js';

/**
 * Get all species with optional filters
 * @param {Object} filters - Filter options
 * @returns {Object} Species list
 */
export function getSpecies(filters = {}) {
  const { category, search, sort = 'name' } = filters;

  let whereConditions = [];
  let params = [];

  if (category) {
    whereConditions.push('s.category = ?');
    params.push(category);
  }

  if (search) {
    whereConditions.push('(s.common_name LIKE ? OR s.scientific_name LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const whereClause = whereConditions.length > 0
    ? 'WHERE ' + whereConditions.join(' AND ')
    : '';

  const sortColumn = sort === 'category' ? 's.category, s.common_name' : 's.common_name';

  const speciesQuery = `
    SELECT
      s.id,
      s.common_name,
      s.scientific_name,
      s.category,
      COUNT(d.id) as detection_count
    FROM species s
    LEFT JOIN detections d ON s.id = d.species_id
    ${whereClause}
    GROUP BY s.id
    ORDER BY ${sortColumn}
  `;

  const species = query(speciesQuery, params);

  return { species };
}

/**
 * Get species by ID with detection count
 * @param {number} id - Species ID
 * @returns {Object|null} Species details
 */
export function getSpeciesById(id) {
  const speciesQuery = `
    SELECT
      s.id,
      s.common_name,
      s.scientific_name,
      s.category,
      COUNT(d.id) as detection_count
    FROM species s
    LEFT JOIN detections d ON s.id = d.species_id
    WHERE s.id = ?
    GROUP BY s.id
  `;

  return get(speciesQuery, [id]);
}

export default { getSpecies, getSpeciesById };
