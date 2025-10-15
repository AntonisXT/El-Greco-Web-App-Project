const path = require('path');
const express = require('express');
const router = express.Router();
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

// Path to the OpenAPI specification (YAML format)
const specPath = path.resolve(__dirname, '../../docs/openapi.yaml');

// Load OpenAPI spec into memory for /openapi.json and as fallback
let swaggerDocument;
try {
  swaggerDocument = YAML.load(specPath);
} catch (e) {
    console.error('Failed to load OpenAPI spec at', specPath, e.message);
    swaggerDocument = { openapi: '3.0.3', info: { title: 'API Docs', version: '0.0.0' }, paths: {} };
}

/**
 * Serve raw spec files for tooling or client generation.
 */
router.get('/openapi.yaml', (_req, res) => res.sendFile(specPath));
router.get('/openapi.json', (_req, res) => res.json(swaggerDocument));

/**
 * Serve interactive Swagger UI.
 * Loads the spec dynamically from /openapi.json to keep it always up-to-date.
 */
router.use(
  '/',
  swaggerUi.serve,
  swaggerUi.setup(null, {
    explorer: true,
    swaggerUrl: 'openapi.json',
    customSiteTitle: 'El Greco API Docs',
    customCss: '.swagger-ui .topbar { display: none }'
  })
);

module.exports = router;
