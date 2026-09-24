const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  createOrder,
  simulatePayment,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  updatePaymentStatus,
  setDeliveryTime,
} = require("../controllers/orderController");

router.post("/pay", authMiddleware, simulatePayment);
router.post("/", authMiddleware, createOrder);
router.get("/my-orders", authMiddleware, getMyOrders);

// Owner (or admin) cancels an order.
router.put("/:id/cancel", authMiddleware, cancelOrder);

// Single order / bill — must come after "/my-orders" so that literal path
// isn't swallowed by this param route.
router.get("/:id", authMiddleware, getOrderById);

// Admin-only routes
router.get("/", authMiddleware, adminMiddleware, getAllOrders);
router.put("/:id/status", authMiddleware, adminMiddleware, updateOrderStatus);
router.put("/:id/payment-status", authMiddleware, adminMiddleware, updatePaymentStatus);
router.put("/:id/delivery-time", authMiddleware, adminMiddleware, setDeliveryTime);

module.exports = router;
