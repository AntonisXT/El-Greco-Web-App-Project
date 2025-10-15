const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const express = require('express');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const path = require('path');
const favicon = require('serve-favicon');
const connectDB = require('./config/db');
const cors = require('cors');
const morganLogging = require('./server/logging');
const createCsp = require('./server/security/csp');
const sanitizeBodyHtml = require('./server/middleware/sanitizeHtml');
const errorHandler = require('./server/middleware/errorHandler');
const createCsrfMiddleware = require('./server/middleware/csrf');

const authRoutes = require('./routes/authRoutes');
const categoriesRoutes = require('./routes/categories');
const biographyRoutes = require('./routes/biography');
const paintingsRoutes = require('./routes/paintings');

const app = express();
const docsRouter = require('./server/docs');

// Do not leak framework info
app.disable('x-powered-by');

/* -----------------------------
 * Static assets & favicon
 * --------------------------- */
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));

/* -----------------------------
 * Health check
 * --------------------------- */
app.get('/healthz', (req, res) => res.json({ ok: true }));

/* -----------------------------
 * Security headers (Helmet)
 * --------------------------- */
app.use(helmet({ crossOriginEmbedderPolicy: false }));

/* -----------------------------
 * Request logging
 * --------------------------- */
morganLogging(app);

/* -----------------------------
 * Content Security Policy
 * --------------------------- */
app.use(
  createCsp({
    frontendHosts: [process.env.FRONTEND_ORIGIN || "'self'"],
    apiHosts: [process.env.API_ORIGIN || "'self'"],
  })
);

/* -----------------------------
 * Global rate limiting
 * --------------------------- */
app.use(rateLimit({ windowMs: 10 * 60 * 1000, max: 300 }));
app.set('trust proxy', 1);

/* -----------------------------
 * Database connection
 * --------------------------- */
connectDB();

/* -----------------------------
 * Core middlewares (pre-routes)
 * --------------------------- */
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  })
);
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(cookieParser());
app.use(createCsrfMiddleware());

// Sanitize common HTML fields to mitigate XSS
app.use(sanitizeBodyHtml());

/* -----------------------------
 * Routes
 * --------------------------- */
app.use('/auth', authRoutes);
app.use('/login', authRoutes); // legacy alias

app.use('/api/docs', docsRouter);
app.use('/api/categories', categoriesRoutes);
app.use('/api/biography', biographyRoutes);
app.use('/api/paintings', paintingsRoutes);
app.use('/api/exhibitions', require('./routes/exhibitions'));
app.use('/api/links', require('./routes/links'));

/* -----------------------------
 * Centralized error handler
 * --------------------------- */
app.use(errorHandler);

const PORT = process.env.PORT || 10000;
module.exports = app;

/* -----------------------------
 * Start server (skip in tests)
 * --------------------------- */
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
