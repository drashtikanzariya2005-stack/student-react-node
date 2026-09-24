const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const { getWishlist, toggleWishlist } = require("../controllers/wishlistController");

// Both routes are for the logged-in customer only.
router.get("/", authMiddleware, getWishlist);
router.post("/:foodId", authMiddleware, toggleWishlist);

module.exports = router;
