const r = require('express').Router(),
  a = require('../middleware/authMiddleware'),
  ad = require('../middleware/adminMiddleware'),
  c = require('../controllers/restaurantController');

r.get('/', c.getRestaurants);
r.post('/', a, ad, c.createRestaurant);
r.put('/:id', a, ad, c.updateRestaurant);
r.delete('/:id', a, ad, c.deleteRestaurant);

module.exports = r;
