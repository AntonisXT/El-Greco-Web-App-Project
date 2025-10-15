const express = require('express');
const router = express.Router();
const LinkItem = require('../models/linkItem');
const auth = require('../middleware/auth');
const validate = require('../server/middleware/validate');
const { pagination, objectId, idParam, linkItemBody } = require('../server/validation/schemas');
const paginate = require('../server/utils/paginate');

/**
 * GET /
 * List all link items (optionally filtered by subcategory).
 * Supports pagination and sorted by creation date (newest first).
 */
router.get(
  '/',
  validate({ query: pagination.keys({ subcategory: objectId.optional() }) }),
  async (req, res) => {
    try {
      const filter = {};
      if (req.query.subcategory) filter.subcategory = req.query.subcategory;
      const q = LinkItem.find(filter);
      const result = await paginate(q, {
        page: req.query.page,
        limit: req.query.limit,
        sort: { createdAt: -1 },
      });
      res.json(result);
    } catch (e) {
      res.status(500).json({ msg: e.message });
    }
  }
);

/**
 * POST /
 * Create a new link item.
 * Requires authentication and validated body.
 */
router.post('/', auth, validate({ body: linkItemBody }), async (req, res) => {
  try {
    const created = await LinkItem.create(req.body);
    res.status(201).json(created);
  } catch (e) {
    res.status(400).json({ msg: e.message });
  }
});

/**
 * PUT /:id
 * Update a link item by ID.
 * The URL field is optional on update.
 */
router.put(
  '/:id',
  auth,
  validate({ params: idParam, body: linkItemBody.fork(['url'], s => s.optional()) }),
  async (req, res) => {
    try {
      const updated = await LinkItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(updated);
    } catch (e) {
      res.status(400).json({ msg: e.message });
    }
  }
);

/**
 * DELETE /:id
 * Remove a link item by ID.
 */
router.delete('/:id', auth, validate({ params: idParam }), async (req, res) => {
  try {
    await LinkItem.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ msg: e.message });
  }
});

module.exports = router;
