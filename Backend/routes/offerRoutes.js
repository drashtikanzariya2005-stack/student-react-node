const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const optionalAuthMiddleware = require("../middleware/optionalAuthMiddleware");

const {
  getOffers,
  validateOffer,
  createOffer,
  updateOffer,
  deleteOffer,
} = require("../controllers/offerController");

// Public listing, but optionalAuth lets an admin also see inactive offers.
router.get("/", optionalAuthMiddleware, getOffers);

// Coupon check from the cart page.
router.post("/validate", validateOffer);

// Admin-only offer management
router.post("/", authMiddleware, adminMiddleware, createOffer);
router.put("/:id", authMiddleware, adminMiddleware, updateOffer);
router.delete("/:id", authMiddleware, adminMiddleware, deleteOffer);

module.exports = router;
