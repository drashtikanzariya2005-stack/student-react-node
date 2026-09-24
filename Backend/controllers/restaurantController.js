const Restaurant = require('../models/Restaurant');

exports.getRestaurants = async (req, res) => {
  try {
    res.json(await Restaurant.find().sort({ createdAt: -1 }));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.createRestaurant = async (req, res) => {
  try {
    res.status(201).json(await Restaurant.create(req.body));
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.updateRestaurant = async (req, res) => {
  try {
    const x = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!x) return res.status(404).json({ message: 'Restaurant not found' });
    res.json(x);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.deleteRestaurant = async (req, res) => {
  try {
    const x = await Restaurant.findByIdAndDelete(req.params.id);
    if (!x) return res.status(404).json({ message: 'Restaurant not found' });
    res.json({ message: 'Restaurant deleted' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
