const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  submitContact,
  getAllContacts,
  updateContactStatus,
  deleteContact,
} = require("../controllers/contactController");

router.post("/", submitContact);

router.get("/", authMiddleware, adminMiddleware, getAllContacts);
router.put("/:id", authMiddleware, adminMiddleware, updateContactStatus);
router.delete("/:id", authMiddleware, adminMiddleware, deleteContact);

module.exports = router;
