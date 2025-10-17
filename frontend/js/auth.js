/**
 * Read CSRF token from cookies (URL-decoded).
 * Returns the token string or null if missing.
 */
function getCsrfTokenFromCookie() {
  try {
    const row = document.cookie.split('; ').find(r => r.startsWith('csrf_token='));
    return row ? decodeURIComponent(row.split('=')[1]) : null;
  } catch { return null; }
}

// ---------- Auth actions (cookie-based sessions) ----------
/**
 * Log in with username/password and establish a session cookie.
 * @returns {Promise<boolean>} true on success, false on failure (alerts on error).
 */
async function login(username, password) {
  const res = await fetch(`/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    let msg = 'Αποτυχία σύνδεσης';
    try { const j = await res.json(); msg = j.message || msg; } catch {}
    alert(msg);
    return false;
  }
  return true;
}

/**
 * Log out and clear the server-side session.
 */
async function logout() {
  try { await fetch('/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
}

/**
 * Check current auth state by hitting /auth/state.
 * @returns {Promise<boolean>} whether the user is authenticated.
 */
async function isLoggedIn() {
  try {
    const res = await fetch('/auth/state', { credentials: 'include' });
    if (!res.ok) return false;
    const j = await res.json().catch(() => ({}));
    return Boolean(j && j.authenticated);
  } catch { return false; }
}

// ---------- Centralized fetch with cookies + CSRF ----------
/**
 * Wrapper around fetch that:
 * - Always sends credentials (cookies).
 * - Injects X-CSRF-Token header when available.
 * - JSON-stringifies non-FormData bodies and sets Content-Type.
 * - Strips any Authorization header (cookie-based auth only).
 * - Throws on non-OK responses; logs out and alerts on 401.
 */
async function fetchWithAuth(url, options = {}) {
  const opts = { ...options };
  opts.credentials = 'include';

  // Build headers safely
  const headers = new Headers(opts.headers || {});
  const csrf = getCsrfTokenFromCookie();
  if (csrf) headers.set('X-CSRF-Token', csrf);

  // JSON body handling (skip for FormData)
  const isFormData = (typeof FormData !== 'undefined') && (opts.body instanceof FormData);
  if (opts.body && !isFormData) {
    if (typeof opts.body !== 'string') opts.body = JSON.stringify(opts.body);
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  }

  // Enforce cookie-based auth
  headers.delete('Authorization');
  opts.headers = headers;

  const doFetch = () => fetch(url, opts);

  let response = await doFetch();

  // If unauthorized/forbidden, try to refresh and retry once
  if (response.status === 401 || response.status === 403) {
    try {
      const r = await fetch('/auth/refresh', { method: 'POST', credentials: 'include' });
      if (r.ok) {
        // Rebuild headers to inject the fresh CSRF token without losing existing ones
        const refreshedHeaders = new Headers(opts.headers || {});
        const newCsrf = getCsrfTokenFromCookie();
        if (newCsrf) refreshedHeaders.set('X-CSRF-Token', newCsrf);
        // Keep Content-Type if it was set for JSON; keep all other custom headers
        opts.headers = refreshedHeaders;

        // Retry original request (opts.body is unchanged)
        response = await doFetch();
      }
    } catch (_) {
      // Ignore refresh errors; proceed to normal error handling below
    }
  }

  if (response.status === 401) {
    try { logout(); } catch {}
    alert('Η σύνδεση έληξε, παρακαλώ ξανασυνδεθείτε.');
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    let err;
    try { err = await response.json(); }
    catch { err = { message: await response.text().catch(() => 'Request failed') }; }
    throw new Error(JSON.stringify(err));
  }

  return response;
}

export { login, isLoggedIn, logout, fetchWithAuth };
