import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:4000/api/v1' : 'http://localhost:4000/api/v1';
const TOKEN_STORAGE_KEY = 'swimlogix.tokens.v1';

/** Resolve the API base URL from app.json -> expo.extra.apiBaseUrl (falls back to localhost). */
export const getBaseUrl = () => {
  const extra = (Constants.expoConfig && Constants.expoConfig.extra) || {};
  return extra.apiBaseUrl || DEFAULT_BASE_URL;
};

/** Normalised API failure: carries the machine-readable `code` from the backend error envelope. */
export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details || [];
  }
}

let tokens = null;
let unauthorizedHandler = null;

export const setUnauthorizedHandler = (fn) => {
  unauthorizedHandler = fn;
};

export async function restoreTokens() {
  if (tokens) return tokens;
  try {
    const raw = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    tokens = raw ? JSON.parse(raw) : null;
  } catch (err) {
    tokens = null;
  }
  return tokens;
}

export async function persistTokens(next) {
  tokens = next;
  try {
    if (next) await AsyncStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(next));
    else await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (err) {
    // Storage failures must never break the auth flow.
  }
  return tokens;
}

export const getTokens = () => tokens;
export const getAccessToken = () => (tokens ? tokens.accessToken : null);

const buildQuery = (query) => {
  if (!query) return '';
  const parts = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  return parts.length ? `?${parts.join('&')}` : '';
};

async function parseResponse(response) {
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch (err) {
    payload = null;
  }

  if (response.ok) {
    return payload && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
  }

  const error = (payload && payload.error) || {};
  throw new ApiError(
    error.message || `Request failed (${response.status})`,
    response.status,
    error.code || 'REQUEST_FAILED',
    error.details,
  );
}

async function tryRefresh() {
  const current = await restoreTokens();
  if (!current || !current.refreshToken) return false;

  const response = await fetch(`${getBaseUrl()}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: current.refreshToken }),
  });

  if (!response.ok) return false;
  const data = await parseResponse(response);
  await persistTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return true;
}

/**
 * Core request helper.
 * - injects the Bearer token when `auth` is true
 * - transparently retries once after refreshing an expired session
 * - unwraps `{ success, data }` envelopes and throws ApiError on failures
 */
async function request(method, path, { body, query, auth = true, isForm = false, retry = true } = {}) {
  await restoreTokens();

  const headers = {};
  const token = getAccessToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let payload = body;
  if (body && !isForm) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${getBaseUrl()}${path}${buildQuery(query)}`, {
      method,
      headers,
      body: payload,
    });
  } catch (err) {
    throw new ApiError('Network unavailable. Check your connection and API URL.', 0, 'NETWORK_ERROR');
  }

  if (response.status === 401 && auth && retry && token) {
    const refreshed = await tryRefresh();
    if (refreshed) return request(method, path, { body, query, auth, isForm, retry: false });
    await persistTokens(null);
    if (unauthorizedHandler) unauthorizedHandler();
  }

  return parseResponse(response);
}

export const api = {
  get: (path, options) => request('GET', path, options),
  post: (path, body, options) => request('POST', path, { ...options, body }),
  put: (path, body, options) => request('PUT', path, { ...options, body }),
  patch: (path, body, options) => request('PATCH', path, { ...options, body }),
  del: (path, options) => request('DELETE', path, options),
  upload: (path, formData) => request('POST', path, { body: formData, isForm: true }),
};
