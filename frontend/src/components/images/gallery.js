/**
 * Image Gallery Component
 */

import { createElement } from '../../utils/dom.js';
import { formatDate, formatRelativeTime } from '../../utils/formatters.js';
import eventBus, { EVENTS } from '../../services/event-bus.js';

/**
 * Create gallery component
 * @param {Array} images - Array of image objects
 * @param {Object} pagination - Pagination info
 * @param {Function} onImageClick - Image click handler
 * @param {Function} onPageChange - Page change handler
 * @returns {HTMLElement}
 */
export function createGallery(images, pagination, onImageClick, onPageChange) {
  const { total, limit, offset } = pagination;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return createElement('div', { className: 'gallery-container' }, [
    // Results summary
    createElement('div', { className: 'gallery-summary' }, [
      createElement('p', {}, `Showing ${images.length} of ${total} images`)
    ]),

    // Image grid
    images.length > 0
      ? createElement('div', { className: 'gallery-grid' },
          images.map(image => createImageCard(image, onImageClick))
        )
      : createElement('div', { className: 'gallery-empty' }, [
          createElement('p', {}, 'No images found'),
          createElement('p', { className: 'text-muted' }, 'Try adjusting your filters')
        ]),

    // Pagination controls
    totalPages > 1 ? createPagination(currentPage, totalPages, onPageChange) : null
  ].filter(Boolean));
}

/**
 * Create image card
 * @param {Object} image - Image object
 * @param {Function} onClick - Click handler
 * @returns {HTMLElement}
 */
function createImageCard(image, onClick) {
  return createElement('div', {
    className: 'gallery-card',
    onClick: () => onClick(image)
  }, [
    // Thumbnail
    createElement('div', { className: 'gallery-card-image' }, [
      createElement('img', {
        src: image.thumbnail_path || '/placeholder.jpg',
        alt: image.filename,
        loading: 'lazy'
      })
    ]),

    // Card info
    createElement('div', { className: 'gallery-card-info' }, [
      createElement('h3', { className: 'gallery-card-title' }, image.filename),

      createElement('div', { className: 'gallery-card-meta' }, [
        // Date
        createElement('div', { className: 'gallery-card-meta-item' }, [
          createElement('span', { className: 'text-muted' }, '📅 '),
          createElement('span', {}, formatDate(image.captured_at))
        ]),

        // Location
        image.camera_location && createElement('div', { className: 'gallery-card-meta-item' }, [
          createElement('span', { className: 'text-muted' }, '📍 '),
          createElement('span', {}, image.camera_location.label)
        ]),

        // Status
        createElement('div', { className: 'gallery-card-meta-item' }, [
          createElement('span', {
            className: `status-badge status-${image.processing_status}`
          }, image.processing_status)
        ])
      ].filter(Boolean))
    ])
  ]);
}

/**
 * Create pagination controls
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 * @param {Function} onPageChange - Page change handler
 * @returns {HTMLElement}
 */
function createPagination(currentPage, totalPages, onPageChange) {
  const pages = [];

  // Previous button
  pages.push(
    createElement('button', {
      className: 'pagination-btn',
      disabled: currentPage === 1,
      onClick: () => onPageChange(currentPage - 1)
    }, '← Previous')
  );

  // Page numbers (show max 5 pages)
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);

  if (startPage > 1) {
    pages.push(
      createElement('button', {
        className: 'pagination-btn',
        onClick: () => onPageChange(1)
      }, '1')
    );
    if (startPage > 2) {
      pages.push(createElement('span', { className: 'pagination-ellipsis' }, '...'));
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(
      createElement('button', {
        className: `pagination-btn ${i === currentPage ? 'active' : ''}`,
        onClick: () => onPageChange(i)
      }, i.toString())
    );
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pages.push(createElement('span', { className: 'pagination-ellipsis' }, '...'));
    }
    pages.push(
      createElement('button', {
        className: 'pagination-btn',
        onClick: () => onPageChange(totalPages)
      }, totalPages.toString())
    );
  }

  // Next button
  pages.push(
    createElement('button', {
      className: 'pagination-btn',
      disabled: currentPage === totalPages,
      onClick: () => onPageChange(currentPage + 1)
    }, 'Next →')
  );

  return createElement('div', { className: 'gallery-pagination' }, pages);
}

export default { createGallery };
