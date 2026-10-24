
const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  getAllUsers,
  getUserStatus,
  updateUser,
  deleteUser,
} = require("../controllers/userController");


router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);

router.post("/logout", authMiddleware, logoutUser);

router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.put("/change-password", authMiddleware, changePassword);


router.get(
  "/Status",
  authMiddleware,
  adminMiddleware,
  getUserStatus
);

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getAllUsers
);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  updateUser
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  deleteUser
);

module.exports = router;
