/**
 * Image Detail Modal Component
 */

import { createElement } from '../../utils/dom.js';
import { formatDate, formatConfidence } from '../../utils/formatters.js';
import { showModal } from '../common/modal.js';
import { fetchImageById } from '../../services/api.js';

/**
 * Show image detail modal
 * @param {number} imageId - Image ID
 */
export async function showImageDetail(imageId) {
  try {
    const image = await fetchImageById(imageId);

    const content = createImageDetailContent(image);

    showModal({
      title: image.filename,
      content,
      actions: [
        {
          label: 'Close',
          className: 'btn-secondary'
        }
      ],
      closeOnBackdrop: true
    });
  } catch (error) {
    console.error('Failed to load image details:', error);
    showModal({
      title: 'Error',
      content: 'Failed to load image details',
      actions: [{ label: 'Close', className: 'btn-secondary' }]
    });
  }
}

/**
 * Create image detail content
 */
function createImageDetailContent(image) {
  return createElement('div', { className: 'image-detail' }, [
    // Image with detections
    createElement('div', { className: 'image-detail-preview' }, [
      createElement('img', {
        src: image.stored_filename || image.thumbnail_path,
        alt: image.filename,
        style: { maxWidth: '100%', height: 'auto' }
      })
    ]),

    // Metadata
    createElement('div', { className: 'image-detail-meta' }, [
      createElement('h4', {}, 'Information'),
      createElement('dl', { className: 'detail-list' }, [
        createElement('dt', {}, 'Captured'),
        createElement('dd', {}, formatDate(image.captured_at, 'datetime')),

        createElement('dt', {}, 'Location'),
        createElement('dd', {}, image.camera_location ? image.camera_location.label : 'Unknown'),

        createElement('dt', {}, 'File Size'),
        createElement('dd', {}, `${(image.file_size / 1024).toFixed(1)} KB`),

        createElement('dt', {}, 'Status'),
        createElement('dd', {}, image.processing_status)
      ])
    ]),

    // Detections
    createElement('div', { className: 'image-detail-detections' }, [
      createElement('h4', {}, `Detections (${image.detections.length})`),
      image.detections.length > 0
        ? createElement('div', { className: 'detections-list' },
            image.detections.map(d => createDetectionItem(d))
          )
        : createElement('p', { className: 'text-muted' }, 'No detections found')
    ])
  ]);
}

/**
 * Create detection list item
 */
function createDetectionItem(detection) {
  const conf = formatConfidence(detection.confidence);

  return createElement('div', { className: 'detection-item' }, [
    createElement('div', { className: 'detection-info' }, [
      createElement('strong', {}, detection.species?.common_name || 'Unknown'),
      createElement('span', {
        className: `detection-confidence ${conf.className}`
      }, conf.value)
    ]),
    detection.species?.scientific_name &&
      createElement('div', {
        className: 'detection-scientific text-muted text-sm'
      }, detection.species.scientific_name)
  ]);
}

export default { showImageDetail };
