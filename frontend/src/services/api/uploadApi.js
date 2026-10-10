import { API_BASE_URL } from './client';

/**
 * Upload a file to the backend with real-time progress reporting.
 * @param {string} endpoint  - e.g. 'pdf' or 'image'
 * @param {string} fieldName - multipart field name
 * @param {File}   file      - File object from <input type="file">
 * @param {string} token     - Admin JWT token
 * @param {function} onProgress - optional (pct: 0-100) => void callback
 * @returns {Promise<string>} public URL of the uploaded file
 */
export function uploadWithProgress(endpoint, fieldName, file, token, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append(fieldName, file);

    const xhr = new XMLHttpRequest();

    if (onProgress && xhr.upload) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.url);
        } catch {
          reject(new Error('Invalid server response'));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error || `Upload failed (${xhr.status})`));
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network error — upload failed'));
    xhr.ontimeout = () => reject(new Error('Upload timed out'));
    xhr.timeout = 120_000; // 2-minute timeout for large PDFs

    xhr.open('POST', `${API_BASE_URL}/upload/${endpoint}`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

/**
 * Upload a PDF file via the backend to storage.
 */
export async function uploadPdf(file, token, onProgress) {
  return uploadWithProgress('pdf', 'pdf', file, token, onProgress);
}

/**
 * Upload a cover image via the backend to storage.
 */
export async function uploadImage(file, token, onProgress) {
  return uploadWithProgress('image', 'image', file, token, onProgress);
}
