const express = require('express');
const router = express.Router();
const Link = require('../models/link');
const auth = require('../middleware/auth');

// GET all links
router.get('/', async (req, res) => {
  try {
    const links = await Link.find();
    res.json(links);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

// POST a new link (protected route)
router.post('/', auth, async (req, res) => {
  const { url, description, category } = req.body;

  if (!url || !description || !category) {
    return res.status(400).json({ msg: 'Please include all fields' });
  }

  try {
    const newLink = new Link({ url, description, category });
    const link = await newLink.save();
    res.json(link);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

// PUT update link (protected route)
router.put('/:id', auth, async (req, res) => {
  try {
    const link = await Link.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!link) {
      return res.status(404).json({ msg: 'Link not found' });
    }
    res.json(link);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const link = await Link.findById(req.params.id);
    if (!link) {
      return res.status(404).json({ msg: 'Link not found' });
    }
    await Link.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Link removed' });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;