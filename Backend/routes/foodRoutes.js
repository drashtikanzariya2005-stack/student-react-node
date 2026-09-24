const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
    getFoods,
    getFoodById,
    addFood,
    updateFood,
    deleteFood
} = require("../controllers/foodController");

// Public routes - anyone can browse the menu
router.get("/", getFoods);
router.get("/:id", getFoodById);

// Admin-only routes - manage the menu
router.post("/", authMiddleware, adminMiddleware, addFood);
router.put("/:id", authMiddleware, adminMiddleware, updateFood);
router.delete("/:id", authMiddleware, adminMiddleware, deleteFood);

module.exports = router;
