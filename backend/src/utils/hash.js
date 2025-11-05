import crypto from 'crypto';
import fs from 'fs';

/**
 * Calculate SHA-256 hash of a file
 * @param {string} filePath - Path to file
 * @returns {Promise<string>} Hex hash string
 */
export function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Calculate SHA-256 hash of a buffer
 * @param {Buffer} buffer - File buffer
 * @returns {string} Hex hash string
 */
export function hashBuffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export default { hashFile, hashBuffer };
