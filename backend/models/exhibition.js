const mongoose = require('mongoose');

const ExhibitionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String, required: true },
  location: { type: String, required: true },
  category: { type: String, required: true, enum: ['Μόνιμες Εκθέσεις', 'Περιοδικές Εκθέσεις', 'Ιστορικές Εκθέσεις'] }
});

module.exports = mongoose.model('Exhibition', ExhibitionSchema);