/**
 * Upload Page
 * Admin-only page for uploading images and managing processing jobs
 */

import '../components/upload/upload.css';
import { createElement } from '../utils/dom.js';
import { createUploadComponent } from '../components/upload/upload.js';
import { createProcessingJob, fetchProcessingJobs, fetchProcessingJobById, startProcessingJob, deleteProcessingJob } from '../services/api.js';
import eventBus, { EVENTS } from '../services/event-bus.js';
import { formatDate } from '../utils/formatters.js';

let jobsInterval = null;

/**
 * Render upload page
 * @param {HTMLElement} container - Container element
 */
export async function renderUploadPage(container) {
  // Check if user is admin
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || user.role !== 'admin') {
    container.innerHTML = '<div class="container"><p>Access denied. Admin role required.</p></div>';
    return;
  }

  const pageContainer = createElement('div', { className: 'container upload-page' }, [
    createElement('h1', {}, 'Upload Images'),

    createElement('div', { className: 'upload-section card' }, [
      createElement('h2', {}, 'Select Images'),
      createUploadComponent(handleUploadComplete)
    ]),

    createElement('div', { className: 'jobs-section' }, [
      createElement('div', { className: 'jobs-header' }, [
        createElement('h2', {}, 'Processing Jobs'),
        createElement('button', {
          className: 'btn btn-secondary',
          onclick: refreshJobs
        }, 'Refresh')
      ]),
      createElement('div', { id: 'jobs-container', className: 'loading' }, 'Loading jobs...')
    ])
  ]);

  container.innerHTML = '';
  container.appendChild(pageContainer);

  // Load initial jobs
  await loadJobs();

  // Auto-refresh jobs every 5 seconds
  jobsInterval = setInterval(loadJobs, 5000);
}

/**
 * Handle upload completion
 * @param {Object} result - Upload result
 */
async function handleUploadComplete(result) {
  if (!result.uploaded || result.uploaded.length === 0) {
    return;
  }

  // Ask user if they want to start processing
  const imageIds = result.uploaded.map(img => img.id);

  const shouldProcess = confirm(
    `Upload complete! Do you want to start processing ${imageIds.length} image${imageIds.length !== 1 ? 's' : ''} now?`
  );

  if (shouldProcess) {
    try {
      const job = await createProcessingJob(imageIds, true);
      eventBus.emit(EVENTS.NOTIFY_SUCCESS, 'Processing job started');
      await loadJobs();
    } catch (error) {
      console.error('Failed to create job:', error);
      eventBus.emit(EVENTS.NOTIFY_ERROR, error.message || 'Failed to start processing');
    }
  }
}

/**
 * Load and render jobs
 */
async function loadJobs() {
  const container = document.getElementById('jobs-container');
  if (!container) return;

  try {
    const data = await fetchProcessingJobs({ limit: 10, offset: 0 });

    if (data.jobs.length === 0) {
      container.innerHTML = '<p class="text-muted">No processing jobs yet.</p>';
      container.classList.remove('loading');
      return;
    }

    const jobsList = createElement('div', { className: 'jobs-list' },
      data.jobs.map(job => createJobCard(job))
    );

    container.innerHTML = '';
    container.appendChild(jobsList);
    container.classList.remove('loading');

  } catch (error) {
    console.error('Failed to load jobs:', error);
    container.innerHTML = '<p class="text-danger">Failed to load jobs</p>';
    container.classList.remove('loading');
  }
}

/**
 * Create job card
 * @param {Object} job - Job data
 * @returns {HTMLElement}
 */
function createJobCard(job) {
  const progress = job.total_images > 0
    ? Math.round((job.processed_images / job.total_images) * 100)
    : 0;

  const statusClass = `status-${job.status}`;

  const card = createElement('div', { className: `job-card card ${statusClass}` }, [
    createElement('div', { className: 'job-header' }, [
      createElement('div', { className: 'job-info' }, [
        createElement('h3', {}, `Job #${job.id}`),
        createElement('span', { className: `badge badge-${job.status}` }, job.status)
      ]),
      createElement('div', { className: 'job-actions' }, createJobActions(job))
    ]),

    createElement('div', { className: 'job-stats' }, [
      createElement('div', { className: 'stat' }, [
        createElement('span', { className: 'stat-label' }, 'Total'),
        createElement('span', { className: 'stat-value' }, job.total_images.toString())
      ]),
      createElement('div', { className: 'stat' }, [
        createElement('span', { className: 'stat-label' }, 'Processed'),
        createElement('span', { className: 'stat-value' }, job.processed_images.toString())
      ]),
      createElement('div', { className: 'stat success' }, [
        createElement('span', { className: 'stat-label' }, 'Success'),
        createElement('span', { className: 'stat-value' }, job.successful_images.toString())
      ]),
      createElement('div', { className: 'stat danger' }, [
        createElement('span', { className: 'stat-label' }, 'Failed'),
        createElement('span', { className: 'stat-value' }, job.failed_images.toString())
      ])
    ]),

    createElement('div', { className: 'job-progress' }, [
      createElement('div', { className: 'progress-bar' }, [
        createElement('div', {
          className: 'progress-fill',
          style: `width: ${progress}%`
        })
      ]),
      createElement('div', { className: 'progress-label' }, `${progress}% complete`)
    ]),

    createElement('div', { className: 'job-meta' }, [
      createElement('span', {}, `Started: ${formatDate(job.started_at * 1000)}`),
      job.completed_at && createElement('span', {}, `Completed: ${formatDate(job.completed_at * 1000)}`)
    ].filter(Boolean))
  ]);

  return card;
}

/**
 * Create job action buttons
 * @param {Object} job - Job data
 * @returns {Array<HTMLElement>}
 */
function createJobActions(job) {
  const actions = [];

  if (job.status === 'pending') {
    actions.push(
      createElement('button', {
        className: 'btn btn-sm btn-primary',
        onclick: () => handleStartJob(job.id)
      }, 'Start')
    );
  }

  if (job.status === 'running') {
    actions.push(
      createElement('button', {
        className: 'btn btn-sm btn-secondary',
        onclick: () => handleCancelJob(job.id)
      }, 'Cancel')
    );
  }

  if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
    actions.push(
      createElement('button', {
        className: 'btn btn-sm btn-danger',
        onclick: () => handleDeleteJob(job.id)
      }, 'Delete')
    );
  }

  return actions;
}

/**
 * Handle start job
 * @param {number} jobId - Job ID
 */
async function handleStartJob(jobId) {
  try {
    await startProcessingJob(jobId);
    eventBus.emit(EVENTS.NOTIFY_SUCCESS, 'Job started');
    await loadJobs();
  } catch (error) {
    console.error('Failed to start job:', error);
    eventBus.emit(EVENTS.NOTIFY_ERROR, error.message || 'Failed to start job');
  }
}

/**
 * Handle cancel job
 * @param {number} jobId - Job ID
 */
async function handleCancelJob(jobId) {
  if (!confirm('Are you sure you want to cancel this job?')) {
    return;
  }

  try {
    await deleteProcessingJob(jobId);
    eventBus.emit(EVENTS.NOTIFY_SUCCESS, 'Job cancelled');
    await loadJobs();
  } catch (error) {
    console.error('Failed to cancel job:', error);
    eventBus.emit(EVENTS.NOTIFY_ERROR, error.message || 'Failed to cancel job');
  }
}

/**
 * Handle delete job
 * @param {number} jobId - Job ID
 */
async function handleDeleteJob(jobId) {
  if (!confirm('Are you sure you want to delete this job?')) {
    return;
  }

  try {
    await deleteProcessingJob(jobId);
    eventBus.emit(EVENTS.NOTIFY_SUCCESS, 'Job deleted');
    await loadJobs();
  } catch (error) {
    console.error('Failed to delete job:', error);
    eventBus.emit(EVENTS.NOTIFY_ERROR, error.message || 'Failed to delete job');
  }
}

/**
 * Refresh jobs manually
 */
async function refreshJobs() {
  await loadJobs();
  eventBus.emit(EVENTS.NOTIFY_SUCCESS, 'Jobs refreshed');
}

/**
 * Cleanup when leaving page
 */
export function cleanupUploadPage() {
  if (jobsInterval) {
    clearInterval(jobsInterval);
    jobsInterval = null;
  }
}

export default {
  renderUploadPage,
  cleanupUploadPage
};
