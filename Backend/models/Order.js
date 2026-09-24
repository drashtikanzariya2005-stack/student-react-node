const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [
      {
        food: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Food",
          required: true,
        },

        name: {
          type: String,
          required: true,
        },

        price: {
          type: Number,
          required: true,
        },

        quantity: {
          type: Number,
          required: true,
        },
      },
    ],

    // Bill breakdown — all computed server-side in orderController so a
    // tampered client-side amount can never be trusted.
    subtotal: {
      type: Number,
      default: 0,
    },

    offerCode: { type: String, default: "" },

    discountAmount: { type: Number, default: 0 },

    deliveryFee: {
      type: Number,
      default: 0,
    },

    tax: {
      type: Number,
      default: 0,
    },

    // Grand total = subtotal + deliveryFee + tax. Kept as "totalAmount" since
    // the rest of the app (frontend, payment amount, etc.) already reads
    // this field name.
    totalAmount: {
      type: Number,
      required: true,
    },

    // Human-friendly invoice number shown on the bill/PDF, e.g. INV-20260909-000482
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Preparing", "Out for Delivery", "Delivered", "Cancelled"],
      default: "Pending",
    },

    // "COD"/"Card"/"UPI"/"Online" are all handled via the simulated
    // /api/orders/pay endpoint — this is a demo app, not a real payment
    // gateway integration.
    paymentMethod: {
      type: String,
      enum: ["COD", "Card", "UPI", "Online"],
      default: "COD",
    },

    // Exact delivery date & time the admin sets per order (via a
    // datetime-local picker). null until the admin sets it.
    estimatedDeliveryTime: {
      type: Date,
      default: null,
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refund Processing", "Refunded"],
      default: "Pending",
    },

    paymentId: {
      type: String,
      default: "",
    },

    deliveryAddress: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
