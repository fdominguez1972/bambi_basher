/**
 * Statistics Page
 */

import { createElement } from '../utils/dom.js';
import { fetchStatisticsSummary, fetchSpeciesFrequency } from '../services/api.js';
import { formatNumber } from '../utils/formatters.js';

/**
 * Render statistics page
 * @param {HTMLElement} container - Container element
 */
export async function renderStatisticsPage(container) {
  const pageContainer = createElement('div', { className: 'container statistics-page' }, [
    createElement('h1', {}, 'Statistics & Insights'),
    createElement('div', { id: 'stats-content', className: 'loading' }, 'Loading statistics...')
  ]);

  container.innerHTML = '';
  container.appendChild(pageContainer);

  await loadStatistics();
}

async function loadStatistics() {
  const statsContent = document.getElementById('stats-content');
  if (!statsContent) return;

  try {
    const [summary, speciesFreq] = await Promise.all([
      fetchStatisticsSummary(),
      fetchSpeciesFrequency({ limit: 10 })
    ]);

    const content = createElement('div', {}, [
      // Summary cards
      createElement('div', { className: 'stats-summary grid grid-cols-4' }, [
        createStatCard('Total Images', formatNumber(summary.total_images)),
        createStatCard('Total Detections', formatNumber(summary.total_detections)),
        createStatCard('Unique Species', formatNumber(summary.unique_species)),
        createStatCard('Completed', formatNumber(summary.processing_status.completed))
      ]),

      // Species frequency
      createElement('div', { className: 'card mt-4' }, [
        createElement('h2', {}, 'Top Species'),
        createElement('div', { className: 'species-frequency' },
          speciesFreq.species_frequency.map(s =>
            createElement('div', { className: 'species-freq-item' }, [
              createElement('span', {}, s.common_name),
              createElement('span', { className: 'font-bold' }, `${s.detection_count} (${s.percentage}%)`)
            ])
          )
        )
      ])
    ]);

    statsContent.innerHTML = '';
    statsContent.classList.remove('loading');
    statsContent.appendChild(content);
  } catch (error) {
    console.error('Failed to load statistics:', error);
    statsContent.innerHTML = '<p class="text-error">Failed to load statistics</p>';
    statsContent.classList.remove('loading');
  }
}

function createStatCard(label, value) {
  return createElement('div', { className: 'card text-center p-4' }, [
    createElement('div', { className: 'text-3xl font-bold text-primary' }, value),
    createElement('div', { className: 'text-sm text-muted mt-2' }, label)
  ]);
}

export default { renderStatisticsPage };
