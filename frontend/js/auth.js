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
async function fetchWithAuth(input, init = {}) {
  // Read CSRF token from cookie
  const csrf = getCsrfTokenFromCookie();

  // Build the final request configuration
  const finalInit = {
    ...init,
    credentials: 'include', // include cookies (JWT + CSRF)
    headers: {
      ...(init.headers || {}),
      ...(csrf ? { 'X-CSRF-Token': csrf } : {})
    }
  };

  // Helper function to perform the fetch
  const doFetch = () => fetch(input, finalInit);

  // First attempt
  let response = await doFetch();

  // If unauthorized or CSRF token expired, try to refresh and retry once
  if (response.status === 401 || response.status === 403) {
    try {
      const r = await fetch('/auth/refresh', { method: 'POST', credentials: 'include' });
      if (r.ok) {
        // Update CSRF header with the new token from cookies
        const newCsrf = getCsrfTokenFromCookie();
        finalInit.headers = {
          ...(finalInit.headers || {}),
          ...(newCsrf ? { 'X-CSRF-Token': newCsrf } : {})
        };
        // Retry the original request once
        response = await doFetch();
      }
    } catch (_) {
      // Ignore errors during refresh attempt
    }
  }

  // If still unauthorized, force logout and alert the user
  if (response.status === 401) {
    alert('Session expired. Please log in again.');
    throw new Error('Unauthorized');
  }

  // If the response is not OK, throw a descriptive error
  if (!response.ok) {
    let err;
    try {
      err = await response.json();
    } catch {
      err = { message: await response.text().catch(() => 'Request failed') };
    }
    throw new Error(JSON.stringify(err));
  }

  // Return the successful response
  return response;
}

export { login, isLoggedIn, logout, fetchWithAuth };
