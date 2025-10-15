const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * JWT auth middleware.
 * - Accepts token from "Authorization: Bearer <token>" or "access_token" cookie.
 * - Verifies the token and attaches the decoded payload to req.user.
 * - Responds 401 on missing/invalid token.
 */

const auth = (req, res, next) => {
  // Extract token from header or cookie
  const raw = req.header('Authorization') || '';
  const headerToken = raw.startsWith('Bearer ') ? raw.slice(7) : (raw || '');
  const cookieToken = req.cookies && req.cookies.access_token ? req.cookies.access_token : null;
  const token = headerToken || cookieToken;

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Validate and decode JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // Invalid or expired token
    return res.status(401).json({ msg: 'Token is not valid', err });
  }
};

module.exports = auth;
