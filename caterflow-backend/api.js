// ============================================================
// api.js  —  Drop this file alongside your React app
// All API calls to the CaterFlow backend
// ============================================================

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ── TOKEN HELPERS ─────────────────────────────────────────────
export const getToken  = ()        => localStorage.getItem('cf_token');
export const setToken  = (t)       => localStorage.setItem('cf_token', t);
export const clearToken = ()       => localStorage.removeItem('cf_token');
export const getUser   = ()        => { try { return JSON.parse(localStorage.getItem('cf_user')); } catch { return null; } };
export const setUser   = (u)       => localStorage.setItem('cf_user', JSON.stringify(u));
export const clearUser = ()        => localStorage.removeItem('cf_user');

// ── BASE FETCH ────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Request failed');
  return json.data;
}

// ── AUTH ─────────────────────────────────────────────────────
export const apiLogin  = (username, password) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });

// ── CLIENTS ──────────────────────────────────────────────────
export const apiGetClients    = ()       => apiFetch('/clients');
export const apiAddClient     = (data)   => apiFetch('/clients',     { method: 'POST',   body: JSON.stringify(data) });
export const apiUpdateClient  = (id, d)  => apiFetch(`/clients/${id}`, { method: 'PUT',  body: JSON.stringify(d) });
export const apiDeleteClient  = (id)     => apiFetch(`/clients/${id}`, { method: 'DELETE' });

// ── GROCERY ITEMS ─────────────────────────────────────────────
export const apiGetItems      = ()       => apiFetch('/items');
export const apiAddItem       = (data)   => apiFetch('/items',       { method: 'POST',   body: JSON.stringify(data) });
export const apiUpdateItem    = (id, d)  => apiFetch(`/items/${id}`,   { method: 'PUT',  body: JSON.stringify(d) });
export const apiDeleteItem    = (id)     => apiFetch(`/items/${id}`,   { method: 'DELETE' });

// ── USERS ────────────────────────────────────────────────────
export const apiGetUsers      = ()       => apiFetch('/users');
export const apiAddUser       = (data)   => apiFetch('/users',       { method: 'POST',   body: JSON.stringify(data) });
export const apiUpdateUser    = (id, d)  => apiFetch(`/users/${id}`,   { method: 'PUT',  body: JSON.stringify(d) });
export const apiDeleteUser    = (id)     => apiFetch(`/users/${id}`,   { method: 'DELETE' });

// ── PURCHASES ─────────────────────────────────────────────────
export const apiGetPurchases  = (params = {}) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  return apiFetch(`/purchases${qs ? '?' + qs : ''}`);
};
export const apiAddPurchase   = (data)   => apiFetch('/purchases',   { method: 'POST',   body: JSON.stringify(data) });
export const apiUpdatePurchase = (id, d) => apiFetch(`/purchases/${id}`, { method: 'PUT', body: JSON.stringify(d) });
export const apiDeletePurchase = (id)    => apiFetch(`/purchases/${id}`, { method: 'DELETE' });
