/**
 * Gallery Page
 */

import { createElement } from '../utils/dom.js';
import { createGallery } from '../components/images/gallery.js';
import { createFilters } from '../components/images/filters.js';
import { showImageDetail } from '../components/images/image-detail.js';
import { fetchImages } from '../services/api.js';
import '../components/images/gallery.css';

let currentFilters = {};
let currentPage = 1;
const ITEMS_PER_PAGE = 20;

/**
 * Render gallery page
 * @param {HTMLElement} container - Container element
 */
export async function renderGalleryPage(container) {
  const pageContainer = createElement('div', { className: 'container gallery-page' }, [
    createElement('h1', {}, 'Wildlife Gallery'),

    createElement('div', { className: 'gallery-layout' }, [
      // Filters sidebar
      createElement('aside', { className: 'gallery-sidebar' }, [
        createFilters(currentFilters, handleFilterChange)
      ]),

      // Gallery content
      createElement('main', { className: 'gallery-content' }, [
        createElement('div', { id: 'gallery-container', className: 'loading' }, 'Loading images...')
      ])
    ])
  ]);

  container.innerHTML = '';
  container.appendChild(pageContainer);

  // Load images
  await loadImages();
}

/**
 * Load images with current filters
 */
async function loadImages() {
  const galleryContainer = document.getElementById('gallery-container');
  if (!galleryContainer) return;

  galleryContainer.classList.add('loading');

  try {
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;

    const result = await fetchImages({
      ...currentFilters,
      limit: ITEMS_PER_PAGE,
      offset
    });

    const gallery = createGallery(
      result.images,
      result,
      handleImageClick,
      handlePageChange
    );

    galleryContainer.innerHTML = '';
    galleryContainer.classList.remove('loading');
    galleryContainer.appendChild(gallery);
  } catch (error) {
    console.error('Failed to load images:', error);
    galleryContainer.innerHTML = '<p class="text-error">Failed to load images. Please try again.</p>';
    galleryContainer.classList.remove('loading');
  }
}

/**
 * Handle filter change
 */
async function handleFilterChange(filters) {
  currentFilters = filters;
  currentPage = 1; // Reset to first page
  await loadImages();
}

/**
 * Handle page change
 */
async function handlePageChange(page) {
  currentPage = page;
  await loadImages();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Handle image click
 */
function handleImageClick(image) {
  showImageDetail(image.id);
}

export default { renderGalleryPage };
