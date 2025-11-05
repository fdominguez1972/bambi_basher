import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { hashFile } from '../utils/hash.js';
import { run, get } from '../db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage paths
const STORAGE_DIR = process.env.STORAGE_DIR || path.join(__dirname, '../../storage');
const IMAGES_DIR = path.join(STORAGE_DIR, 'images');
const THUMBNAILS_DIR = path.join(STORAGE_DIR, 'thumbnails');

// Ensure directories exist
[IMAGES_DIR, THUMBNAILS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Handle file upload
 * @param {Object} file - Multer file object
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Uploaded image record
 */
export async function handleUpload(file, userId) {
  // Calculate file hash
  const fileHash = await hashFile(file.path);

  // Check for duplicates
  const duplicate = checkDuplicate(fileHash);
  if (duplicate) {
    // Remove uploaded file
    fs.unlinkSync(file.path);
    throw new Error('Duplicate image: This file has already been uploaded');
  }

  // Generate stored filename
  const ext = path.extname(file.originalname);
  const storedFilename = `${fileHash}${ext}`;
  const storedPath = path.join(IMAGES_DIR, storedFilename);

  // Move file to storage
  fs.renameSync(file.path, storedPath);

  // Extract EXIF data (simplified - would use exif library in production)
  const capturedAt = extractCaptureDate(storedPath);

  // Create database record
  const now = Math.floor(Date.now() / 1000);
  const result = run(
    `INSERT INTO images (
      filename, stored_filename, file_hash, file_size, mime_type,
      uploaded_by, uploaded_at, captured_at, processing_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      file.originalname,
      storedFilename,
      fileHash,
      file.size,
      file.mimetype,
      userId,
      now,
      capturedAt || now,
      'pending'
    ]
  );

  return {
    id: result.lastInsertRowid,
    filename: file.originalname,
    stored_filename: storedFilename,
    file_hash: fileHash,
    file_size: file.size,
    processing_status: 'pending'
  };
}

/**
 * Check if file hash already exists
 * @param {string} fileHash - File hash
 * @returns {Object|null} Existing image or null
 */
export function checkDuplicate(fileHash) {
  return get('SELECT id, filename FROM images WHERE file_hash = ?', [fileHash]);
}

/**
 * Extract capture date from EXIF (simplified)
 * @param {string} filePath - Path to image
 * @returns {number|null} Unix timestamp or null
 */
function extractCaptureDate(filePath) {
  // In production, use exifr or similar library
  // For now, return null to use upload time
  return null;
}

/**
 * Get storage paths
 * @returns {Object} Storage directory paths
 */
export function getStoragePaths() {
  return {
    images: IMAGES_DIR,
    thumbnails: THUMBNAILS_DIR
  };
}

export default {
  handleUpload,
  checkDuplicate,
  getStoragePaths
};
