const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const categoryController = require("../controllers/categoryController");

// Main Category routes
router.get("/main", categoryController.getMainCategories);
router.post("/main", authMiddleware, adminMiddleware, categoryController.createMainCategory);
router.put("/main/:id", authMiddleware, adminMiddleware, categoryController.updateMainCategory);
router.delete("/main/:id", authMiddleware, adminMiddleware, categoryController.deleteMainCategory);

// Subcategory routes
router.get("/", categoryController.getCategories);
router.post("/", authMiddleware, adminMiddleware, categoryController.createCategory);
router.put("/:id", authMiddleware, adminMiddleware, categoryController.updateCategory);
router.delete("/:id", authMiddleware, adminMiddleware, categoryController.deleteCategory);

module.exports = router;
