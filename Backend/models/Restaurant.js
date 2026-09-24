const mongoose = require('mongoose');

module.exports = mongoose.model('Restaurant', new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, default: '' },
  image: { type: String, default: '' },
  cuisine: { type: String, default: '' }, // e.g. "South Indian, Chinese"
  rating: { type: Number, default: 4.0, min: 0, max: 5 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true }));
