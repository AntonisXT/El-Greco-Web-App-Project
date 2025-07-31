const express = require('express');
const router = express.Router();
const Exhibition = require('../models/exhibition');
const auth = require('../middleware/auth');

// GET all exhibitions
router.get('/', async (req, res) => {
  try {
    const exhibitions = await Exhibition.find();
    res.json(exhibitions);
  } catch (err) {
    console.error('Error fetching exhibitions:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// POST a new exhibition (protected route)
router.post('/', auth, async (req, res) => {
  const { title, date, location, category } = req.body;

  if (!title || !date || !location || !category) {
    return res.status(400).json({ msg: 'Please include all fields' });
  }

  try {
    const newExhibition = new Exhibition({
      title,
      date,
      location,
      category
    });
    const exhibition = await newExhibition.save();
    res.json(exhibition);
  } catch (err) {
    console.error('Error creating exhibition:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// PUT update exhibition (protected route)
router.put('/:id', auth, async (req, res) => {
  try {
    const exhibition = await Exhibition.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!exhibition) {
      return res.status(404).json({ msg: 'Exhibition not found' });
    }
    res.json(exhibition);
  } catch (err) {
    console.error('Error updating exhibition:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// DELETE exhibition (protected route)
router.delete('/:id', auth, async (req, res) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id);
    if (!exhibition) {
      return res.status(404).json({ msg: 'Exhibition not found' });
    }
    await Exhibition.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Exhibition removed' });
  } catch (err) {
    console.error('Error deleting exhibition:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

module.exports = router;