/**
 * End the session server-side, then land on /login.
 * Uses a full navigation so in-memory state (sockets, caches) is dropped.
 * Even if the request fails (already logged out, offline), we still leave:
 * the session cookie is the only credential and the server will 401 next load.
 */
export async function logout() {
  try {
    await fetch('/auth/logout', { method: 'GET', headers: { Accept: 'application/json' } })
  } catch {
    // best-effort — navigate away regardless
  }
  window.location.assign('/login')
}
