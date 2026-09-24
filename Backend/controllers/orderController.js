const Order = require("../models/Order");
const Food = require("../models/Food");
const Offer = require("../models/Offer");
const { evaluateOffer } = require("./offerController");

// Delivery + tax rules for the computed bill. Kept in one place so the
// checkout page (Cart.jsx) and the server always agree on the math.
const DELIVERY_FEE = 40; // flat fee
const FREE_DELIVERY_ABOVE = 500; // subtotal at/above this ships free
const GST_RATE = 0.05; // 5%

/**
 * Turn the cart sent by the browser into trusted order items.
 *
 * SECURITY: the client only gets to say WHICH food and HOW MANY. The name
 * and the price are always read back from the database, so a tampered
 * request (e.g. "price": 1) can never change what the customer is charged.
 */
const buildTrustedItems = async (items) => {
  const foodIds = items.map((item) => item.food);
  const foods = await Food.find({ _id: { $in: foodIds } });
  const foodById = new Map(foods.map((food) => [String(food._id), food]));

  const trustedItems = [];

  for (const item of items) {
    const food = foodById.get(String(item.food));

    if (!food) {
      return { error: "One of the items in your cart is no longer available" };
    }

    const quantity = Math.floor(Number(item.quantity));

    if (!Number.isFinite(quantity) || quantity < 1) {
      return { error: `Invalid quantity for ${food.name}` };
    }

    trustedItems.push({
      food: food._id,
      name: food.name,
      price: food.price,
      quantity,
    });
  }

  return { items: trustedItems };
};

const computeBill = (items) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal >= FREE_DELIVERY_ABOVE || subtotal === 0 ? 0 : DELIVERY_FEE;
  const tax = Math.round(subtotal * GST_RATE * 100) / 100;
  const totalAmount = Math.round((subtotal + deliveryFee + tax) * 100) / 100;
  return { subtotal, deliveryFee, tax, totalAmount };
};

// Simple sequential-looking invoice number: INV-YYYYMMDD-<6 random digits>.
// Good enough for an MCA project bill; not guaranteed globally sequential.
const generateInvoiceNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(100000 + Math.random() * 900000);
  return `INV-${date}-${random}`;
};

// CREATE ORDER
// NOTE ON PAYMENTS: This project simulates card/UPI payments (paymentId is a
// generated reference, not a real transaction). To go live with a real
// gateway (Razorpay/Stripe), create the payment order on their platform first,
// verify the signature/webhook here, and only then mark paymentStatus "Paid".
const createOrder = async (req, res) => {
  try {
    const { items, paymentMethod, paymentId, deliveryAddress, couponCode } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Cart is empty",
      });
    }

    // Re-read every item from the database — never trust client prices.
    const { items: orderItems, error: itemsError } = await buildTrustedItems(items);

    if (itemsError) {
      return res.status(400).json({ message: itemsError });
    }

    const method = ["COD", "Card", "UPI", "Online"].includes(paymentMethod) ? paymentMethod : "COD";
    const paymentStatus = method === "COD" ? "Pending" : "Paid";

    // Bill amount is always computed server-side from the item list — never
    // trust a totalAmount sent by the client.
    const { subtotal, deliveryFee, tax, totalAmount: baseTotal } = computeBill(orderItems);

    // Coupon is re-validated here too (not just trusted from the earlier
    // /offers/validate preview call) — a client could otherwise send any
    // discount value it likes.
    let discountAmount = 0;
    let offerCode = "";

    if (couponCode) {
      const offer = await Offer.findOne({
        code: String(couponCode).toUpperCase(),
        isActive: true,
      });

      const result = evaluateOffer(offer, subtotal);

      if (result.error) {
        return res.status(400).json({ message: result.error });
      }

      discountAmount = Math.min(result.discount, baseTotal);
      offerCode = result.offer.code;
    }

    const totalAmount = Math.round((baseTotal - discountAmount) * 100) / 100;

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      subtotal,
      deliveryFee,
      tax,
      offerCode,
      discountAmount,
      totalAmount,
      invoiceNumber: generateInvoiceNumber(),
      paymentMethod: method,
      paymentStatus,
      paymentId: paymentId || "",
      deliveryAddress: deliveryAddress || "",
    });

    res.status(201).json({
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// SIMULATE PAYMENT (Card / UPI)
// Stands in for a real gateway's "create payment" + "verify payment" calls.
// Swap this out for actual Razorpay/Stripe SDK calls when API keys are available.
const simulatePayment = async (req, res) => {
  try {
    const { amount, method } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // Simulate a brief processing delay and a generated reference id.
    const paymentId = `SIM-${method || "CARD"}-${Date.now()}-${Math.floor(
      Math.random() * 100000
    )}`;

    res.status(200).json({
      success: true,
      paymentId,
      message: "Payment successful (simulated)",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET MY ORDERS (logged-in user)
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET SINGLE ORDER / BILL (owner or admin)
// Used by the post-payment bill page and the "Download PDF" button.
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email phone");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const isOwner = order.user._id.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL ORDERS (admin only)
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// UPDATE ORDER STATUS (admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { status, estimatedDeliveryTime } = req.body;

    const allowedStatuses = ["Pending", "Preparing", "Out for Delivery", "Delivered", "Cancelled"];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: `Status must be one of: ${allowedStatuses.join(", ")}`,
      });
    }

    if (!status && estimatedDeliveryTime === undefined) {
      return res.status(400).json({
        message: "Status or estimatedDeliveryTime is required",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (status) {
      order.status = status;

      // Mark COD as paid once delivered.
      if (status === "Delivered" && order.paymentMethod === "COD") {
        order.paymentStatus = "Paid";
      }

      // If an already-paid order is cancelled (by admin), kick off the refund flow.
      // COD is excluded — cash for a COD order is only collected at delivery, so a
      // cancelled COD order never actually had money taken and must not show "refund".
      if (status === "Cancelled" && order.paymentStatus === "Paid" && order.paymentMethod !== "COD") {
        order.paymentStatus = "Refund Processing";
      }
    }

    if (estimatedDeliveryTime !== undefined) {
      if (!estimatedDeliveryTime) {
        order.estimatedDeliveryTime = null;
      } else {
        const parsed = new Date(estimatedDeliveryTime);
        if (!Number.isNaN(parsed.getTime())) {
          order.estimatedDeliveryTime = parsed;
        }
      }
    }

    await order.save();

    res.status(200).json({
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// CANCEL ORDER (order owner, or admin)
// If the order was already paid online, this starts the refund flow instead
// of instantly refunding — matches how real payment gateways behave.
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const isOwner = order.user.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (["Delivered", "Cancelled"].includes(order.status)) {
      return res.status(400).json({
        message: `This order is already ${order.status.toLowerCase()} and can't be cancelled`,
      });
    }

    order.status = "Cancelled";

    // Money already collected online? Start the refund instead of just
    // flipping a flag — the admin marks it "Refunded" once processed.
    // COD is excluded: cash is only collected at delivery, so a COD order
    // that gets cancelled beforehand never had any money taken.
    if (order.paymentStatus === "Paid" && order.paymentMethod !== "COD") {
      order.paymentStatus = "Refund Processing";
    }

    await order.save();

    res.status(200).json({
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE PAYMENT STATUS (admin only) — mainly used to mark a refund as
// complete once it has actually been processed outside this demo app.
const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const allowed = ["Pending", "Paid", "Failed", "Refund Processing", "Refunded"];

    if (!allowed.includes(paymentStatus)) {
      return res.status(400).json({
        message: `paymentStatus must be one of: ${allowed.join(", ")}`,
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.paymentStatus = paymentStatus;
    await order.save();

    res.status(200).json({
      message: "Payment status updated successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SET ESTIMATED DELIVERY DATE & TIME (admin only) — an exact date/time the
// admin picks per order (e.g. "12 Sep 2026, 8:45 PM").
const setDeliveryTime = async (req, res) => {
  try {
    const { estimatedDeliveryTime } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!estimatedDeliveryTime) {
      // Empty value clears it back to "not set yet".
      order.estimatedDeliveryTime = null;
    } else {
      const parsed = new Date(estimatedDeliveryTime);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ message: "Invalid delivery date/time" });
      }
      order.estimatedDeliveryTime = parsed;
    }

    await order.save();

    res.status(200).json({
      message: "Delivery time updated",
      order,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  simulatePayment,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  updatePaymentStatus,
  setDeliveryTime,
};
