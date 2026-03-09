const rawApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();

export const apiBaseUrl = rawApiBaseUrl.replace(/\/+$/, '');

export function apiUrl(path: string) {
  return apiBaseUrl ? `${apiBaseUrl}${path}` : path;
}

export function apiFetch(path: string, init?: RequestInit) {
  return fetch(apiUrl(path), init);
}
