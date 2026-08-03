// ============================================================
//  services/api.js
//
//  In development: Vite proxies /api → http://localhost:4000
//  In production:  Frontend is served BY the backend, so /api
//                  calls hit the same origin automatically.
//  No hardcoded URLs needed either way.
// ============================================================

const BASE = '/api';

function getToken() {
  return localStorage.getItem('fp_dashboard_token');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const login = (password) =>
  request('/auth/login', { method: 'POST', body: { password }, auth: false });

export const getCandidates = (deviceId) =>
  request(`/candidates${deviceId ? `?deviceId=${encodeURIComponent(deviceId)}` : ''}`);

export const createCandidate = (payload) =>
  request('/candidates', { method: 'POST', body: payload });

export const updateCandidate = (deviceId, id, payload) =>
  request(`/candidates/${encodeURIComponent(deviceId)}/${id}`, { method: 'PUT', body: payload });

export const deleteCandidate = (deviceId, id, password) =>
  request(`/candidates/${encodeURIComponent(deviceId)}/${id}`, { method: 'DELETE', body: { password } });

export const getAttendance = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/attendance${qs ? '?' + qs : ''}`);
};

export const getStats = (deviceId) =>
  request(`/attendance/stats${deviceId ? `?deviceId=${encodeURIComponent(deviceId)}` : ''}`);

export const getDevices = () => request('/devices');

export const wipeSensor = (deviceId) =>
  request(`/devices/${encodeURIComponent(deviceId)}/sensor/wipe`, { method: 'POST' });

export const getAuditLog = () => request('/audit');
