// server/security/csp.js
const helmet = require('helmet');

/**
 * Create and apply a Content Security Policy (CSP) middleware.
 * - Strict by default.
 * - Loosens style policy for Swagger UI routes only.
 */
module.exports = function createCsp() {
  return function (req, res, next) {
    const isDocs = req.path.startsWith('/api/docs');

    const directives = {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https:"],
      styleSrc: ["'self'", "https:", "data:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "data:", "https:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: []
    };

    // Allow inline styles for Swagger UI documentation pages only
    if (isDocs) {
      directives.styleSrc.push("'unsafe-inline'");
      // Optionally, enable hashed inline styles if needed:
      // directives.styleSrc.push("'unsafe-hashes'");
      // Add CDN domains here if Swagger UI assets are loaded externally
    }

    return helmet.contentSecurityPolicy({ directives })(req, res, next);
  };
};
