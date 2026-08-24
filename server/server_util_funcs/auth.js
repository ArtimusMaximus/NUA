/**
 * Optional authentication for NUA.
 *
 * DISABLED BY DEFAULT — when disabled, all existing behavior is unchanged
 * (backward compatible). Enable it by setting environment variables:
 *
 *   NUA_AUTH_ENABLED=true            # master switch (default: off)
 *   NUA_AUTH_USERNAME=alice          # login username
 *   NUA_AUTH_PASSWORD=secret         # login password
 *   NUA_AUTH_SESSION_TTL_MS=28800000 # optional, session TTL in ms (default 8h)
 *
 * The README and .env.template document these variables. Auth can also be
 * treated as enabled simply by setting NUA_AUTH_USERNAME and NUA_AUTH_PASSWORD
 * (NUA_AUTH_ENABLED is then implied).
 *
 * Sessions are in-memory tokens held in an HttpOnly SameSite cookie. Because
 * the frontend makes same-origin fetch calls, the browser automatically sends
 * the cookie on every request — no changes to individual fetch calls were
 * needed. Tokens expire after the session TTL and are pruned periodically.
 */
const crypto = require('crypto');

const ENV_ENABLED = 'NUA_AUTH_ENABLED';
const ENV_USERNAME = 'NUA_AUTH_USERNAME';
const ENV_PASSWORD = 'NUA_AUTH_PASSWORD';
const ENV_SESSION_TTL = 'NUA_AUTH_SESSION_TTL_MS';
const SESSION_TTL_DEFAULT = 8 * 60 * 60 * 1000; // 8 hours
const SESSION_COOKIE = 'nua_session';

// token -> { username, expiresAt }
const sessions = new Map();

/** Routes that are always reachable even when auth is enabled. */
const PUBLIC_PATHS = new Set(['/login', '/logout', '/auth-status', '/health']);

function isEnabled() {
  return process.env[ENV_ENABLED] === 'true' || isConfigured();
}

function isConfigured() {
  return Boolean(process.env[ENV_USERNAME] && process.env[ENV_PASSWORD]);
}

function getSessionTtl() {
  const v = Number(process.env[ENV_SESSION_TTL]);
  return Number.isFinite(v) && v > 0 ? v : SESSION_TTL_DEFAULT;
}

function newToken() {
  return crypto.randomBytes(32).toString('hex');
}

function pruneExpired() {
  const now = Date.now();
  for (const [token, s] of sessions) {
    if (s.expiresAt <= now) {
      sessions.delete(token);
    }
  }
}

function createSession(username) {
  pruneExpired();
  const token = newToken();
  sessions.set(token, { username, expiresAt: Date.now() + getSessionTtl() });
  return token;
}

/** Constant-time string comparison (throws-safe for differing lengths). */
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    // Differing lengths already fail; burn equivalent time to avoid leaking.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function tokenFromRequest(req) {
  const cookie = req.headers.cookie;
  if (cookie) {
    const m = cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
    if (m) {
      return m[1];
    }
  }
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7);
  }
  return null;
}

function authenticate(req) {
  const token = tokenFromRequest(req);
  if (!token) {
    return null;
  }
  const s = sessions.get(token);
  if (!s) {
    return null;
  }
  if (s.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return s;
}

/**
 * Auth middleware. When auth is disabled this is a no-op (calls next()).
 * When enabled, it rejects requests without a valid session with 401,
 * except for the public paths (login/logout/auth-status/health).
 */
function requireAuth(req, res, next) {
  if (!isEnabled()) {
    return next();
  }
  const session = authenticate(req);
  if (session) {
    req.authUser = session.username;
    return next();
  }
  if (PUBLIC_PATHS.has(req.path)) {
    return next();
  }
  return res.status(401).json({ error: 'Authentication required.' });
}

/** POST /login — validates credentials and sets a session cookie. */
function login(req, res) {
  if (!isEnabled()) {
    return res.status(400).json({ error: 'Authentication is not enabled on this server.' });
  }
  if (!isConfigured()) {
    return res.status(500).json({
      error: 'Authentication is enabled but NUA_AUTH_USERNAME / NUA_AUTH_PASSWORD are not configured.'
    });
  }
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  const okUser = safeEqual(username, process.env[ENV_USERNAME]);
  const okPass = safeEqual(password, process.env[ENV_PASSWORD]);
  if (!okUser || !okPass) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const token = createSession(username);
  const maxAge = Math.floor(getSessionTtl() / 1000);
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}`
  );
  return res.json({ success: true, username });
}

/** POST /logout — invalidates the current session. */
function logout(req, res) {
  const token = tokenFromRequest(req);
  if (token) {
    sessions.delete(token);
  }
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
  return res.json({ success: true });
}

/** GET /auth-status — tells the frontend whether auth is on and logged in. */
function status(req, res) {
  const enabled = isEnabled();
  const session = enabled ? authenticate(req) : null;
  res.json({
    enabled,
    authenticated: Boolean(session),
    username: session ? session.username : null
  });
}

module.exports = {
  isEnabled,
  isConfigured,
  requireAuth,
  login,
  logout,
  status,
  PUBLIC_PATHS,
  SESSION_COOKIE
};
