const Wishlist = require("../models/Wishlist");
const Food = require("../models/Food");

// GET the logged-in user's wishlist (with full food details).
const getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id }).populate("foods");

    // A user who has never saved anything simply has an empty list.
    if (!wishlist) {
      return res.status(200).json({ foods: [] });
    }

    res.status(200).json(wishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// TOGGLE a food item in the wishlist: present -> remove, absent -> add.
const toggleWishlist = async (req, res) => {
  try {
    const { foodId } = req.params;

    const food = await Food.findById(foodId);

    if (!food) {
      return res.status(404).json({ message: "Food not found" });
    }

    let wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user.id, foods: [] });
    }

    const index = wishlist.foods.map(String).indexOf(String(foodId));
    const removed = index >= 0;

    if (removed) {
      wishlist.foods.splice(index, 1);
    } else {
      wishlist.foods.push(foodId);
    }

    await wishlist.save();
    await wishlist.populate("foods");

    res.status(200).json({
      message: removed ? "Removed from wishlist" : "Added to wishlist",
      wishlisted: !removed,
      foods: wishlist.foods,
      _id: wishlist._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getWishlist,
  toggleWishlist,
};
