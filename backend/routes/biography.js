const express = require('express');
const router = express.Router();
const Biography = require('../models/biography');
const auth = require('../middleware/auth');

/**
 * GET /:subcategoryId
 * Fetch biography content for a specific subcategory.
 */
router.get('/:subcategoryId', async (req, res) => {
  try {
    const doc = await Biography.findOne({ subcategory: req.params.subcategoryId });
    res.json(doc || null);
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
});

/**
 * POST /:subcategoryId
 * Create or update (upsert) biography content for a subcategory.
 * Requires authentication.
 */
router.post('/:subcategoryId', auth, async (req, res) => {
  try {
    const { contentHtml } = req.body;
    const updated = await Biography.findOneAndUpdate(
      { subcategory: req.params.subcategoryId },
      { contentHtml, updatedAt: new Date() },
      { new: true, upsert: true }
    );
    res.json(updated);
  } catch (e) {
    res.status(400).json({ msg: e.message });
  }
});

/**
 * DELETE /:subcategoryId
 * Remove biography content for the given subcategory.
 * Requires authentication.
 */
router.delete('/:subcategoryId', auth, async (req, res) => {
  try {
    await Biography.findOneAndDelete({ subcategory: req.params.subcategoryId });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ msg: e.message });
  }
});

module.exports = router;
