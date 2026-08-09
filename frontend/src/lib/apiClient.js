// src/lib/apiClient.js
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    const message = json?.message || `Something went wrong (HTTP ${res.status}). Please try again.`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return json.data;
}
// Separate from request() because file uploads use FormData —
// the browser must set its own multipart Content-Type (with boundary),
// so we must NOT set 'Content-Type': 'application/json' like request() does.
async function uploadImages(files, { token } = {}) {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));

  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/admin/uploads/images`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    const message = json?.message || `Upload failed (HTTP ${res.status}).`;
    throw new Error(message);
  }

  return json.data; // { urls: [...] }
}

export const apiClient = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
  uploadImages,
};