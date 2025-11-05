/**
 * Image Filters Component
 */

import { createElement } from '../../utils/dom.js';
import { fetchSpecies, fetchMapLocations } from '../../services/api.js';

/**
 * Create filters component
 * @param {Object} currentFilters - Current filter values
 * @param {Function} onFilterChange - Filter change handler
 * @returns {HTMLElement}
 */
export function createFilters(currentFilters, onFilterChange) {
  const filtersContainer = createElement('div', { className: 'filters-container card' }, [
    createElement('h3', {}, 'Filters'),

    createElement('form', {
      className: 'filters-form',
      id: 'image-filters-form'
    }, [
      // Date range
      createElement('div', { className: 'filters-group' }, [
        createElement('h4', {}, 'Date Range'),
        createElement('div', { className: 'filters-row' }, [
          createElement('div', { className: 'form-group' }, [
            createElement('label', { for: 'start-date' }, 'From'),
            createElement('input', {
              type: 'date',
              id: 'start-date',
              name: 'start_date',
              value: currentFilters.start_date || ''
            })
          ]),
          createElement('div', { className: 'form-group' }, [
            createElement('label', { for: 'end-date' }, 'To'),
            createElement('input', {
              type: 'date',
              id: 'end-date',
              name: 'end_date',
              value: currentFilters.end_date || ''
            })
          ])
        ])
      ]),

      // Species filter
      createElement('div', { className: 'filters-group' }, [
        createElement('h4', {}, 'Species'),
        createElement('select', {
          id: 'species-filter',
          name: 'species_id',
          className: 'form-control'
        }, [
          createElement('option', { value: '' }, 'All Species')
          // Options will be populated by loadSpeciesOptions
        ])
      ]),

      // Location filter
      createElement('div', { className: 'filters-group' }, [
        createElement('h4', {}, 'Location'),
        createElement('select', {
          id: 'location-filter',
          name: 'location_id',
          className: 'form-control'
        }, [
          createElement('option', { value: '' }, 'All Locations')
          // Options will be populated by loadLocationOptions
        ])
      ]),

      // Status filter
      createElement('div', { className: 'filters-group' }, [
        createElement('h4', {}, 'Status'),
        createElement('select', {
          id: 'status-filter',
          name: 'status',
          className: 'form-control',
          value: currentFilters.status || ''
        }, [
          createElement('option', { value: '' }, 'All'),
          createElement('option', { value: 'completed' }, 'Completed'),
          createElement('option', { value: 'pending' }, 'Pending'),
          createElement('option', { value: 'processing' }, 'Processing'),
          createElement('option', { value: 'failed' }, 'Failed')
        ])
      ]),

      // Action buttons
      createElement('div', { className: 'filters-actions' }, [
        createElement('button', {
          type: 'submit',
          className: 'btn-primary'
        }, 'Apply Filters'),
        createElement('button', {
          type: 'button',
          className: 'btn-secondary',
          onClick: () => handleReset(onFilterChange)
        }, 'Reset')
      ])
    ])
  ]);

  // Attach submit handler
  const form = filtersContainer.querySelector('#image-filters-form');
  form.addEventListener('submit', (e) => handleSubmit(e, onFilterChange));

  // Load options
  loadSpeciesOptions();
  loadLocationOptions();

  // Set current filter values
  if (currentFilters.species_id) {
    setTimeout(() => {
      const select = filtersContainer.querySelector('#species-filter');
      if (select) select.value = currentFilters.species_id;
    }, 100);
  }

  if (currentFilters.location_id) {
    setTimeout(() => {
      const select = filtersContainer.querySelector('#location-filter');
      if (select) select.value = currentFilters.location_id;
    }, 100);
  }

  return filtersContainer;
}

/**
 * Handle filter form submission
 */
function handleSubmit(e, onFilterChange) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const filters = {};

  // Date range
  const startDate = formData.get('start_date');
  const endDate = formData.get('end_date');

  if (startDate) {
    filters.start_date = Math.floor(new Date(startDate).getTime() / 1000);
  }

  if (endDate) {
    filters.end_date = Math.floor(new Date(endDate + 'T23:59:59').getTime() / 1000);
  }

  // Species
  const speciesId = formData.get('species_id');
  if (speciesId) {
    filters.species_id = parseInt(speciesId);
  }

  // Location
  const locationId = formData.get('location_id');
  if (locationId) {
    filters.location_id = parseInt(locationId);
  }

  // Status
  const status = formData.get('status');
  if (status) {
    filters.status = status;
  }

  onFilterChange(filters);
}

/**
 * Handle reset
 */
function handleReset(onFilterChange) {
  const form = document.getElementById('image-filters-form');
  if (form) {
    form.reset();
  }
  onFilterChange({});
}

/**
 * Load species options
 */
async function loadSpeciesOptions() {
  try {
    const { species } = await fetchSpecies();

    const select = document.getElementById('species-filter');
    if (!select) return;

    // Add species options
    species.forEach(s => {
      const option = createElement('option', {
        value: s.id.toString()
      }, s.common_name);
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Failed to load species:', error);
  }
}

/**
 * Load location options
 */
async function loadLocationOptions() {
  try {
    // Get first map and its locations (simplified - in production would handle multiple maps)
    const { maps } = await import('../../services/api.js').then(m => m.fetchMaps());

    if (maps.length === 0) return;

    const { locations } = await fetchMapLocations(maps[0].id);

    const select = document.getElementById('location-filter');
    if (!select) return;

    // Add location options
    locations.forEach(loc => {
      const option = createElement('option', {
        value: loc.id.toString()
      }, loc.label);
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Failed to load locations:', error);
  }
}

export default { createFilters };
