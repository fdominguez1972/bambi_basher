/**
 * Upload Component
 * Drag-and-drop file upload with progress tracking
 */

import { createElement } from '../../utils/dom.js';
import { uploadImages } from '../../services/api.js';
import eventBus, { EVENTS } from '../../services/event-bus.js';

/**
 * Create upload component
 * @param {Function} onUploadComplete - Callback when upload completes
 * @returns {HTMLElement}
 */
export function createUploadComponent(onUploadComplete) {
  let isDragging = false;
  let selectedFiles = [];

  // Create file input
  const fileInput = createElement('input', {
    type: 'file',
    multiple: true,
    accept: 'image/jpeg,image/jpg,image/png,image/gif,image/webp',
    style: 'display: none;'
  });

  // Create drop zone
  const dropZone = createElement('div', {
    className: 'upload-drop-zone'
  }, [
    createElement('div', { className: 'upload-icon' }, '📷'),
    createElement('h3', {}, 'Drop images here'),
    createElement('p', {}, 'or click to browse'),
    createElement('p', { className: 'text-muted' }, 'Supported formats: JPEG, PNG, GIF, WebP (Max 50MB per file)')
  ]);

  // Create file list
  const fileList = createElement('div', {
    className: 'upload-file-list',
    style: 'display: none;'
  });

  // Create actions
  const actions = createElement('div', {
    className: 'upload-actions',
    style: 'display: none;'
  }, [
    createElement('button', {
      type: 'button',
      className: 'btn btn-secondary',
      onclick: clearFiles
    }, 'Clear'),
    createElement('button', {
      type: 'button',
      className: 'btn btn-primary',
      onclick: startUpload
    }, 'Upload')
  ]);

  // Create progress section
  const progressSection = createElement('div', {
    className: 'upload-progress',
    style: 'display: none;'
  }, [
    createElement('div', { className: 'progress-bar' }, [
      createElement('div', { className: 'progress-fill', id: 'upload-progress-fill' })
    ]),
    createElement('div', { className: 'progress-text', id: 'upload-progress-text' }, '0%')
  ]);

  // Container
  const container = createElement('div', { className: 'upload-component' }, [
    dropZone,
    fileList,
    actions,
    progressSection,
    fileInput
  ]);

  // Event handlers
  function handleDragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    isDragging = true;
    dropZone.classList.add('dragging');
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();

    // Only remove dragging state if leaving the drop zone entirely
    if (e.target === dropZone) {
      isDragging = false;
      dropZone.classList.remove('dragging');
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    isDragging = false;
    dropZone.classList.remove('dragging');

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );

    if (files.length > 0) {
      addFiles(files);
    }
  }

  function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      addFiles(files);
    }
  }

  function handleClick() {
    if (!isDragging && selectedFiles.length === 0) {
      fileInput.click();
    }
  }

  function addFiles(files) {
    selectedFiles = [...selectedFiles, ...files];
    renderFileList();
    fileList.style.display = 'block';
    actions.style.display = 'flex';
    dropZone.style.display = 'none';
  }

  function removeFile(index) {
    selectedFiles.splice(index, 1);

    if (selectedFiles.length === 0) {
      clearFiles();
    } else {
      renderFileList();
    }
  }

  function clearFiles() {
    selectedFiles = [];
    fileInput.value = '';
    fileList.style.display = 'none';
    actions.style.display = 'none';
    dropZone.style.display = 'flex';
    progressSection.style.display = 'none';
  }

  function renderFileList() {
    fileList.innerHTML = '';

    const listElement = createElement('ul', { className: 'file-list' },
      selectedFiles.map((file, index) =>
        createElement('li', { className: 'file-item' }, [
          createElement('span', { className: 'file-name' }, file.name),
          createElement('span', { className: 'file-size' }, formatFileSize(file.size)),
          createElement('button', {
            type: 'button',
            className: 'btn-remove',
            onclick: () => removeFile(index)
          }, '×')
        ])
      )
    );

    fileList.appendChild(listElement);

    const count = createElement('p', { className: 'file-count' },
      `${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''} selected`
    );

    fileList.appendChild(count);
  }

  async function startUpload() {
    if (selectedFiles.length === 0) return;

    // Disable actions
    actions.style.display = 'none';
    progressSection.style.display = 'block';

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('images', file);
    });

    try {
      const result = await uploadImages(formData, updateProgress);

      // Success
      eventBus.emit(EVENTS.NOTIFY_SUCCESS,
        `Successfully uploaded ${result.count} image${result.count !== 1 ? 's' : ''}`
      );

      if (result.failedCount > 0) {
        eventBus.emit(EVENTS.NOTIFY_WARNING,
          `${result.failedCount} file${result.failedCount !== 1 ? 's' : ''} failed to upload`
        );
      }

      // Clear and notify
      clearFiles();

      if (onUploadComplete) {
        onUploadComplete(result);
      }

    } catch (error) {
      console.error('Upload error:', error);
      eventBus.emit(EVENTS.NOTIFY_ERROR, error.message || 'Upload failed');

      // Re-enable actions
      actions.style.display = 'flex';
      progressSection.style.display = 'none';
    }
  }

  function updateProgress(percent) {
    const progressFill = document.getElementById('upload-progress-fill');
    const progressText = document.getElementById('upload-progress-text');

    if (progressFill) {
      progressFill.style.width = `${percent}%`;
    }

    if (progressText) {
      progressText.textContent = `${Math.round(percent)}%`;
    }
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // Attach event listeners
  dropZone.addEventListener('dragenter', handleDragEnter);
  dropZone.addEventListener('dragleave', handleDragLeave);
  dropZone.addEventListener('dragover', handleDragOver);
  dropZone.addEventListener('drop', handleDrop);
  dropZone.addEventListener('click', handleClick);
  fileInput.addEventListener('change', handleFileSelect);

  return container;
}

export default { createUploadComponent };
