/**
 * Maps Page
 */

import { createElement } from '../utils/dom.js';
import { fetchMaps, fetchMapById } from '../services/api.js';

/**
 * Render maps page
 * @param {HTMLElement} container - Container element
 */
export async function renderMapsPage(container) {
  const pageContainer = createElement('div', { className: 'container maps-page' }, [
    createElement('h1', {}, 'Camera Locations Map'),
    createElement('div', { id: 'maps-content', className: 'loading' }, 'Loading maps...')
  ]);

  container.innerHTML = '';
  container.appendChild(pageContainer);

  await loadMaps();
}

async function loadMaps() {
  const mapsContent = document.getElementById('maps-content');
  if (!mapsContent) return;

  try {
    const { maps } = await fetchMaps();

    if (maps.length === 0) {
      mapsContent.innerHTML = '<p>No maps available</p>';
      mapsContent.classList.remove('loading');
      return;
    }

    // Load first map
    const map = await fetchMapById(maps[0].id);

    const content = createElement('div', {}, [
      createElement('div', { className: 'card' }, [
        createElement('h2', {}, map.name),
        createElement('p', {}, map.description),
        createElement('div', { className: 'mt-4' }, [
          createElement('h3', {}, 'Camera Locations'),
          createElement('ul', {},
            map.locations.map(loc =>
              createElement('li', {}, [
                createElement('strong', {}, loc.label),
                createElement('span', { className: 'text-muted' }, ` - ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`),
                createElement('span', {}, ` (${loc.image_count} images)`)
              ])
            )
          )
        ])
      ])
    ]);

    mapsContent.innerHTML = '';
    mapsContent.classList.remove('loading');
    mapsContent.appendChild(content);
  } catch (error) {
    console.error('Failed to load maps:', error);
    mapsContent.innerHTML = '<p class="text-error">Failed to load maps</p>';
    mapsContent.classList.remove('loading');
  }
}

export default { renderMapsPage };
