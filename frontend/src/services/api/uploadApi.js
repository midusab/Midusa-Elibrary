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
          const msg = err.message || err.error;
          if (msg) {
            reject(new Error(msg));
            return;
          }
        } catch {
          // Response was not JSON
        }

        if (xhr.status === 401) {
          reject(new Error('Your session has expired. Please sign in again.'));
        } else if (xhr.status === 403) {
          reject(new Error('Administrator privileges required to upload book files.'));
        } else if (xhr.status === 413) {
          reject(new Error('The file is too large to upload. Please choose a smaller file.'));
        } else {
          reject(new Error('Upload failed. Please check your connection and try again.'));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Unable to connect to the server. Please check your internet connection.'));
    xhr.ontimeout = () => reject(new Error('Upload timed out. The file took too long to transfer.'));
    xhr.timeout = 300_000; // 5-minute timeout for large files

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
