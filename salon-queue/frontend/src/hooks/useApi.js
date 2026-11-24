// src/hooks/useApi.js
// Thin fetch wrapper: attaches auth token, handles JSON, throws on errors.

import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function useApi() {
  const { token, logout } = useAuth();

  async function request(method, path, body = undefined) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    // Handle session expiry
    if (res.status === 401) {
      logout();
      throw new Error('Session expired. Please log in again.');
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw Object.assign(new Error(data.error || 'Request failed.'), {
        status: res.status,
        data,
      });
    }

    return data;
  }

  return {
    get:    (path)         => request('GET',    path),
    post:   (path, body)   => request('POST',   path, body),
    put:    (path, body)   => request('PUT',    path, body),
    patch:  (path, body)   => request('PATCH',  path, body),
    del:    (path)         => request('DELETE', path),
  };
}

// Public (no auth) fetch helper — used by customer-facing pages
export async function publicFetch(method, path, body = undefined) {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Request failed.'), { status: res.status, data });
  return data;
}
